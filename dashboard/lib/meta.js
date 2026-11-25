import { q } from './db.js';
import { addDays } from './rules.js';
import { getSettings, todayIn } from './settings.js';

// Sincroniza campanhas e resultados diários por anúncio da API de Marketing da Meta.
// Precisa de META_ACCESS_TOKEN e META_AD_ACCOUNT_ID (sem o "act_") nas variáveis do projeto.

const PURCHASE_TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];

function pickAction(list) {
  if (!Array.isArray(list)) return 0;
  for (const t of PURCHASE_TYPES) {
    const hit = list.find((a) => a.action_type === t);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
}

export function metaConfigured() {
  return Boolean(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

async function fetchAll(url, fetchImpl) {
  const out = [];
  let next = url;
  let guard = 0;
  while (next && guard++ < 50) {
    const res = await fetchImpl(next);
    const body = await res.json();
    if (!res.ok || body.error) {
      throw new Error(`Meta API: ${body.error?.message || res.status}`);
    }
    out.push(...(body.data || []));
    next = body.paging?.next || null;
  }
  return out;
}

export function parseInsightRow(r) {
  return {
    date: r.date_start,
    ad_id: r.ad_id,
    ad_name: r.ad_name,
    adset_id: r.adset_id,
    campaign_id: r.campaign_id,
    spend: Number(r.spend || 0),
    impressions: Number(r.impressions || 0),
    clicks: Number(r.inline_link_clicks ?? r.clicks ?? 0),
    purchases: Math.round(pickAction(r.actions)),
    revenue: pickAction(r.action_values),
  };
}

export async function syncMeta({ days = 30, fetchImpl = fetch } = {}) {
  if (!metaConfigured()) throw new Error('Meta não conectada: faltam META_ACCESS_TOKEN e META_AD_ACCOUNT_ID.');
  const version = process.env.META_API_VERSION || 'v24.0';
  const account = String(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, '');
  const token = encodeURIComponent(process.env.META_ACCESS_TOKEN);
  const base = `https://graph.facebook.com/${version}/act_${account}`;
  const settings = await getSettings();
  const today = todayIn(settings.fuso_horario);
  const since = addDays(today, -days);

  const campaigns = await fetchAll(
    `${base}/campaigns?fields=id,name,effective_status,daily_budget,bid_strategy,created_time&limit=200&access_token=${token}`,
    fetchImpl,
  );
  const ads = await fetchAll(`${base}/ads?fields=id,effective_status&limit=500&access_token=${token}`, fetchImpl);
  const adStatus = new Map(ads.map((a) => [a.id, a.effective_status]));
  const timeRange = encodeURIComponent(JSON.stringify({ since, until: today }));
  const insights = await fetchAll(
    `${base}/insights?level=ad&time_increment=1&time_range=${timeRange}&fields=campaign_id,adset_id,ad_id,ad_name,spend,impressions,clicks,inline_link_clicks,actions,action_values&limit=500&access_token=${token}`,
    fetchImpl,
  );

  for (const c of campaigns) {
    const created = c.created_time ? todayIn(settings.fuso_horario, new Date(c.created_time)) : today;
    const budget = c.daily_budget != null ? Number(c.daily_budget) / 100 : null;
    await q(
      `INSERT INTO campaigns (campaign_id, name, status, daily_budget, bid_strategy, created_date, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (campaign_id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status,
         daily_budget = EXCLUDED.daily_budget, bid_strategy = EXCLUDED.bid_strategy, updated_at = now()`,
      [c.id, c.name, c.effective_status, budget, c.bid_strategy || null, created],
    );
    if (budget != null) {
      await q(
        `INSERT INTO budget_history (campaign_id, date, daily_budget) VALUES ($1,$2,$3)
         ON CONFLICT (campaign_id, date) DO UPDATE SET daily_budget = EXCLUDED.daily_budget`,
        [c.id, today, budget],
      );
    }
  }

  for (const raw of insights) {
    const r = parseInsightRow(raw);
    await q(
      `INSERT INTO ad_daily (date, ad_id, ad_name, ad_status, adset_id, campaign_id, spend, impressions, clicks, purchases, revenue)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (date, ad_id) DO UPDATE SET ad_name = EXCLUDED.ad_name, ad_status = EXCLUDED.ad_status,
         spend = EXCLUDED.spend, impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks,
         purchases = EXCLUDED.purchases, revenue = EXCLUDED.revenue`,
      [r.date, r.ad_id, r.ad_name, adStatus.get(r.ad_id) || null, r.adset_id, r.campaign_id,
        r.spend, r.impressions, r.clicks, r.purchases, r.revenue],
    );
  }

  await q(
    `INSERT INTO settings (key, value) VALUES ('ultima_sync', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [new Date().toISOString()],
  );
  return { campaigns: campaigns.length, rows: insights.length };
}

export async function lastSync() {
  const r = await q(`SELECT value FROM settings WHERE key = 'ultima_sync'`);
  return r[0]?.value || null;
}
