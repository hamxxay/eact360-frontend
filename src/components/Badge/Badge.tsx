import type { ReactNode } from 'react';

/** void = cancelled record: rendered as a VOID stamp (nothing disappears, it cancels). */
export type Tone = 'ok' | 'wait' | 'bad' | 'neutral' | 'void';

/** Status chip. `size="sm"` is the KPI pill; default is the table status badge. */
export function Badge({ tone, children, size = 'md' }: { tone: Tone; children: ReactNode; size?: 'sm' | 'md' }) {
  return <span className={['e-badge', `e-badge-${tone}`, `e-badge-${size}`].join(' ')}>{children}</span>;
}
