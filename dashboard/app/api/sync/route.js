import { apiKeyOk, isLoggedIn } from '../../../lib/auth.js';
import { syncMeta } from '../../../lib/meta.js';

// Chamado pelo cron da Vercel (Authorization: Bearer CRON_SECRET), pelo Claude (x-api-key) ou logado.
export async function GET(req) {
  if (!apiKeyOk(req) && !(await isLoggedIn())) return Response.json({ erro: 'não autorizado' }, { status: 401 });
  try {
    return Response.json({ ok: true, ...(await syncMeta()) });
  } catch (e) {
    return Response.json({ ok: false, erro: e.message }, { status: 500 });
  }
}
