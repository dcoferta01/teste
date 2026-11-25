import { q } from './db.js';

// Valores padrão. Os marcados como "ajuste" são estimativas: confira na tela Configurações.
export const DEFAULT_SETTINGS = {
  oferta_nome: 'Educação infantil',
  ticket_eur: 7.99,
  bumps_eur: '4, 3, 2',
  moeda_conta: 'USD',
  eur_para_moeda_conta: 1.08, // ajuste: câmbio do dia
  taxa_plataforma_pct: 10, // ajuste: taxa da Hotmart sobre a venda
  orcamento_teste: 9,
  visitantes_por_lote: 40,
  dias_entre_lotes: 7,
  vendas_gatilho_bidcap: 30,
  fuso_horario: 'America/Sao_Paulo',
  demo: false,
};

const NUMERIC = new Set([
  'ticket_eur', 'eur_para_moeda_conta', 'taxa_plataforma_pct', 'orcamento_teste',
  'visitantes_por_lote', 'dias_entre_lotes', 'vendas_gatilho_bidcap',
]);

export async function getSettings() {
  const rows = await q('SELECT key, value FROM settings');
  const s = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    if (NUMERIC.has(key)) s[key] = Number(value);
    else if (key === 'demo') s[key] = value === 'true';
    else s[key] = value;
  }
  return s;
}

export async function saveSettings(partial) {
  for (const [key, raw] of Object.entries(partial)) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    let value = String(raw ?? '').trim();
    if (NUMERIC.has(key)) {
      const n = Number(value.replace(',', '.'));
      if (!Number.isFinite(n)) continue;
      value = String(n);
    }
    await q(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, value],
    );
  }
}

export function todayIn(tz, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
