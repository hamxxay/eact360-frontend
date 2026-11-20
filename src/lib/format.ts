const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const oneDp = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 1284600 → "1,284,600" (table cells; the column header carries "PKR"). */
export const amount = (n: number) => grouped.format(n);

/** 46_600_000 → "PKR 46.6m"; 4_810_000 → "PKR 4.81m". */
export function pkrMillions(n: number) {
  const m = n / 1_000_000;
  const digits = Math.abs(m) < 10 ? 2 : 1;
  return `PKR ${m.toFixed(digits)}m`;
}

/** 1_600_000 → "1.6m" with a true minus sign for negatives. */
export function millions(n: number, signed = false) {
  const m = oneDp.format(Math.abs(n) / 1_000_000) + 'm';
  if (n < 0) return '−' + m;
  return signed ? '+' + m : m;
}

/** 0.062 → "+6.2%". */
export function percentChange(r: number) {
  const s = oneDp.format(Math.abs(r) * 100) + '%';
  return (r < 0 ? '−' : '+') + s;
}

const dShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "2026-11-17" → "17 Nov 2026". */
export const shortDate = (iso: string) => dShort.format(new Date(iso + 'T00:00:00'));
/** "2026-11-17" → "Monday 17 November 2026" (no comma, matching the mocks). */
export const longDate = (iso: string) => dLong.format(new Date(iso + 'T00:00:00')).replace(',', '');

export const plural = (n: number, one: string, many = one + 's') => `${amount(n)} ${n === 1 ? one : many}`;
