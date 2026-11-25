import { addDays, economics, money, totals } from './rules.js';

export const dynamicPage = 'force-dynamic';

export function pct(n, d) {
  if (!d) return '—';
  return `${Math.round((n / d) * 100)}%`;
}

export function num(v, d = 2) {
  return v == null || !Number.isFinite(v) ? '—' : v.toFixed(d).replace('.', ',');
}

export function periodTotals(campaigns, settings, from, to) {
  const { fee } = economics(settings);
  const days = campaigns.flatMap((c) => c.ads.flatMap((a) => a.days)).filter((d) => d.date >= from && d.date <= to);
  return totals(days, fee);
}

export function last7(campaigns, settings, today) {
  return periodTotals(campaigns, settings, addDays(today, -6), today);
}

export function cur(settings) {
  return settings.moeda_conta || 'USD';
}

export { money };
