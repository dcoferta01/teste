import { q } from './db.js';
import { classifyCampaign } from './rules.js';

const APPROVED = `status IN ('APPROVED','COMPLETE','PURCHASE_APPROVED','PURCHASE_COMPLETE')`;

// Campanhas + anúncios + dias, no formato que o motor de regras espera.
export async function loadCampaigns() {
  const [camps, rows, hist] = await Promise.all([
    q('SELECT * FROM campaigns ORDER BY created_date DESC, name'),
    q('SELECT * FROM ad_daily ORDER BY date'),
    q('SELECT * FROM budget_history ORDER BY date'),
  ]);
  return camps.map((c) => {
    const ads = new Map();
    for (const r of rows) {
      if (r.campaign_id !== c.campaign_id) continue;
      if (!ads.has(r.ad_id)) ads.set(r.ad_id, { ad_id: r.ad_id, name: r.ad_name || r.ad_id, status: r.ad_status, days: [] });
      const ad = ads.get(r.ad_id);
      ad.status = r.ad_status || ad.status;
      ad.days.push({
        date: r.date, spend: Number(r.spend), impressions: Number(r.impressions), clicks: Number(r.clicks),
        purchases: Number(r.purchases), revenue: Number(r.revenue),
      });
    }
    return {
      ...c,
      daily_budget: c.daily_budget == null ? null : Number(c.daily_budget),
      ...classifyCampaign(c.name, c.bid_strategy),
      ads: [...ads.values()],
      budget_history: hist.filter((h) => h.campaign_id === c.campaign_id).map((h) => ({ date: h.date, daily_budget: Number(h.daily_budget) })),
    };
  });
}

export async function loadVersions() {
  const changes = await q('SELECT * FROM page_changes ORDER BY ts');
  const seen = await q(`SELECT page_version, min(ts) AS first_ts FROM events WHERE page_version IS NOT NULL GROUP BY page_version ORDER BY first_ts`);
  const order = [];
  for (const c of changes) if (!order.includes(c.version)) order.push(c.version);
  for (const s of seen) if (!order.includes(s.page_version)) order.push(s.page_version);
  return { order, changes };
}

function funnelSelect(groupExpr) {
  return `
    SELECT ${groupExpr} AS grp,
      count(DISTINCT visitor_id) FILTER (WHERE type = 'pageview') AS visitors,
      count(DISTINCT visitor_id) FILTER (WHERE type = 'scroll' AND value::int >= 25) AS s25,
      count(DISTINCT visitor_id) FILTER (WHERE type = 'scroll' AND value::int >= 50) AS s50,
      count(DISTINCT visitor_id) FILTER (WHERE type = 'scroll' AND value::int >= 75) AS s75,
      count(DISTINCT visitor_id) FILTER (WHERE type = 'scroll' AND value::int >= 100) AS s100,
      count(DISTINCT visitor_id) FILTER (WHERE type = 'cta_click') AS cta
    FROM events
    WHERE ($1::text IS NULL OR page_version = $1)
    GROUP BY 1`;
}

function salesByGroup(groupExpr) {
  return `
    SELECT ${groupExpr} AS grp, count(DISTINCT s.transaction_id) AS sales
    FROM sales s
    JOIN (SELECT DISTINCT ON (visitor_id) visitor_id, page_version, utm_content, country
          FROM events WHERE type = 'pageview' ORDER BY visitor_id, ts) e ON e.visitor_id = s.sck
    WHERE s.${APPROVED} AND NOT s.is_bump AND ($1::text IS NULL OR e.page_version = $1)
    GROUP BY 1`;
}

function toFunnel(r, salesMap, hasSales) {
  const f = {
    visitors: Number(r.visitors), s25: Number(r.s25), s50: Number(r.s50), s75: Number(r.s75),
    s100: Number(r.s100), cta: Number(r.cta),
  };
  f.sales = hasSales ? Number(salesMap.get(r.grp) || 0) : null;
  return f;
}

