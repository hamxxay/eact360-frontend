import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Badge, type Tone } from '../Badge/Badge';
import { Guilloche } from '../Guilloche/Guilloche';
import { Icon, type IconName } from '../Icon/Icon';

/* Figure card. Animation (all skipped with prefers-reduced-motion):
   - the card fades and rises in, staggered by `index` (CSS, --i);
   - a numeric `count` counts up from 0 (or from the previous value when it changes), shown through `format`;
   - an optional `meter` (0–100) fills to its value.
   Screen readers get the final value, never the in-between numbers. Styling: eact.css "Figure card". */

interface Props {
  label: string;
  /** static value (string or node) */
  value?: ReactNode;
  /** animated numeric value; `format` turns it into text (defaults to grouped integer) */
  count?: number;
  format?: (n: number) => string;
  pill?: { tone: Tone; text: ReactNode };
  note?: ReactNode;
  icon?: IconName;
  tone?: 'accent' | 'ok' | 'wait' | 'bad';
  meter?: { percent: number; label: string };
  index?: number;
  /** engraved guilloché rosette behind the content (the lead widget of a row) */
  guilloche?: boolean;
}

const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Eases from the last shown value to `target` over `ms`. */
export function useCountUp(target: number, ms = 1100): number {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? target : 0));
  const from = useRef(shown);
  useEffect(() => {
    if (prefersReducedMotion()) { setShown(target); from.current = target; return; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      // clamp both ends: the first frame's timestamp can precede `start`, which went negative and showed "-0"
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
      const v = a + (target - a) * eased;
      setShown(v);
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

function Counted({ value, format }: { value: number; format: (n: number) => string }) {
  const n = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{format(n)}</span>
      <span className="visually-hidden">{format(value)}</span>
    </>
  );
}

export function KpiCard({ label, value, count, format = (n) => grouped.format(Math.round(n)), pill, note, icon, tone = 'accent', meter, index = 0, guilloche }: Props) {
  const [filled, setFilled] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setFilled(true)); return () => cancelAnimationFrame(t); }, []);
  const pct = meter ? Math.max(0, Math.min(100, meter.percent)) : 0;

  return (
    <article className={[`e-kpi e-kpi-${tone}`, guilloche && 'e-kpi-lead'].filter(Boolean).join(' ')} style={{ '--i': index } as CSSProperties}>
      {guilloche && <Guilloche />}
      <h3 className={'e-kpi-label'}>
        {icon && <span className="e-kpi-icon" aria-hidden="true"><Icon name={icon} size={16} /></span>}
        {label}
      </h3>
      <p className={'e-kpi-value'}>{count !== undefined ? <Counted value={count} format={format} /> : value}</p>
      {meter && (
        <div className="e-kpi-meter" role="meter" aria-label={meter.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <span style={{ '--pct': `${filled ? pct : 0}%` } as CSSProperties} />
        </div>
      )}
      {(pill || note) && (
        <p className={'e-kpi-foot'}>
          {pill && <Badge tone={pill.tone} size="sm">{pill.text}</Badge>}
          {note && <span>{note}</span>}
        </p>
      )}
    </article>
  );
}
