// Motor de regras: transforma os dados do dia em uma lista de tarefas.
// Toda regra marcada "mentor" vem da call de 23/11 ou das respostas no grupo de suporte.
// Regras marcadas "sugestao" são heurísticas do Claude, mostradas como tal no painel.

export const LEVELS = {
  agir: { label: 'Fazer agora', order: 0 },
  grupo: { label: 'Mandar no grupo', order: 1 },
  aguardar: { label: 'Não mexer', order: 2 },
  info: { label: 'Para saber', order: 3 },
};

// ---------- utilidades ----------
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);
}

export function classifyCampaign(name = '', bidStrategy = '') {
  const n = name.toUpperCase();
  let kind = 'outra';
  if (/BID\s*CAP/.test(n) || /BID_CAP/.test(bidStrategy || '')) kind = 'bidcap';
  else if (/ESCALA/.test(n)) kind = 'escala';
  else if (/TESTE/.test(n)) kind = 'teste';
  const parts = n.split('|').map((p) => p.trim());
  const country = parts.find((p) => /^[A-Z]{2}$/.test(p)) || null;
  const lote = (n.match(/LOTE\s*(\d+)/) || [])[1] || null;
  return { kind, country, lote: lote ? Number(lote) : null };
}

export function money(v, currency = 'USD') {
  const sym = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : currency === 'BRL' ? 'R$' : currency;
  const n = Number(v || 0);
  return `${n < 0 ? "−" : ""}${sym}\u00a0${Math.abs(n).toFixed(2).replace(".", ",")}`;
}

export function economics(settings) {
  const ticket = Number(settings.ticket_eur) * Number(settings.eur_para_moeda_conta);
  const fee = Number(settings.taxa_plataforma_pct) / 100;
  return { ticket, fee, lance: ticket * 1.5 };
}

export function totals(days, fee) {
  const t = days.reduce(
    (a, d) => ({
      spend: a.spend + Number(d.spend || 0),
      purchases: a.purchases + Number(d.purchases || 0),
      revenue: a.revenue + Number(d.revenue || 0),
      impressions: a.impressions + Number(d.impressions || 0),
      clicks: a.clicks + Number(d.clicks || 0),
    }),
    { spend: 0, purchases: 0, revenue: 0, impressions: 0, clicks: 0 },
  );
  t.profit = t.revenue * (1 - fee) - t.spend;
  t.roas = t.spend > 0 ? t.revenue / t.spend : null;
  t.ctr = t.impressions > 0 ? (t.clicks / t.impressions) * 100 : null;
  t.cpc = t.clicks > 0 ? t.spend / t.clicks : null;
  return t;
}

function fmtPct(v) {
  return v == null ? '—' : `${v.toFixed(2).replace('.', ',')}%`;
}
function fmtNum(v, d = 2) {
  return v == null ? '—' : v.toFixed(d).replace('.', ',');
}

