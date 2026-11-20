import type { CSSProperties } from 'react';

/** Thin share bar (receivables ageing). Decorative: the figure beside it carries the value. */
export function ProgressTrack({ percent, tone = 'accent' }: { percent: number; tone?: 'accent' | 'bad' }) {
  return (
    <div className={'e-track'} aria-hidden="true">
      <b className={tone === 'bad' ? 'e-track-bad' : undefined} style={{ '--pct': `${Math.min(Math.max(percent, 0), 100)}%` } as CSSProperties} />
    </div>
  );
}
