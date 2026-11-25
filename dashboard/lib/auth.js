import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'dash_session';

function secret() {
  return process.env.DASHBOARD_PASSWORD || '';
}

function sign(value) {
  return crypto.createHmac('sha256', `${secret()}::dashboard`).update(value).digest('hex');
}

export function passwordConfigured() {
  return secret().length > 0;
}

export function checkPassword(pw) {
  const a = Buffer.from(String(pw || ''));
  const b = Buffer.from(secret());
  return a.length === b.length && b.length > 0 && crypto.timingSafeEqual(a, b);
}

export function sessionToken() {
  return sign('ok');
}

export async function isLoggedIn() {
  if (!passwordConfigured()) return !process.env.VERCEL; // local sem senha = liberado
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value || '';
  const expected = sessionToken();
  return v.length === expected.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected));
}

export async function requireLogin() {
  if (!(await isLoggedIn())) redirect('/login');
}

export async function setSession() {
  const jar = await cookies();
  jar.set(COOKIE, sessionToken(), { httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

// Chave para o Claude (ou o cron) ler o resumo e disparar a sincronização.
export function apiKeyOk(req) {
  const keys = [process.env.CLAUDE_API_KEY, process.env.CRON_SECRET].filter(Boolean);
  if (!keys.length) return false;
  const auth = req.headers.get('authorization') || '';
  const got = req.headers.get('x-api-key') || auth.replace(/^Bearer\s+/i, '');
  return keys.some((k) => k.length === got.length && crypto.timingSafeEqual(Buffer.from(k), Buffer.from(got)));
}
