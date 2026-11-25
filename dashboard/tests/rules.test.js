import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTasks, classifyCampaign, diagnosePage, addDays, lastBudgetChange } from '../lib/rules.js';
import { parseInsightRow } from '../lib/meta.js';

const settings = {
  ticket_eur: 7.99, eur_para_moeda_conta: 1.0, taxa_plataforma_pct: 0, moeda_conta: 'USD',
  visitantes_por_lote: 40, dias_entre_lotes: 7, vendas_gatilho_bidcap: 30,
};
const today = '2026-11-25';

function camp(name, createdDaysAgo, ads, extra = {}) {
  return {
    campaign_id: name, name, status: 'ACTIVE', created_date: addDays(today, -createdDaysAgo),
    ...classifyCampaign(name), ads, budget_history: [], daily_budget: 9, ...extra,
  };
}
function ad(name, days, status = 'ACTIVE') {
  return { ad_id: name, name, status, days };
}
function day(offset, spend, purchases = 0, revenue = purchases * 7.99) {
  return { date: addDays(today, -offset), spend, purchases, revenue, impressions: 1000, clicks: 20 };
}
const keys = (tasks) => tasks.map((t) => t.key);

test('classifica campanhas pelo nome', () => {
  assert.deepEqual(classifyCampaign('EDU-INF | PT | TESTE LOTE 2'), { kind: 'teste', country: 'PT', lote: 2 });
  assert.equal(classifyCampaign('EDU-INF | IT | ESCALA Criativo 07').kind, 'escala');
  assert.equal(classifyCampaign('EDU-INF | PT | BIDCAP').kind, 'bidcap');
  assert.equal(classifyCampaign('qualquer', 'LOWEST_COST_WITH_BID_CAP').kind, 'bidcap');
});

test('teste nos dias 1 a 3: não mexer, e no dia 3 mandar métricas', () => {
  const c = camp('X | PT | TESTE LOTE 1', 2, [ad('A', [day(1, 20)])]); // dia 3
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(keys(t).includes('teste-espera-X | PT | TESTE LOTE 1'));
  const g = t.find((x) => x.level === 'grupo');
  assert.ok(g && g.message.includes('CPC'));
  assert.ok(!t.some((x) => x.key.startsWith('teste-desativar')));
});

