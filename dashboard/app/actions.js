'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { q } from '../lib/db.js';
import { checkPassword, clearSession, requireLogin, setSession } from '../lib/auth.js';
import { DEFAULT_SETTINGS, getSettings, saveSettings, todayIn } from '../lib/settings.js';
import { syncMeta } from '../lib/meta.js';

export async function loginAction(formData) {
  if (checkPassword(formData.get('senha'))) {
    await setSession();
    redirect('/');
  }
  redirect('/login?erro=1');
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}

export async function toggleTaskAction(formData) {
  await requireLogin();
  const key = String(formData.get('key') || '').slice(0, 200);
  const s = await getSettings();
  const today = todayIn(s.fuso_horario);
  if (formData.get('done') === '1') {
    await q('DELETE FROM tasks_done WHERE date = $1 AND task_key = $2', [today, key]);
  } else {
    await q('INSERT INTO tasks_done (date, task_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [today, key]);
  }
  revalidatePath('/');
}

export async function saveSettingsAction(formData) {
  await requireLogin();
  const partial = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key === 'demo') continue;
    if (formData.has(key)) partial[key] = formData.get(key);
  }
  await saveSettings(partial);
  revalidatePath('/', 'layout');
  redirect('/config?salvo=1');
}

export async function addChangeAction(formData) {
  await requireLogin();
  const version = String(formData.get('version') || '').trim().slice(0, 32);
  if (!version) redirect('/mudancas?erro=versao');
  await q('INSERT INTO page_changes (version, description, hypothesis, author) VALUES ($1, $2, $3, $4)', [
    version,
    String(formData.get('description') || '').slice(0, 2000),
    String(formData.get('hypothesis') || '').slice(0, 2000),
    String(formData.get('author') || '').slice(0, 60),
  ]);
  revalidatePath('/', 'layout');
  redirect('/mudancas?salvo=1');
}

export async function syncNowAction() {
  await requireLogin();
  let msg = 'ok';
  try {
    await syncMeta();
  } catch (e) {
    msg = encodeURIComponent(e.message.slice(0, 200));
  }
  revalidatePath('/', 'layout');
  redirect(`/?sync=${msg}`);
}

export async function clearDemoAction() {
  await requireLogin();
  for (const t of ['events', 'campaigns', 'budget_history', 'ad_daily', 'sales', 'page_changes', 'tasks_done']) {
    await q(`DELETE FROM ${t}`);
  }
  await q(`DELETE FROM settings WHERE key = 'demo'`);
  revalidatePath('/', 'layout');
  redirect('/');
}
