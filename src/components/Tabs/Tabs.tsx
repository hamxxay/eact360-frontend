import { useRef, type KeyboardEvent } from 'react';
import { amount } from '../../lib/format';

export interface TabItem<K extends string> { id: K; label: string; count?: number }

/** Filter tabs with counts. Arrow keys move between tabs (WAI-ARIA tabs pattern). */
export function Tabs<K extends string>({ items, value, onChange, label, controls }: {
  items: TabItem<K>[]; value: K; onChange: (id: K) => void; label: string; controls?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, i: number) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (i + d + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next]!.id);
  }

  return (
    <div role="tablist" aria-label={label} className={'e-tabs'}>
      {items.map((t, i) => {
        const on = t.id === value;
        return (
          <button
            key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab"
            aria-selected={on} aria-controls={controls} tabIndex={on ? 0 : -1}
            className={['e-tabs-tab', on && 'e-tabs-on'].filter(Boolean).join(' ')}
            onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
            {t.count !== undefined && <em>{amount(t.count)}</em>}
          </button>
        );
      })}
    </div>
  );
}
