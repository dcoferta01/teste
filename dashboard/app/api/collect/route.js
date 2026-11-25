import { q } from '../../../lib/db.js';

const TYPES = new Set(['pageview', 'scroll', 'secao', 'cta_click', 'tempo']);
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
const cut = (v, n = 120) => (v == null ? null : String(v).slice(0, n));

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(req) {
  let body;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new Response('json inválido', { status: 400, headers: CORS });
  }
  if (!body || !TYPES.has(body.t) || !body.v) return new Response('evento inválido', { status: 400, headers: CORS });
  if (body.t === 'scroll' && ![25, 50, 75, 100].includes(Number(body.val))) return new Response('scroll inválido', { status: 400, headers: CORS });
  if (body.t === 'tempo' && !(Number(body.val) >= 0 && Number(body.val) < 86400)) return new Response('tempo inválido', { status: 400, headers: CORS });
  const ua = req.headers.get('user-agent') || '';
  const device = /mobi|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';
  const country = req.headers.get('x-vercel-ip-country') || null;
  await q(
    `INSERT INTO events (visitor_id, session_id, type, value, page_version, path, utm_source, utm_campaign, utm_content, country, device)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [cut(body.v, 64), cut(body.s, 64), body.t, cut(body.val), cut(body.pv, 32) || 'v1', cut(body.p, 200),
      cut(body.us), cut(body.uc, 200), cut(body.ut, 200), cut(country, 8), device],
  );
  return new Response(null, { status: 204, headers: CORS });
}
