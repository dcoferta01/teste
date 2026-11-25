import { headers } from 'next/headers';
import Shell from '../../components/Shell.js';
import { requireLogin } from '../../lib/auth.js';
import { getSettings } from '../../lib/settings.js';
import { lastSync, metaConfigured } from '../../lib/meta.js';
import { saveSettingsAction } from '../actions.js';

export const dynamic = 'force-dynamic';

function Line({ ok, title, children }) {
  return (
    <div className="ok-line">
      <span className="status" style={{ minWidth: 110 }}><span className={`dot ${ok ? 'info' : 'grupo'}`} aria-hidden="true" />{ok ? 'Conectado' : 'Pendente'}</span>
      <span className="grow"><strong>{title}</strong><div className="small muted">{children}</div></span>
    </div>
  );
}

const FIELDS = [
  ['oferta_nome', 'Nome da oferta', 'Aparece no topo do painel.'],
  ['ticket_eur', 'Preço do produto (€)', 'O "1 ticket" das regras.'],
  ['bumps_eur', 'Order bumps (€)', 'Só para referência.'],
  ['moeda_conta', 'Moeda da conta de anúncio', 'USD, EUR ou BRL.'],
  ['eur_para_moeda_conta', 'Câmbio: 1 € vale quanto na moeda da conta', 'Atualize de vez em quando.'],
  ['taxa_plataforma_pct', 'Taxa da Hotmart (%)', 'Descontada da venda para calcular o lucro. Confira o valor real na sua conta.'],
  ['orcamento_teste', 'Orçamento padrão da campanha de teste', 'Regra do mentor: 9 (~R$ 40) por campanha.'],
  ['visitantes_por_lote', 'Visitantes por lote da página', 'A cada quantos visitantes analisar a página.'],
  ['dias_entre_lotes', 'Dias entre lotes de criativos', 'Quando lembrar de subir lote novo.'],
  ['vendas_gatilho_bidcap', 'Vendas para ir para Bid Cap', 'Mentor: 30 a 50.'],
  ['fuso_horario', 'Fuso horário', 'Ex.: America/Sao_Paulo. Use o mesmo da conta de anúncio.'],
];

export default async function Config({ searchParams }) {
  await requireLogin();
  const sp = await searchParams;
  const s = await getSettings();
  const sync = await lastSync();
  const h = await headers();
  const base = `${h.get('x-forwarded-proto') || 'https'}://${h.get('x-forwarded-host') || h.get('host')}`;

  return (
    <Shell settings={s}>
      <h1>Configurações</h1>
      {sp?.salvo ? <div className="banner"><span className="grow">Configurações salvas.</span></div> : null}

      <h2>Conexões</h2>
      <div className="card">
        <Line ok={Boolean(process.env.DATABASE_URL) || !process.env.VERCEL} title="Banco de dados">Na Vercel: Storage → criar um banco Postgres (Neon) e conectar ao projeto. Isso cria a variável DATABASE_URL.</Line>
        <Line ok={Boolean(process.env.DASHBOARD_PASSWORD)} title="Senha do painel">Variável DASHBOARD_PASSWORD no projeto da Vercel.</Line>
        <Line ok={metaConfigured()} title="Facebook (gerenciador de anúncios)">
          Variáveis META_ACCESS_TOKEN (token de um usuário do sistema com permissão ads_read) e META_AD_ACCOUNT_ID (número da conta, sem "act_"). Última atualização: {sync ? new Date(sync).toLocaleString('pt-BR') : 'nunca'}.
        </Line>
        <Line ok={Boolean(process.env.HOTMART_HOTTOK)} title="Hotmart (vendas reais)">Webhook: <code>{base}/api/hotmart</code> · variável HOTMART_HOTTOK com o hottok da sua conta.</Line>
        <Line ok={Boolean(process.env.CLAUDE_API_KEY)} title="Acesso do Claude">Variável CLAUDE_API_KEY. O Claude lê <code>{base}/api/summary</code> para analisar e propor mudanças.</Line>
        <Line ok={Boolean(process.env.CRON_SECRET)} title="Atualização automática">Variável CRON_SECRET. A Vercel puxa os dados do Facebook todo dia.</Line>
      </div>

      <h2>Oferta e regras</h2>
      <form action={saveSettingsAction} className="card stack">
        <div className="two">
          {FIELDS.map(([key, label, help]) => (
            <label className="field" key={key}>{label}<span className="help">{help}</span><input name={key} defaultValue={String(s[key])} /></label>
          ))}
        </div>
        <div><button type="submit" className="primary">Salvar</button></div>
      </form>

      <h2>Código para a página de vendas</h2>
      <div className="card small">
        <code className="block">{`<script src="${base}/t.js" data-versao="v1" defer></script>`}</code>
        <ul className="muted">
          <li>Partes da página: <code>data-secao="topo"</code>, <code>data-secao="depoimentos"</code>…</li>
          <li>Botões de compra: links para <code>pay.hotmart.com</code> são reconhecidos sozinhos. Outros botões: <code>data-cta="nome"</code>.</li>
          <li>Nos anúncios, use <code>utm_content={'{{ad.name}}'}</code> para saber de qual criativo veio o visitante.</li>
        </ul>
      </div>
    </Shell>
  );
}
