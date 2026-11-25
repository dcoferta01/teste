import { headers } from 'next/headers';
import Shell from '../../components/Shell.js';
import Funnel from '../../components/Funnel.js';
import { requireLogin } from '../../lib/auth.js';
import { loadDashboard } from '../../lib/dashboard.js';
import { diagnosePage } from '../../lib/rules.js';
import { pct } from '../../lib/view.js';

export const dynamic = 'force-dynamic';

function FunnelTable({ rows, label, hasSales }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{label}</th><th className="num">Visitantes</th><th className="num">Rolaram 50%</th><th className="num">Rolaram 75%</th><th className="num">Clicaram</th>{hasSales ? <th className="num">Compraram</th> : null}<th className="num">Taxa de clique</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.key}</td>
              <td className="num">{r.funnel.visitors}</td>
              <td className="num">{pct(r.funnel.s50, r.funnel.visitors)}</td>
              <td className="num">{pct(r.funnel.s75, r.funnel.visitors)}</td>
              <td className="num">{r.funnel.cta}</td>
              {hasSales ? <td className="num">{r.funnel.sales ?? 0}</td> : null}
              <td className="num">{pct(r.funnel.cta, r.funnel.visitors)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Pagina() {
  await requireLogin();
  const d = await loadDashboard();
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  const p = d.page;
  const cv = p.current;
  const per = Number(d.settings.visitantes_por_lote) || 40;
  const diag = cv ? diagnosePage(cv.funnel) : null;
  const snippet = `<script src="${proto}://${host}/t.js" data-versao="${cv?.version || 'v1'}" defer></script>`;
  const maxSec = Math.max(1, ...p.sections.map((s) => s.visitors));

  return (
    <Shell settings={d.settings}>
      <h1>Página de vendas</h1>
      <p className="sub">Onde as pessoas param na página. Números da versão atual{cv ? ` (${cv.version})` : ''}.</p>

      {!cv ? (
        <div className="card">
          <h3>Ainda não chegou nenhum visitante</h3>
          <p className="muted">Cole este código na página de vendas, antes do <code>&lt;/body&gt;</code>:</p>
          <code className="block">{snippet}</code>
        </div>
      ) : (
        <>
          <section className="grid kpis">
            <div className="card kpi"><div className="label">Visitantes (versão {cv.version})</div><div className="value">{cv.funnel.visitors}</div><div className="hint">faltam {per - (cv.funnel.visitors % per)} para o próximo lote de {per}</div></div>
            <div className="card kpi"><div className="label">Taxa de clique no botão</div><div className="value">{pct(cv.funnel.cta, cv.funnel.visitors)}</div></div>
            <div className="card kpi"><div className="label">Tempo na página (mediana)</div><div className="value">{p.time.median == null ? '—' : `${Math.round(p.time.median)}s`}</div></div>
            {p.hasSales ? <div className="card kpi"><div className="label">Compraram (Hotmart)</div><div className="value">{cv.funnel.sales}</div><div className="hint">{pct(cv.funnel.sales, cv.funnel.visitors)} dos visitantes</div></div> : null}
          </section>

          {diag ? (
            <div className="card diag" style={{ marginTop: 16 }}>
              <div className="status"><span className="dot agir" aria-hidden="true" /> Maior gargalo agora <span className="chip">Sugestão do Claude</span></div>
              <h3 style={{ marginTop: 6 }}>{diag.worst.label}: {Math.round(diag.worst.loss * 100)}% saem aqui ({diag.worst.lost} pessoas)</h3>
              <p className="muted" style={{ margin: 0 }}>{diag.worst.fix}</p>
              {cv.funnel.visitors < per ? <p className="small muted" style={{ marginBottom: 0 }}>Ainda com poucos visitantes: espere completar {per} antes de mudar.</p> : null}
            </div>
          ) : null}

          <h2>Funil</h2>
          <div className="card"><Funnel f={cv.funnel} showSales={p.hasSales} /></div>

          {p.sections.length ? (
            <>
              <h2>Até qual parte da página as pessoas chegam</h2>
              <div className="card">
                <div className="bars">
                  {p.sections.map((s) => (
                    <div className="barrow" key={s.name} title={`${s.name}: ${s.visitors} pessoas viram esta parte`}>
                      <span>{s.order}. {s.name}</span>
                      <div className="track"><div className="fill soft" style={{ width: `${(s.visitors / maxSec) * 100}%` }} /></div>
                      <span className="val">{s.visitors} <span className="muted small">· {pct(s.visitors, cv.funnel.visitors)}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="small muted">Dica: marque as partes da página com <code>data-secao="nome"</code> (ex.: topo, depoimentos, oferta, garantia) para ver exatamente em qual parte as pessoas desistem.</p>
          )}

          <h2>Por versão da página</h2>
          <FunnelTable rows={p.versions.map((v) => ({ key: v.version, funnel: v.funnel }))} label="Versão" hasSales={p.hasSales} />

          <h2>Por criativo (utm_content)</h2>
          <p className="sub small">Use <code>utm_content={'{{ad.name}}'}</code> nos links dos anúncios para saber de qual criativo veio cada visitante.</p>
          <FunnelTable rows={p.byCreative} label="Criativo" hasSales={p.hasSales} />

          <h2>Por país</h2>
          <FunnelTable rows={p.byCountry} label="País" hasSales={p.hasSales} />

          <h2>Código de rastreamento</h2>
          <div className="card small">
            <p className="muted" style={{ marginTop: 0 }}>Este é o código que vai na página. Ao publicar uma versão nova, troque o <code>data-versao</code> e registre a mudança na aba Mudanças.</p>
            <code className="block">{snippet}</code>
          </div>
        </>
      )}
    </Shell>
  );
}
