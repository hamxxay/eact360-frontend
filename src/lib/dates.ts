import { useMocks } from '../api/http';

const pad = (n: number) => String(n).padStart(2, '0');

/** Working date as ISO "yyyy-mm-dd". Sample data is dated 17 Nov 2026; live mode uses today's local date. */
export function workingDate(): string {
  if (useMocks) return '2026-11-17';
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-11-17" → "2026-11". */
export const monthOf = (iso: string) => iso.slice(0, 7);

const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

/** The given month and the n-1 before it, newest first, as select options. */
export function recentMonths(iso: string, n = 12) {
  const [y, m] = iso.split('-').map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - i, 1);
    return { value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: monthLabel.format(d) };
  });
}

export const monthName = (ym: string) => monthLabel.format(new Date(`${ym}-01T00:00:00`));
