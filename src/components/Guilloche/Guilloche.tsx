import { useMemo } from 'react';

/* Guilloché rosette: the engraved lathe pattern of banknotes and cheques, drawn as an SVG of rotated ellipses
   (outer petals) inside fine concentric rings (inner band). Decorative only: aria-hidden, no pointer events.
   Colour is currentColor, set from the world's gold token in eact.css ("Guilloché"). */

export function Guilloche({ petals = 18, className }: { petals?: number; className?: string }) {
  const outer = useMemo(() => Array.from({ length: petals }, (_, i) => (180 / petals) * i), [petals]);
  const inner = useMemo(() => Array.from({ length: petals }, (_, i) => (360 / petals) * i), [petals]);
  return (
    <svg className={['e-guilloche', className].filter(Boolean).join(' ')} viewBox="-130 -130 260 260" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
        {outer.map((a) => <ellipse key={`o${a}`} rx="122" ry="46" transform={`rotate(${a})`} />)}
        {inner.map((a) => <circle key={`i${a}`} cx="18" cy="0" r="46" transform={`rotate(${a})`} />)}
        <circle r="66" />
        <circle r="70" />
      </g>
    </svg>
  );
}