test('dia 4+: prejuízo e zero vendas pausa a campanha', () => {
  const c = camp('X | PT | TESTE LOTE 1', 4, [ad('A', [day(3, 10), day(2, 10), day(1, 10)])]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(t.some((x) => x.key.startsWith('teste-pausar')));
});

test('dia 4+: campanha no prejuízo com vendas desativa quem gastou 1 ticket sem vender e mantém 1 venda', () => {
  const c = camp('X | PT | TESTE LOTE 1', 4, [
    ad('Perdedor', [day(2, 9)]),
    ad('UmaVenda', [day(2, 12, 1)]),
    ad('SemGasto', [day(2, 0.5)]),
  ]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(keys(t).includes('teste-desativar-Perdedor'));
  assert.ok(keys(t).includes('teste-1venda-UmaVenda'));
  assert.ok(!keys(t).some((k) => k.endsWith('SemGasto')));
});

test('dia 4+: campanha no lucro não desativa ninguém e isola o campeão', () => {
  const c = camp('X | PT | TESTE LOTE 1', 5, [
    ad('Campeao', [day(2, 10, 4)]),
    ad('NaoVende', [day(2, 9)]),
  ]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(!keys(t).some((k) => k.startsWith('teste-desativar')));
  assert.ok(keys(t).includes('teste-campeao-Campeao'));
});

test('campeão já isolado em escala não é sugerido de novo', () => {
  const teste = camp('X | PT | TESTE LOTE 1', 5, [ad('Campeao', [day(2, 10, 4)])]);
  const escala = camp('X | PT | ESCALA Campeao', 1, [ad('Campeao', [day(0, 3, 1)])]);
  const t = buildTasks({ today, settings, campaigns: [teste, escala] });
  assert.ok(!keys(t).includes('teste-campeao-Campeao'));
});

test('escala no lucro sobe 20%', () => {
  const c = camp('X | PT | ESCALA A', 5, [ad('A', [day(3, 10, 3), day(2, 10, 3), day(1, 10, 3)])], { daily_budget: 10 });
  const t = buildTasks({ today, settings, campaigns: [c] });
  const s = t.find((x) => x.key.startsWith('escala-subir'));
  assert.ok(s && s.title.includes('12,00'));
});

test('escala com 1 dia ruim: não mexe', () => {
  const c = camp('X | PT | ESCALA A', 5, [ad('A', [day(3, 10, 3), day(2, 10, 3), day(1, 10, 0)])]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(t.some((x) => x.key.startsWith('escala-diaruim')));
  assert.ok(!t.some((x) => x.key.startsWith('escala-subir')));
});

test('escala com 3 dias ruins: mandar no grupo', () => {
  const c = camp('X | PT | ESCALA A', 8, [ad('A', [day(5, 10, 5), day(3, 10, 1), day(2, 10, 1), day(1, 10, 1)])]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  const g = t.find((x) => x.key.startsWith('escala-grupo'));
  assert.ok(g && g.message.includes('Últimos 7 dias'));
});

test('escala no prejuízo sem venda em 3 dias: pausa', () => {
  const c = camp('X | PT | ESCALA A', 8, [ad('A', [day(3, 10), day(2, 10), day(1, 10)])]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(t.some((x) => x.key.startsWith('escala-pausar')));
});

test('escala: subiu orçamento e piorou → volta ao anterior', () => {
  const c = camp('X | PT | ESCALA A', 8, [ad('A', [day(5, 10, 3), day(4, 10, 3), day(3, 10, 3), day(2, 12, 1), day(1, 12, 1)])], {
    daily_budget: 12,
    budget_history: [{ date: addDays(today, -5), daily_budget: 10 }, { date: addDays(today, -2), daily_budget: 12 }],
  });
  assert.deepEqual(lastBudgetChange(c.budget_history), { date: addDays(today, -2), from: 10, to: 12 });
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(t.some((x) => x.key.startsWith('escala-voltar')));
});

test('gatilho do Bid Cap com 30 vendas', () => {
  const c = camp('X | PT | TESTE LOTE 1', 10, [ad('A', [day(5, 100, 30)])]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  const b = t.find((x) => x.key === 'geral-bidcap');
  assert.ok(b && b.detail.includes('11,9'));
});

test('lote novo sugerido depois de 7 dias', () => {
  const c = camp('X | IT | TESTE LOTE 1', 8, [ad('A', [day(5, 10, 3)])]);
  const t = buildTasks({ today, settings, campaigns: [c] });
  assert.ok(t.some((x) => x.key.startsWith('geral-lote-IT')));
});

test('diagnóstico da página aponta a maior perda', () => {
  const d = diagnosePage({ visitors: 40, s25: 35, s50: 12, s75: 10, s100: 8, cta: 6, sales: null });
  assert.equal(d.worst.key, 'meio');
});

test('página: tarefa de micro-alteração a cada 40 visitantes', () => {
  const page = { current: { version: 'v2', funnel: { visitors: 41, s25: 30, s50: 20, s75: 15, s100: 10, cta: 2, sales: null } } };
  const t = buildTasks({ today, settings, campaigns: [], page });
  assert.ok(t.some((x) => x.key === 'pagina-lote-v2-1'));
});

test('leitura das linhas da API da Meta', () => {
  const r = parseInsightRow({
    date_start: '2026-11-24', ad_id: '1', ad_name: 'A', campaign_id: 'c', spend: '9.5', impressions: '1000', clicks: '40', inline_link_clicks: '30',
    actions: [{ action_type: 'purchase', value: '2' }, { action_type: 'omni_purchase', value: '2' }],
    action_values: [{ action_type: 'omni_purchase', value: '17.2' }],
  });
  assert.equal(r.purchases, 2);
  assert.equal(r.revenue, 17.2);
  assert.equal(r.clicks, 30);
});
