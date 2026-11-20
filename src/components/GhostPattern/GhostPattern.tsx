import { useMemo } from 'react';

/* Ambient ghosted geometric pattern: a guilloché wave band, the interlaced sine-wave lattice engraved along the
   borders of banknotes and cheques. Two families of phase-shifted waves cross each other to form the lattice.
   Decorative only (aria-hidden, no data); colour is currentColor (the scheme accent) and it fades toward the
   card's text (eact.css "Ghost pattern"). */

function wave(phase: number, amp: number, cy: number, sign: 1 | -1) {
  const pts: string[] = [];
  for (let x = 0; x <= 600; x += 6) {
    const y = cy + sign * amp * Math.sin((x / 600) * Math.PI * 6 + phase) + amp * 0.35 * Math.sin((x / 600) * Math.PI * 2 + phase * 0.5);
    pts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export function GhostPattern({ className, lines = 9 }: { className?: string; lines?: number }) {
  const paths = useMemo(() => {
    const out: { d: string; k: string }[] = [];
    for (let i = 0; i < lines; i++) {
      const phase = (i / lines) * Math.PI * 2;
      out.push({ d: wave(phase, 46, 80, 1), k: `a${i}` });
      out.push({ d: wave(phase + Math.PI / lines, 46, 80, -1), k: `b${i}` });
    }
    return out;
  }, [lines]);
  return (
    <svg className={['e-ghost-pattern', className].filter(Boolean).join(' ')} viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
        {paths.map((p) => <path key={p.k} d={p.d} />)}
      </g>
    </svg>
  );
}
