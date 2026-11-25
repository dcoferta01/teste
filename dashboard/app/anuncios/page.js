import Shell from '../../components/Shell.js';
import { requireLogin } from '../../lib/auth.js';
import { loadDashboard } from '../../lib/dashboard.js';
import { daysBetween, economics, isActive, totals } from '../../lib/rules.js';
import { cur, money, num } from '../../lib/view.js';

export const dynamic = 'force-dynamic';

const KIND = { teste: '🧪 Teste', escala: '🚀 Escala', bidcap: '🎯 Bid Cap', outra: 'Outra' };

function Row({ name, t, c, status, rec }) {
  return (
    <tr>
      <td>{name}{rec ? <div className="small" style={{ whiteSpace: 'normal' }}><span className={`dot ${rec.level}`} aria-hidden="true" /> {rec.title}</div> : null}</td>
      <td>{status ? (isActive(status) ? 'Ativo' : 'Pausado') : '—'}</td>
      <td className="num">{money(t.spend, c)}</td>
      <td className="num">{t.purchases}</td>
      <td className="num">{num(t.roas)}</td>
      <td className="num">{t.ctr == null ? '—' : `${num(t.ctr)}%`}</td>
      <td className="num">{t.cpc == null ? '—' : money(t.cpc, c)}</td>
      <td className={`num ${t.profit >= 0 ? 'pos' : 'neg'}`}>{money(t.profit, c)}</td>
    </tr>
  );
}

export default async function Anuncios() {
  await requireLogin();
  const d = await loadDashboard();
  const c = cur(d.settings);
  const { fee, ticket } = economics(d.settings);
  const recByAd = new Map();
  const recByCamp = new Map();
  for (const t of d.tasks) {
    const adMatch = t.key.match(/^teste-(desativar|1venda|campeao)-(.+)$/);
    if (adMatch) recByAd.set(adMatch[2], t);
    else if (t.campaign_id && !recByCamp.has(t.campaign_id)) recByCamp.set(t.campaign_id, t);
  }
  const active = d.campaigns.filter((x) => isActive(x.status));
  const paused = d.campaigns.filter((x) => !isActive(x.status));

  const render = (list) => list.map((camp) => {
    const t = totals(camp.ads.flatMap((a) => a.days), fee);
    const dayN = daysBetween(camp.created_date, d.today) + 1;
    const rec = recByCamp.get(camp.campaign_id);
    return (
      <details key={camp.campaign_id} className="card camp" open={isActive(camp.status)}>
        <summary>
          <div className="camp-head">
            <span className="name">{camp.name}</span>
            <span className="muted small">{KIND[camp.kind]} · {camp.country || 'país?'} · dia {dayN} · orçamento {camp.daily_budget ? money(camp.daily_budget, c) : '—'}/dia</span>
            <span className="small">Gasto {money(t.spend, c)} · {t.purchases} {t.purchases === 1 ? "venda" : "vendas"} · ROAS {num(t.roas)} · <span className={t.profit >= 0 ? 'pos' : 'neg'}>{money(t.profit, c)}</span></span>
          </div>
          {rec ? <div className="small" style={{ marginTop: 6 }}><span className={`dot ${rec.level}`} aria-hidden="true" /> {rec.title}</div> : null}
        </summary>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>Criativo</th><th>Status</th><th className="num">Gasto</th><th className="num">Vendas</th><th className="num">ROAS</th><th className="num">CTR</th><th className="num">CPC</th><th className="num">Lucro</th></tr></thead>
            <tbody>
              {camp.ads.map((a) => <Row key={a.ad_id} name={a.name} status={a.status} t={totals(a.days, fee)} c={c} rec={recByAd.get(a.ad_id)} />)}
            </tbody>
          </table>
        </div>
      </details>
    );
  });

  return (
    <Shell settings={d.settings}>
      <h1>Anúncios</h1>
      <p className="sub">Período inteiro de cada campanha. 1 ticket = {money(ticket, c)} (€ {num(d.settings.ticket_eur)} no câmbio configurado). Lucro já desconta {d.settings.taxa_plataforma_pct}% de taxa.</p>
      <p className="sub small">Nome das campanhas: <code>OFERTA | PAÍS | TESTE LOTE 1</code>, <code>OFERTA | PAÍS | ESCALA Criativo 07</code> ou <code>OFERTA | PAÍS | BIDCAP</code>. É pelo nome que o painel sabe o tipo e o país.</p>
      {active.length ? render(active) : <div className="card muted">Nenhuma campanha ativa.</div>}
      {paused.length ? <><h2>Pausadas</h2>{render(paused)}</> : null}
    </Shell>
  );
}