// Agrupa as linhas diárias de todos os anúncios de uma campanha por data.
function campaignDays(c) {
  const map = new Map();
  for (const ad of c.ads) {
    for (const d of ad.days) {
      const cur = map.get(d.date) || { date: d.date, spend: 0, purchases: 0, revenue: 0, impressions: 0, clicks: 0 };
      cur.spend += Number(d.spend || 0);
      cur.purchases += Number(d.purchases || 0);
      cur.revenue += Number(d.revenue || 0);
      cur.impressions += Number(d.impressions || 0);
      cur.clicks += Number(d.clicks || 0);
      map.set(d.date, cur);
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function dayTotal(days, date, fee) {
  return totals(days.filter((d) => d.date === date), fee);
}

function isActive(status) {
  return !status || ['ACTIVE', 'ATIVA', 'IN_PROCESS', 'WITH_ISSUES'].includes(String(status).toUpperCase());
}

// ---------- mensagens prontas para o grupo ----------
export function msgFimDia3(c, t, adStats, cur) {
  const linhas = adStats
    .map((a) => `- ${a.name}: gasto ${money(a.t.spend, cur)} · vendas ${a.t.purchases}`)
    .join('\n');
  return [
    `🧪 [${c.name}] — fim do dia 3`,
    `Gasto: ${money(t.spend, cur)} | Vendas: ${t.purchases} | ROAS: ${fmtNum(t.roas)}`,
    `CPC: ${t.cpc == null ? '—' : money(t.cpc, cur)} | CTR: ${fmtPct(t.ctr)}`,
    'Por criativo:',
    linhas,
    'O que vocês recomendam?',
  ].join('\n');
}

export function msgEscalaRuim(c, tAll, t7, lastBudgetChange, cur) {
  return [
    `🚀 [${c.name}] — 3 dias abaixo`,
    `Período inteiro: gasto ${money(tAll.spend, cur)} | vendas ${tAll.purchases} | ROAS ${fmtNum(tAll.roas)}`,
    `Últimos 7 dias: gasto ${money(t7.spend, cur)} | vendas ${t7.purchases} | ROAS ${fmtNum(t7.roas)}`,
    `Último ajuste de orçamento: ${lastBudgetChange ? `${money(lastBudgetChange.from, cur)} → ${money(lastBudgetChange.to, cur)} em ${lastBudgetChange.date}` : 'nenhum'}`,
    'Mantenho, volto o orçamento ou pauso?',
  ].join('\n');
}

// Última mudança de orçamento a partir dos registros diários.
export function lastBudgetChange(history = []) {
  const h = [...history].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = h.length - 1; i > 0; i--) {
    if (Number(h[i].daily_budget) !== Number(h[i - 1].daily_budget)) {
      return { date: h[i].date, from: Number(h[i - 1].daily_budget), to: Number(h[i].daily_budget) };
    }
  }
  return null;
}

// ---------- regras por tipo de campanha ----------
function rulesTeste(c, ctx) {
  const { today, fee, ticket, cur, escalaNames } = ctx;
  const tasks = [];
  const dayN = daysBetween(c.created_date, today) + 1;
  const days = campaignDays(c);
  const t = totals(days, fee);
  const adStats = c.ads.map((a) => ({ ...a, t: totals(a.days, fee) }));
  const base = { campaign: c.name, campaign_id: c.campaign_id };

  if (dayN <= 3) {
    tasks.push({
      ...base, key: `teste-espera-${c.campaign_id}`, level: 'aguardar', source: 'mentor',
      title: `${c.name}: dia ${dayN} de 3`,
      detail: 'Nos 3 primeiros dias a campanha de teste não é mexida: nada de desativar criativo nem mudar orçamento.',
    });
  }
  if (dayN === 3 || dayN === 4) {
    tasks.push({
      ...base, key: `teste-grupo-${c.campaign_id}`, level: 'grupo', source: 'mentor',
      title: dayN === 3 ? `${c.name}: hoje é o 3º dia — no fim do dia, mande as métricas` : `${c.name}: mande as métricas do 3º dia (se ainda não mandou)`,
      detail: 'Mande CPC, CTR, gasto e ROAS no grupo. A mentoria analisa e decide junto.',
      message: msgFimDia3(c, t, adStats, cur),
    });
  }
  if (dayN < 4) return tasks;

  if (t.profit >= 0 && t.purchases > 0) {
    tasks.push({
      ...base, key: `teste-lucro-${c.campaign_id}`, level: 'info', source: 'mentor',
      title: `${c.name}: no lucro no período (${money(t.profit, cur)})`,
      detail: 'Campanha no lucro: não precisa desativar os criativos que não vendem.',
    });
  } else if (t.purchases === 0 && t.spend > 0) {
    tasks.push({
      ...base, key: `teste-pausar-${c.campaign_id}`, level: 'agir', source: 'mentor',
      title: `Pausar ${c.name}`,
      detail: `No prejuízo (${money(t.profit, cur)}) e sem nenhuma venda. Pausa e parte para o próximo lote.`,
    });
    return tasks;
  } else {
    for (const a of adStats) {
      if (!isActive(a.status)) continue;
      if (a.t.spend >= ticket && a.t.purchases === 0) {
        tasks.push({
          ...base, key: `teste-desativar-${a.ad_id}`, level: 'agir', source: 'mentor',
          title: `Desativar o criativo "${a.name}"`,
          detail: `Gastou ${money(a.t.spend, cur)} (1 ticket = ${money(ticket, cur)}) e não vendeu. Não coloque outro no lugar: criativo novo vai em lote novo.`,
        });
      } else if (a.t.spend >= ticket && a.t.purchases === 1 && a.t.profit < 0) {
        tasks.push({
          ...base, key: `teste-1venda-${a.ad_id}`, level: 'aguardar', source: 'mentor',
          title: `"${a.name}": 1 venda — não mexe ainda`,
          detail: 'Gastou 1 ticket e fez 1 venda: deixa rodando.',
        });
      }
    }
  }

  for (const a of adStats) {
    if (!isActive(a.status)) continue;
    if (a.t.spend >= ticket && a.t.profit > 0 && !escalaNames.has(a.name.trim().toUpperCase())) {
      tasks.push({
        ...base, key: `teste-campeao-${a.ad_id}`, level: 'agir', source: 'mentor',
        title: `Isolar o campeão "${a.name}" numa CBO 1-1-1`,
        detail: `No lucro no período inteiro (${money(a.t.profit, cur)}, ${a.t.purchases} vendas). Crie uma campanha de ESCALA só com ele, orçamento padrão. Mantenha ele também no teste.`,
      });
    }
  }
  return tasks;
}

function rulesEscala(c, ctx) {
  const { today, fee, cur } = ctx;
  const tasks = [];
  const base = { campaign: c.name, campaign_id: c.campaign_id };
  const days = campaignDays(c);
  const tAll = totals(days, fee);
  const yesterday = addDays(today, -1);
  const last3 = [1, 2, 3].map((i) => dayTotal(days, addDays(today, -i), fee));
  const t7 = totals(days.filter((d) => d.date >= addDays(today, -7) && d.date < today), fee);
  const tY = last3[0];
  const ageDays = daysBetween(c.created_date, today);
  const change = lastBudgetChange(c.budget_history);
  const budget = Number(c.daily_budget || 0);

  if (ageDays >= 3 && last3.every((d) => d.purchases === 0) && tAll.profit < 0) {
    tasks.push({
      ...base, key: `escala-pausar-${c.campaign_id}`, level: 'agir', source: 'mentor',
      title: `Pausar ${c.name}`,
      detail: 'No prejuízo e sem nenhuma venda nos últimos 3 dias. Pausa e parte para o próximo teste.',
    });
    return tasks;
  }

  if (change && change.to > change.from && change.date < today) {
    const before = totals(days.filter((d) => d.date < change.date && d.date >= addDays(change.date, -3)), fee);
    const after = totals(days.filter((d) => d.date >= change.date && d.date < today), fee);
    const nBefore = Math.max(1, Math.min(3, daysBetween(addDays(change.date, -3), change.date)));
    const nAfter = Math.max(1, daysBetween(change.date, today));
    if (after.spend > 0 && after.profit / nAfter < before.profit / nBefore && after.profit < 0) {
      tasks.push({
        ...base, key: `escala-voltar-${c.campaign_id}`, level: 'agir', source: 'mentor',
        title: `${c.name}: voltar o orçamento para ${money(change.from, cur)}`,
        detail: `Subiu de ${money(change.from, cur)} para ${money(change.to, cur)} em ${change.date} e piorou. Volta para o anterior: costuma normalizar.`,
      });
      return tasks;
    }
  }

  if (ageDays >= 3 && last3.every((d) => d.spend > 0 && d.profit < 0)) {
    tasks.push({
      ...base, key: `escala-grupo-${c.campaign_id}`, level: 'grupo', source: 'mentor',
      title: `${c.name}: 3 dias ruins — mande no grupo`,
      detail: 'Mande o período inteiro e os últimos 7 dias para a mentoria analisar.',
      message: msgEscalaRuim(c, tAll, t7, change, cur),
    });
    return tasks;
  }

  if (tY.spend > 0 && tY.profit < 0) {
    tasks.push({
      ...base, key: `escala-diaruim-${c.campaign_id}`, level: 'aguardar', source: 'mentor',
      title: `${c.name}: ontem foi ruim — não mexe`,
      detail: 'Um dia ruim não justifica mudança. Deixa rodar e observa os próximos dias.',
    });
    return tasks;
  }

  const changedToday = change && change.date === today;
  if (tAll.profit > 0 && tY.profit > 0 && !changedToday && budget > 0) {
    tasks.push({
      ...base, key: `escala-subir-${c.campaign_id}`, level: 'agir', source: 'mentor',
      title: `${c.name}: subir 20% → ${money(budget * 1.2, cur)}`,
      detail: `No lucro no período (${money(tAll.profit, cur)}) e ontem (${money(tY.profit, cur)}). De ${money(budget, cur)} para ${money(budget * 1.2, cur)}. Um aumento por dia, no máximo.`,
    });
  }
  return tasks;
}

function rulesBidCap(c, ctx) {
  const { today, fee, lance, ticketMedio, cur } = ctx;
  const days = campaignDays(c);
  const tY = dayTotal(days, addDays(today, -1), fee);
  const base = { campaign: c.name, campaign_id: c.campaign_id };
  const tasks = [];
  if (tY.spend === 0 && daysBetween(c.created_date, today) >= 1) {
    const teto = ticketMedio ? ` Teto do lance = ticket médio (${money(ticketMedio, cur)}).` : '';
    tasks.push({
      ...base, key: `bidcap-naogasta-${c.campaign_id}`, level: 'agir', source: 'mentor',
      title: `${c.name}: não gastou ontem`,
      detail: `1) Confira se o pixel está recebendo a compra. 2) Suba criativo novo em conjunto novo (a cada 2 dias). 3) Só então suba o lance ~20%, sem passar do ticket médio.${teto} Lance de referência: ${money(lance, cur)} (1,5 × ticket).`,
    });
  }
  return tasks;
}

// ---------- regras da página ----------
export function diagnosePage(f) {
  // f: { visitors, s25, s50, s75, s100, cta, sales }
  if (!f || f.visitors === 0) return null;
  const steps = [
    { key: 'topo', label: 'Topo da página (chegou → rolou 25%)', from: f.visitors, to: f.s25, fix: 'Reforçar a primeira dobra: título, promessa e imagem. É o que a pessoa vê antes de decidir rolar.' },
    { key: 'meio', label: 'Meio da página (25% → 50%)', from: f.s25, to: f.s50, fix: 'O começo prende, mas o meio perde a pessoa. Encurtar, trazer prova (depoimentos, exemplos do material) mais para cima.' },
    { key: 'oferta', label: 'Chegada na oferta (50% → 75%)', from: f.s50, to: f.s75, fix: 'Antecipar a apresentação da oferta e do preço; deixar o que vem antes mais objetivo.' },
    { key: 'botao', label: 'Botão de compra (rolou 75% → clicou)', from: f.s75, to: f.cta, fix: 'A pessoa viu a oferta e não clicou: testar o texto e a cor do botão, deixar preço e bônus mais claros, colocar garantia perto do botão.' },
  ];
  if (f.sales != null && f.cta > 0) {
    steps.push({ key: 'checkout', label: 'Checkout (clicou → comprou)', from: f.cta, to: f.sales, fix: 'Clicam mas não compram: conferir o checkout (idioma, moeda, meios de pagamento) e se o preço bate com a página.' });
  }
  const scored = steps
    .filter((s) => s.from > 0)
    .map((s) => ({ ...s, loss: 1 - s.to / s.from, lost: s.from - s.to }));
  if (!scored.length) return null;
  scored.sort((a, b) => b.lost - a.lost);
  return { worst: scored[0], steps: scored };
}

function rulesPage(page, settings) {
  const tasks = [];
  if (!page || !page.current) return tasks;
  const per = Number(settings.visitantes_por_lote) || 40;
  const v = page.current;
  const visitors = v.funnel.visitors;
  const lotes = Math.floor(visitors / per);
  const faltam = per - (visitors % per);
  if (lotes >= 1) {
    const diag = diagnosePage(v.funnel);
    if (diag) {
      tasks.push({
        key: `pagina-lote-${v.version}-${lotes}`, level: 'agir', source: 'sugestao',
        title: `Página (versão ${v.version}): ${visitors} visitantes — hora da micro-alteração`,
        detail: `Maior perda: ${diag.worst.label}, ${(diag.worst.loss * 100).toFixed(0)}% saem aí. Sugestão: ${diag.worst.fix} Registre a mudança em "Mudanças" com uma versão nova.`,
      });
    }
  }
  tasks.push({
    key: `pagina-contador-${v.version}`, level: 'info', source: 'sugestao',
    title: `Página (versão ${v.version}): faltam ${faltam} visitantes para o próximo lote de ${per}`,
    detail: 'A cada lote de visitantes o Claude analisa onde as pessoas param e propõe uma micro-alteração.',
  });
  return tasks;
}

// ---------- regras gerais ----------
function rulesGeral(campaigns, ctx) {
  const { today, settings } = ctx;
  const tasks = [];
  const testes = campaigns.filter((c) => c.kind === 'teste');
  const byCountry = new Map();
  for (const c of testes) {
    const k = c.country || '—';
    if (!byCountry.has(k) || byCountry.get(k).created_date < c.created_date) byCountry.set(k, c);
  }
  const every = Number(settings.dias_entre_lotes) || 7;
  for (const [country, c] of byCountry) {
    const age = daysBetween(c.created_date, today);
    if (age >= every) {
      tasks.push({
        key: `geral-lote-${country}-${today}`, level: 'agir', source: 'sugestao',
        title: `Subir lote novo em ${country}`,
        detail: `O último lote de teste em ${country} foi criado há ${age} dias. Lote novo = campanha de teste NOVA (CBO 1-1-X, 5 a 10 criativos, orçamento padrão). Nunca colocar criativo novo numa campanha que já roda.`,
      });
    }
  }
  const totalPurchases = campaigns.reduce((a, c) => a + c.ads.reduce((b, ad) => b + ad.days.reduce((x, d) => x + Number(d.purchases || 0), 0), 0), 0);
  const gatilho = Number(settings.vendas_gatilho_bidcap) || 30;
  if (totalPurchases >= gatilho && !campaigns.some((c) => c.kind === 'bidcap')) {
    const { ticket, lance } = ctx;
    tasks.push({
      key: 'geral-bidcap', level: 'agir', source: 'mentor',
      title: `${totalPurchases} vendas no pixel: hora do Bid Cap`,
      detail: `Pegue o criativo de maior ROAS e suba em Bid Cap. Orçamento: 2 a 3 × o ticket (${money(ticket * 2, ctx.cur)} a ${money(ticket * 3, ctx.cur)}/dia; com 60+ criativos, até 6 ×). Lance: 1,5 × o ticket = ${money(lance, ctx.cur)}.`,
    });
  }
  return tasks;
}

// ---------- ponto de entrada ----------
export function buildTasks({ today, settings, campaigns, page, ticketMedio }) {
  const { ticket, fee, lance } = economics(settings);
  const cur = settings.moeda_conta || 'USD';
  const escalaNames = new Set();
  for (const c of campaigns) {
    if (c.kind === 'escala' || c.kind === 'bidcap') for (const a of c.ads) escalaNames.add(a.name.trim().toUpperCase());
  }
  const ctx = { today, settings, ticket, fee, lance, cur, escalaNames, ticketMedio };
  const tasks = [];
  for (const c of campaigns) {
    if (!isActive(c.status)) continue;
    if (c.kind === 'teste') tasks.push(...rulesTeste(c, ctx));
    else if (c.kind === 'escala') tasks.push(...rulesEscala(c, ctx));
    else if (c.kind === 'bidcap') tasks.push(...rulesBidCap(c, ctx));
  }
  tasks.push(...rulesGeral(campaigns.filter((c) => isActive(c.status)), ctx));
  tasks.push(...rulesPage(page, settings));
  return tasks.sort((a, b) => LEVELS[a.level].order - LEVELS[b.level].order);
}

export { campaignDays, isActive };
