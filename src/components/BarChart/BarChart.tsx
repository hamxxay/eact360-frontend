import type { CSSProperties } from 'react';

export interface Bar {
  label: string;       // x-axis label, e.g. day of month
  value: number;
  title: string;       // full text for tooltip / screen readers
  kind?: 'main' | 'soft' | 'partial'; // soft = non-working day, partial = today so far
}

/** Daily bars with gridlines, as in the Category standard dashboard. Scaled to the largest value. */
export function BarChart({ bars, label }: { bars: Bar[]; label: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <figure className={'e-chart-fig'}>
      <div className={'e-chart-bars'} role="img" aria-label={label}>
        {bars.map((b) => (
          <i
            key={b.label} title={b.title}
            className={b.kind === 'soft' ? 'e-chart-soft' : b.kind === 'partial' ? 'e-chart-partial' : undefined}
            style={{ '--h': `${Math.max((b.value / max) * 100, 2)}%` } as CSSProperties}
          />
        ))}
      </div>
      <div className={'e-chart-days'} aria-hidden="true">
        {bars.map((b) => <span key={b.label}>{b.label}</span>)}
      </div>
      <figcaption className={'e-chart-key'}>
        <span><i />Working day</span>
        <span><i className={'e-chart-soft'} />Sunday</span>
        <span><i className={'e-chart-partial'} />Today so far</span>
      </figcaption>
    </figure>
  );
}
