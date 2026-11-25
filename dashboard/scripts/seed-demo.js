// Gera dados de exemplo para ver o painel funcionando antes de conectar a oferta.
// Uso: npm run seed   (apaga e recria os dados do banco local ou do DATABASE_URL)
import { q } from '../lib/db.js';
import { addDays } from '../lib/rules.js';
import { saveSettings, todayIn, DEFAULT_SETTINGS } from '../lib/settings.js';

let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const today = todayIn(DEFAULT_SETTINGS.fuso_horario);

for (const t of ['events', 'campaigns', 'budget_history', 'ad_daily', 'sales', 'page_changes', 'tasks_done']) {
  await q(`DELETE FROM ${t}`);
}
await saveSettings({ demo: 'true' });

// ---------- campanhas ----------
const camps = [
  { id: 'c1', name: 'EDU-INF | PT | TESTE LOTE 1', created: -6, budget: 9, ads: [
    ['Criativo 01 - foto atividades', 9, 1], ['Criativo 02 - antes e depois', 8, 0], ['Criativo 03 - vídeo mãe', 22, 7],
    ['Criativo 04 - carrossel', 3, 0], ['Criativo 05 - depoimento', 12, 4], ['Criativo 06 - problema/solução', 9.5, 0],
  ] },
  { id: 'c2', name: 'EDU-INF | PT | TESTE LOTE 2', created: -2, budget: 9, ads: [
    ['Criativo 07 - vídeo rotina', 7, 1], ['Criativo 08 - foto kit', 4, 0], ['Criativo 09 - meme', 2, 0], ['Criativo 10 - lista', 5, 1],
  ] },
  { id: 'c3', name: 'EDU-INF | IT | TESTE LOTE 1', created: -5, budget: 9, ads: [
    ['Creativo 01 - attività', 14, 1], ['Creativo 02 - mamma', 11, 0], ['Creativo 03 - prima e dopo', 9, 0], ['Creativo 04 - kit', 3, 0],
  ] },
  { id: 'c4', name: 'EDU-INF | FR | TESTE LOTE 1', created: -4, budget: 9, ads: [
    ['Créatif 01 - activités', 12, 0], ['Créatif 02 - maman', 10, 0], ['Créatif 03 - avant après', 5, 0],
  ] },
  { id: 'c5', name: 'EDU-INF | PT | ESCALA Criativo 03 - vídeo mãe', created: -5, budget: 10.8, ads: [['Criativo 03 - vídeo mãe', 45, 14]] },
];

