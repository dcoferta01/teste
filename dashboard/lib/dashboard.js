import { q } from './db.js';
import { getSettings, todayIn } from './settings.js';
import { loadCampaigns, loadPage, loadSalesSummary, loadVersions } from './metrics.js';
import { buildTasks } from './rules.js';
import { lastSync, metaConfigured } from './meta.js';

export async function loadDashboard() {
  const settings = await getSettings();
  const today = todayIn(settings.fuso_horario);
  const [campaigns, page, sales, versions, doneRows, sync] = await Promise.all([
    loadCampaigns(), loadPage(), loadSalesSummary(), loadVersions(),
    q('SELECT task_key FROM tasks_done WHERE date = $1', [today]),
    lastSync(),
  ]);
  // Ticket médio da Hotmart convertido para a moeda da conta (se as vendas vierem em euro).
  let ticketMedio = null;
  if (sales.ticketMedio) {
    ticketMedio = sales.currency === 'EUR' ? sales.ticketMedio * Number(settings.eur_para_moeda_conta) : sales.ticketMedio;
  }
  const tasks = buildTasks({ today, settings, campaigns, page, ticketMedio });
  const done = new Set(doneRows.map((r) => r.task_key));
  return {
    settings, today, campaigns, page, sales, versions, sync,
    metaOn: metaConfigured(),
    tasks: tasks.map((t) => ({ ...t, done: done.has(t.key) })),
  };
}
