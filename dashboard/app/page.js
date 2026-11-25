import Shell from '../components/Shell.js';
import CopyButton from '../components/CopyButton.js';
import { requireLogin } from '../lib/auth.js';
import { loadDashboard } from '../lib/dashboard.js';
import { LEVELS } from '../lib/rules.js';
import { cur, last7, money, num } from '../lib/view.js';
import { syncNowAction, toggleTaskAction } from './actions.js';

export const dynamic = 'force-dynamic';

function fmtDate(iso) {
  if (!iso) return 'nunca';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default async function Hoje({ searchParams }) {
  await requireLogin();
  const sp = await searchParams;
  const d = await loadDashboard();
  const c = cur(d.settings);
  const t7 = last7(d.campaigns, d.settings, d.today);
  const groups = Object.keys(LEVELS).map((lv) => ({ lv, items: d.tasks.filter((t) => t.level === lv) })).filter((g) => g.items.length);
  const pending = d.tasks.filter((t) => !t.done && t.level === 'agir').length;
  const cv = d.page.current;

  return (
    <Shell settings={d.settings}>
      <h1>Hoje, {new Date(`${d.today}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
      <p className="sub">
        {pending ? `${pending} ${pending === 1 ? 'ação' : 'ações'} para fazer agora.` : 'Nenhuma ação urgente.'} Dados do Facebook atualizados em {fmtDate(d.sync)}.
      </p>

      {sp?.sync && sp.sync !== 'ok' ? <div className="banner bad"><span className="grow">Não consegui sincronizar: {decodeURIComponent(sp.sync)}</span></div> : null}
      {!d.metaOn && !d.settings.demo ? (
        <div className="banner warn">
          <span className="grow"><strong>Facebook não conectado.</strong> Sem isso, o painel não vê os criativos. Veja o passo a passo em Configurações.</span>
          <a className="btn" href="/config">Conectar</a>
        </div>
      ) : null}

      <section className="grid kpis" aria-label="Últimos 7 dias">
        <div className="card kpi"><div className="label">Gasto · 7 dias</div><div className="value">{money(t7.spend, c)}</div></div>
        <div className="card kpi"><div className="label">Vendas · 7 dias</div><div className="value">{t7.purchases}</div><div className="hint">pelo pixel do Facebook</div></div>
        <div className="card kpi"><div className="label">ROAS · 7 dias</div><div className="value">{num(t7.roas)}</div></div>
        <div className="card kpi"><div className="label">Lucro · 7 dias</div><div className={`value ${t7.profit >= 0 ? 'pos' : 'neg'}`}>{money(t7.profit, c)}</div><div className="hint">já descontada a taxa de {d.settings.taxa_plataforma_pct}%</div></div>
        <div className="card kpi"><div className="label">Página · versão {cv?.version || '—'}</div><div className="value">{cv?.funnel.visitors ?? 0}</div><div className="hint">visitantes nesta versão</div></div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h2>O que fazer hoje</h2>
        {d.metaOn ? <form action={syncNowAction}><button type="submit">Atualizar dados do Facebook</button></form> : null}
      </div>

      {groups.length === 0 ? <div className="card muted">Nada por aqui ainda. Assim que a oferta estiver conectada, as tarefas do dia aparecem aqui.</div> : null}

      {groups.map(({ lv, items }) => (
        <section key={lv} className="card group">
          <div className="group-head"><span className={`dot ${lv}`} aria-hidden="true" /> {LEVELS[lv].label} <span className="count">· {items.length}</span></div>
          {items.map((t) => (
            <div key={t.key} className={`task${t.done ? ' done' : ''}`}>
              <form action={toggleTaskAction}>
                <input type="hidden" name="key" value={t.key} />
                <input type="hidden" name="done" value={t.done ? '1' : '0'} />
                <button type="submit" className={`check${t.done ? ' on' : ''}`} aria-label={t.done ? 'Marcar como não feito' : 'Marcar como feito'} title={t.done ? 'Feito' : 'Marcar como feito'}>{t.done ? '✓' : ''}</button>
              </form>
              <div>
                <h3>
                  {t.title}
                  <span className="chip">{t.source === 'mentor' ? 'Regra do mentor' : 'Sugestão do Claude'}</span>
                </h3>
                <p>{t.detail}</p>
                {t.message ? (
                  <>
                    <div className="msg">{t.message}</div>
                    <div style={{ marginTop: 8 }}><CopyButton text={t.message} /></div>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ))}

      <h2>Regras que o painel segue</h2>
      <div className="card small muted">
        Teste: 3 primeiros dias sem mexer · fim do 3º dia, métricas no grupo · campanha no lucro não desativa ninguém · gastou 1 ticket sem vender, desativa · 1 venda, não mexe ainda · campeão no lucro no período inteiro vai para CBO 1-1-1 · criativo novo sempre em campanha nova.
        Escala: +20% por vez no lucro · 1 dia ruim não mexe · 3 dias ruins, período inteiro + 7 dias no grupo · subiu e piorou, volta · prejuízo sem venda em 3 dias, pausa.
      </div>
    </Shell>
  );
}
