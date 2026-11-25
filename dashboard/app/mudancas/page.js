import Shell from '../../components/Shell.js';
import { requireLogin } from '../../lib/auth.js';
import { loadDashboard } from '../../lib/dashboard.js';
import { pct } from '../../lib/view.js';
import { addChangeAction } from '../actions.js';

export const dynamic = 'force-dynamic';

export default async function Mudancas({ searchParams }) {
  await requireLogin();
  const sp = await searchParams;
  const d = await loadDashboard();
  const versions = d.page.versions;
  const next = `v${versions.length + 1}`;

  return (
    <Shell settings={d.settings}>
      <h1>Mudanças na página</h1>
      <p className="sub">Cada micro-alteração vira uma versão nova. Assim dá para comparar se melhorou.</p>
      {sp?.salvo ? <div className="banner"><span className="grow">Mudança registrada. Lembre de trocar o <code>data-versao</code> no código da página para <strong>{versions.at(-1)?.version}</strong>.</span></div> : null}

      <h2>Histórico</h2>
      {versions.length === 0 ? <div className="card muted">Nenhuma versão ainda.</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Versão</th><th>O que mudou</th><th className="num">Visitantes</th><th className="num">Rolaram 50%</th><th className="num">Clicaram</th><th className="num">Taxa de clique</th><th className="num">vs. anterior</th></tr></thead>
            <tbody>
              {versions.map((v, i) => {
                const prev = versions[i - 1];
                const rate = v.funnel.visitors ? v.funnel.cta / v.funnel.visitors : null;
                const prate = prev && prev.funnel.visitors ? prev.funnel.cta / prev.funnel.visitors : null;
                const diff = rate != null && prate != null ? (rate - prate) * 100 : null;
                return (
                  <tr key={v.version}>
                    <td><strong>{v.version}</strong>{v.change ? <div className="small muted">{new Date(v.change.ts).toLocaleDateString('pt-BR')}{v.change.author ? ` · ${v.change.author}` : ''}</div> : null}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 220 }}>{v.change?.description || <span className="muted">—</span>}{v.change?.hypothesis ? <div className="small muted">Hipótese: {v.change.hypothesis}</div> : null}</td>
                    <td className="num">{v.funnel.visitors}</td>
                    <td className="num">{pct(v.funnel.s50, v.funnel.visitors)}</td>
                    <td className="num">{v.funnel.cta}</td>
                    <td className="num">{pct(v.funnel.cta, v.funnel.visitors)}</td>
                    <td className={`num ${diff == null ? '' : diff >= 0 ? 'pos' : 'neg'}`}>{diff == null ? '—' : `${diff >= 0 ? '+' : '−'}${Math.abs(diff).toFixed(1).replace('.', ',')} p.p.`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">Com menos de 40 visitantes por versão, a diferença pode ser só acaso. Para vendas, é preciso bem mais visitantes.</p>

      <h2>Registrar nova versão</h2>
      <form action={addChangeAction} className="card stack">
        <div className="two">
          <label className="field">Versão<input name="version" defaultValue={next} required maxLength={32} /></label>
          <label className="field">Quem fez<input name="author" placeholder="Claude, David..." maxLength={60} /></label>
        </div>
        <label className="field">O que mudou<textarea name="description" rows={3} placeholder="Ex.: troquei o título do topo e subi os depoimentos para logo depois da primeira dobra" /></label>
        <label className="field">Hipótese<span className="help">O que você espera que melhore.</span><textarea name="hypothesis" rows={2} placeholder="Ex.: mais gente passa dos 50% da página" /></label>
        <div><button type="submit" className="primary">Registrar versão</button></div>
      </form>
    </Shell>
  );
}
