import { apiKeyOk, isLoggedIn } from '../../../lib/auth.js';
import { loadDashboard } from '../../../lib/dashboard.js';
import { totals, economics } from '../../../lib/rules.js';

// Resumo completo em JSON para o Claude analisar (header x-api-key: CLAUDE_API_KEY).
export async function GET(req) {
  if (!apiKeyOk(req) && !(await isLoggedIn())) return Response.json({ erro: 'não autorizado' }, { status: 401 });
  const d = await loadDashboard();
  const { fee } = economics(d.settings);
  return Response.json({
    hoje: d.today,
    configuracoes: d.settings,
    tarefas: d.tasks,
    campanhas: d.campaigns.map((c) => ({
      id: c.campaign_id, nome: c.name, tipo: c.kind, pais: c.country, status: c.status, criada: c.created_date,
      orcamento: c.daily_budget, total: totals(c.ads.flatMap((a) => a.days), fee),
      anuncios: c.ads.map((a) => ({ id: a.ad_id, nome: a.name, status: a.status, total: totals(a.days, fee) })),
    })),
    pagina: d.page,
    vendas_hotmart: d.sales,
    mudancas: d.versions.changes,
  });
}