const ticket = 7.99 * DEFAULT_SETTINGS.eur_para_moeda_conta;
for (const c of camps) {
  await q('INSERT INTO campaigns (campaign_id, name, status, daily_budget, bid_strategy, created_date) VALUES ($1,$2,$3,$4,$5,$6)',
    [c.id, c.name, 'ACTIVE', c.budget, 'LOWEST_COST_WITHOUT_CAP', addDays(today, c.created)]);
  if (c.id === 'c5') {
    for (let i = c.created; i <= 0; i++) {
      await q('INSERT INTO budget_history VALUES ($1,$2,$3)', [c.id, addDays(today, i), i < -2 ? 9 : 10.8]);
    }
  }
  const nDays = -c.created + 1;
  let adIdx = 0;
  for (const [name, spendTotal, sales] of c.ads) {
    adIdx++;
    const adId = `${c.id}-a${adIdx}`;
    const status = c.id === 'c1' && adIdx === 4 ? 'PAUSED' : 'ACTIVE';
    let salesLeft = sales;
    for (let i = 0; i < nDays; i++) {
      const date = addDays(today, c.created + i);
      const spend = Math.round((spendTotal / nDays) * (0.7 + rnd() * 0.6) * 100) / 100;
      // vendas distribuídas; na escala, garante vendas ontem
      let p = 0;
      if (salesLeft > 0 && (rnd() < sales / nDays || i === nDays - 2)) { p = Math.min(salesLeft, 1 + Math.floor(rnd() * 2)); salesLeft -= p; }
      if (i === nDays - 1) { p += salesLeft; salesLeft = 0; }
      const imp = Math.round(spend * (900 + rnd() * 400));
      const clicks = Math.round(imp * (0.012 + rnd() * 0.012));
      const revenue = p * ticket * (1 + rnd() * 0.5);
      await q('INSERT INTO ad_daily VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [date, adId, name, status, `${c.id}-s1`, c.id, spend, imp, clicks, p, Math.round(revenue * 100) / 100]);
    }
  }
}

// ---------- página ----------
await q(`INSERT INTO page_changes (ts, version, description, hypothesis, author) VALUES ($1,'v1','Versão inicial da página', null, 'David')`, [`${addDays(today, -6)}T10:00:00Z`]);
await q(`INSERT INTO page_changes (ts, version, description, hypothesis, author) VALUES ($1,'v2','Título novo no topo e depoimentos subiram para logo depois da primeira dobra','Mais gente passa da metade da página','Claude')`, [`${addDays(today, -2)}T10:00:00Z`]);

const sections = ['topo', 'problema', 'como-funciona', 'depoimentos', 'oferta', 'garantia', 'faq'];
const creatives = ['Criativo 03 - vídeo mãe', 'Criativo 05 - depoimento', 'Criativo 07 - vídeo rotina', 'Creativo 01 - attività', 'Créatif 01 - activités'];
const countryOf = (cr) => (cr.startsWith('Creativo') ? 'IT' : cr.startsWith('Créatif') ? 'FR' : 'PT');

async function visitors(version, n, fromDay, toDay, probs) {
  for (let i = 0; i < n; i++) {
    const vid = `demo-${version}-${i}`;
    const date = addDays(today, fromDay + Math.floor(rnd() * (toDay - fromDay + 1)));
    const ts = new Date(`${date}T${String(8 + Math.floor(rnd() * 14)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00-03:00`);
    const cr = creatives[Math.floor(rnd() * creatives.length)];
    const base = [vid, `s-${vid}`, version, '/', 'facebook', 'EDU-INF', cr, countryOf(cr), rnd() < 0.85 ? 'mobile' : 'desktop'];
    const ev = async (type, value, sec = 0) => q(
      `INSERT INTO events (ts, visitor_id, session_id, type, value, page_version, path, utm_source, utm_campaign, utm_content, country, device)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [new Date(ts.getTime() + sec * 1000).toISOString(), base[0], base[1], type, value, ...base.slice(2)]);
    await ev('pageview', null);
    let depth = 0;
    for (const [m, pr] of [[25, probs[0]], [50, probs[1]], [75, probs[2]], [100, probs[3]]]) {
      if (rnd() < pr) { depth = m; await ev('scroll', String(m), m / 2); } else break;
    }
    const secCount = Math.max(1, Math.round((depth / 100) * sections.length + (depth ? 0 : 1)));
    for (let s = 0; s < Math.min(secCount, sections.length); s++) await ev('secao', `0${s + 1}|${sections[s]}`, s * 8);
    let clicked = false;
    if (depth >= 75 && rnd() < probs[4]) { clicked = true; await ev('cta_click', 'Quero o material', 70); }
    await ev('tempo', String(Math.round(10 + depth * 1.4 + rnd() * 40)), 90);
    if (clicked && rnd() < 0.45) {
      const tx = `HP${version}${i}`;
      await q(`INSERT INTO sales (transaction_id, ts, status, product, value, currency, is_bump, sck, src) VALUES ($1,$2,'APPROVED','Educação infantil',7.99,'EUR',false,$3,$4)`, [tx, ts.toISOString(), vid, version]);
      if (rnd() < 0.4) await q(`INSERT INTO sales (transaction_id, ts, status, product, value, currency, is_bump, sck, src) VALUES ($1,$2,'APPROVED','Bump',4,'EUR',true,$3,$4)`, [`${tx}B`, ts.toISOString(), vid, version]);
    }
  }
}
await visitors('v1', 120, -6, -3, [0.78, 0.42, 0.34, 0.26, 0.35]);
await visitors('v2', 52, -2, 0, [0.8, 0.6, 0.45, 0.33, 0.25]);

console.log(`Dados de exemplo criados para ${today}.`);
process.exit(0);
