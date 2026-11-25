import crypto from 'node:crypto';
import { q } from '../../../lib/db.js';

// Webhook da Hotmart (versão 2.0). Configure a URL https://SEU-DASHBOARD/api/hotmart
// e coloque o "hottok" da Hotmart na variável HOTMART_HOTTOK.
export async function POST(req) {
  const expected = process.env.HOTMART_HOTTOK || '';
  const got = req.headers.get('x-hotmart-hottok') || '';
  if (!expected || got.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return new Response('não autorizado', { status: 401 });
  }
  let body;
  try { body = await req.json(); } catch { return new Response('json inválido', { status: 400 }); }
  const data = body?.data || {};
  const p = data.purchase || {};
  const tx = p.transaction;
  if (!tx) return new Response('sem transação', { status: 200 });
  const status = String(p.status || body.event || '').toUpperCase();
  const value = Number(p.price?.value ?? p.full_price?.value ?? 0);
  const currency = p.price?.currency_value || p.price?.currency_code || null;
  const isBump = Boolean(p.order_bump?.is_order_bump);
  await q(
    `INSERT INTO sales (transaction_id, ts, status, product, value, currency, is_bump, sck, src, raw)
     VALUES ($1, to_timestamp($2 / 1000.0), $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (transaction_id) DO UPDATE SET status = EXCLUDED.status, raw = EXCLUDED.raw`,
    [String(tx), Number(p.approved_date || body.creation_date || Date.now()), status, data.product?.name || null,
      value, currency, isBump, p.origin?.sck || null, p.origin?.src || null, JSON.stringify(body)],
  );
  return new Response('ok', { status: 200 });
}
