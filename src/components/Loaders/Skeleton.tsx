import type { CSSProperties, ReactNode } from 'react';

/* Skeletons take the shape of the content they stand in for, so the page doesn't jump when data arrives.
   Each composed skeleton announces itself once to screen readers; the blocks inside are hidden.
   Styling: src/styles/eact.css, section "Loaders". Size is passed as data (--w, --h, --r). */

const len = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

export function Skeleton({ w = '100%', h = 12, r = 4, className }: { w?: number | string; h?: number | string; r?: number; className?: string }) {
  const size = { '--w': len(w), '--h': len(h), '--r': `${r}px` } as CSSProperties;
  return <span className={['e-ld-sk', className].filter(Boolean).join(' ')} style={size} aria-hidden="true" />;
}

function Busy({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className} role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

/** Four figure cards (dashboard). */
export function KpiRowSkeleton() {
  return (
    <Busy label="Loading key figures" className="e-ld-kpis">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="e-ld-card">
          <Skeleton w="45%" h={12} />
          <Skeleton w="70%" h={26} className="e-ld-figure" />
          <Skeleton w="55%" h={16} r={999} />
        </div>
      ))}
    </Busy>
  );
}

/** A card with a title and bars (chart). */
export function ChartSkeleton({ bars = 17 }: { bars?: number }) {
  const heights = [30, 78, 66, 60, 74, 84, 48, 22, 76, 70, 92, 68, 86, 56, 26, 88, 44];
  return (
    <Busy label="Loading chart" className="e-ld-card">
      <Skeleton w="30%" h={14} />
      <div className="e-ld-bars">
        {Array.from({ length: bars }, (_, i) => <Skeleton key={i} w="auto" h={`${heights[i % heights.length]}%`} />)}
      </div>
    </Busy>
  );
}

/** Label + number rows (FBR status card, short lists). */
export function ListSkeleton({ rows = 4, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <Busy label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="e-ld-list-row">
          <Skeleton w={`${45 + ((i * 17) % 30)}%`} h={13} />
          <Skeleton w={28} h={18} />
        </div>
      ))}
    </Busy>
  );
}

/** Table rows with a checkbox column, two-line cells and right-aligned numbers. */
export function TableSkeleton({ rows = 8, cols = 6, label = 'Loading rows' }: { rows?: number; cols?: number; label?: string }) {
  const isNum = (c: number) => c > 2 && c < cols - 1;
  return (
    <Busy label={label} className="e-ld-table">
      <div className="e-ld-thead">
        <Skeleton w={16} h={16} />
        {Array.from({ length: cols }, (_, c) => <Skeleton key={c} w={c > 2 ? '55%' : '40%'} h={10} className={isNum(c) ? 'e-ld-end' : undefined} />)}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="e-ld-trow">
          <Skeleton w={16} h={16} />
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={['e-ld-cell', isNum(c) && 'e-ld-cell-end'].filter(Boolean).join(' ')}>
              <Skeleton w={isNum(c) ? '60%' : `${55 + ((r * 13 + c * 7) % 35)}%`} h={12} />
              {c < 2 && <Skeleton w="40%" h={10} />}
              {c === cols - 1 && <Skeleton w={72} h={18} r={999} />}
            </div>
          ))}
        </div>
      ))}
    </Busy>
  );
}

/** Generic page block: header line + a few text lines. */
export function PageSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <Busy label={label} className="e-ld-card">
      <Skeleton w="35%" h={16} />
      <Skeleton w="90%" h={12} className="e-ld-gap-16" />
      <Skeleton w="80%" h={12} className="e-ld-gap-10" />
      <Skeleton w="60%" h={12} className="e-ld-gap-10" />
    </Busy>
  );
}