export async function loadPage() {
  const { order, changes } = await loadVersions();
  const hasSales = Number((await q('SELECT count(*) AS n FROM sales'))[0].n) > 0;

  const groupBy = async (expr, salesExpr, version = null) => {
    const [rows, sales] = await Promise.all([
      q(funnelSelect(expr), [version]),
      hasSales ? q(salesByGroup(salesExpr), [version]) : Promise.resolve([]),
    ]);
    const sm = new Map(sales.map((s) => [s.grp, s.sales]));
    return rows.map((r) => ({ key: r.grp, funnel: toFunnel(r, sm, hasSales) }));
  };

  const versions = await groupBy('page_version', 'e.page_version');
  const byVersion = new Map(versions.map((v) => [v.key, v.funnel]));
  const versionList = order.map((v) => ({
    version: v,
    funnel: byVersion.get(v) || { visitors: 0, s25: 0, s50: 0, s75: 0, s100: 0, cta: 0, sales: hasSales ? 0 : null },
    change: [...changes].reverse().find((c) => c.version === v) || null,
  }));
  const current = versionList.length ? versionList[versionList.length - 1] : null;
  const cv = current ? current.version : null;

  const [byCreative, byCountry, sections, timeRow, daily] = await Promise.all([
    groupBy(`coalesce(nullif(utm_content, ''), '(sem utm_content)')`, `coalesce(nullif(e.utm_content, ''), '(sem utm_content)')`, cv),
    groupBy(`coalesce(country, '—')`, `coalesce(e.country, '—')`, cv),
    q(`SELECT value, count(DISTINCT visitor_id) AS n FROM events WHERE type = 'secao' AND ($1::text IS NULL OR page_version = $1) GROUP BY value ORDER BY value`, [cv]),
    q(`SELECT avg(t) AS avg_s, percentile_cont(0.5) WITHIN GROUP (ORDER BY t) AS med_s FROM (
         SELECT visitor_id, max(value::numeric) AS t FROM events WHERE type = 'tempo' AND ($1::text IS NULL OR page_version = $1) GROUP BY visitor_id) x`, [cv]),
    q(`SELECT to_char(ts, 'YYYY-MM-DD') AS d, count(DISTINCT visitor_id) AS n FROM events
         WHERE type = 'pageview' AND ts > now() - interval '14 days' GROUP BY 1 ORDER BY 1`),
  ]);

  return {
    hasSales,
    versions: versionList,
    current: current ? { ...current, funnel: current.funnel } : null,
    byCreative: byCreative.sort((a, b) => b.funnel.visitors - a.funnel.visitors),
    byCountry: byCountry.sort((a, b) => b.funnel.visitors - a.funnel.visitors),
    sections: sections.map((s) => {
      const [idx, ...rest] = String(s.value).split('|');
      return { order: Number(idx) || 0, name: rest.join('|') || s.value, visitors: Number(s.n) };
    }).sort((a, b) => a.order - b.order),
    time: { avg: timeRow[0]?.avg_s == null ? null : Number(timeRow[0].avg_s), median: timeRow[0]?.med_s == null ? null : Number(timeRow[0].med_s) },
    daily: daily.map((d) => ({ date: d.d, visitors: Number(d.n) })),
  };
}

export async function loadSalesSummary() {
  const rows = await q(`SELECT is_bump, count(*) AS n, sum(value) AS total, min(currency) AS currency FROM sales WHERE ${APPROVED} GROUP BY is_bump`);
  const main = rows.find((r) => !r.is_bump) || { n: 0, total: 0 };
  const bump = rows.find((r) => r.is_bump) || { n: 0, total: 0 };
  const n = Number(main.n);
  const total = Number(main.total || 0) + Number(bump.total || 0);
  return {
    vendas: n,
    bumps: Number(bump.n),
    faturamento: total,
    ticketMedio: n > 0 ? total / n : null,
    currency: main.currency || bump.currency || null,
  };
}
