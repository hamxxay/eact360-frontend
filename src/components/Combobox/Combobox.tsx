import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Option } from '../../api/jv/types';
import { Spinner } from '../Loaders/Spinner';

/* Searchable select for table cells and forms.
   - Static: pass `options` (filtered as you type).
   - Remote: pass `search(term)` (debounced; `minChars` before it runs), e.g. legacy select2 handlers.
   The list renders in a fixed layer portalled to <body>, so a table's scroll area or a sticky cell (which makes its own
   stacking context, e.g. the pinned entry row under a pinned header) never clips or covers it; it opens upward near the
   bottom of the window (the pinned entry row). ARIA 1.2 combobox pattern. Styling: eact.css "Combobox". */

interface Props {
  label: string;                         // accessible name (visually hidden in table cells)
  value: Option | null;
  onChange: (next: Option | null) => void;
  options?: Option[];
  search?: (term: string) => Promise<Option[]>;
  minChars?: number;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  id?: string;
  onEnter?: () => void;                  // Enter with the list closed
}

export function Combobox({ label, value, onChange, options, search, minChars = 1, placeholder, invalid, describedBy, disabled, id, onEnter }: Props) {
  const autoId = useId();
  const inputId = id ?? `cb-${autoId}`;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [typing, setTyping] = useState(false);
  const [remote, setRemote] = useState<Option[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const items = search ? remote : (options ?? []).filter((o) => !term || o.label.toLowerCase().includes(term.toLowerCase()));
  const tooShort = !!search && term.trim().length < minChars;

  // Remote search, debounced; stale answers are ignored.
  useEffect(() => {
    if (!search || !open) return;
    if (tooShort) { setRemote([]); setBusy(false); return; }
    let live = true;
    setBusy(true); setFailed(false);
    const t = setTimeout(() => {
      search(term).then((r) => { if (live) { setRemote(r); setActive(0); } })
        .catch(() => { if (live) { setRemote([]); setFailed(true); } })
        .finally(() => { if (live) setBusy(false); });
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [search, term, open, tooShort]);

  useLayoutEffect(() => {
    if (!open || !input.current) return;
    const place = () => {
      const r = input.current!.getBoundingClientRect();
      const width = Math.max(r.width, 260);
      const left = Math.min(r.left, window.innerWidth - width - 8);
      const below = window.innerHeight - r.bottom;
      setPos(below < 280 && r.top > below ? { bottom: window.innerHeight - r.top + 4, left, width } : { top: r.bottom + 4, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!list.current?.contains(e.target as Node) && !input.current?.contains(e.target as Node)) finish();
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  });

  useEffect(() => { list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); }, [active]);

  function finish() { setOpen(false); setTyping(false); setTerm(''); }

  function pick(o: Option) {
    onChange(o);
    finish();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') {
      if (open && items[active]) { e.preventDefault(); pick(items[active]!); }
      else if (!open && onEnter) { e.preventDefault(); onEnter(); }
    }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); finish(); } }
    else if (e.key === 'Tab') { if (open && items[active] && typing && term) pick(items[active]!); else finish(); }
  }

  const shown = typing ? term : value?.label ?? '';
  const status = tooShort ? `Type ${minChars === 1 ? 'to search' : `at least ${minChars} characters`}`
    : busy ? 'Searching…' : failed ? 'Couldn’t search. Try again.' : items.length ? '' : 'No matches';

  return (
    <div className={['e-cb', invalid && 'e-cb-invalid', value && 'e-cb-has'].filter(Boolean).join(' ')}>
      <input
        ref={input} id={inputId} type="text" role="combobox" autoComplete="off" spellCheck={false}
        aria-label={label} aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined} aria-describedby={describedBy}
        className="e-cb-input" placeholder={placeholder} value={shown} disabled={disabled}
        title={value?.label}
        onChange={(e) => { setTerm(e.target.value); setTyping(true); setOpen(true); setActive(0); }}
        onFocus={() => { if (!search && !value) setOpen(true); }}
        onClick={() => setOpen(true)}
        onKeyDown={onKey}
        onBlur={() => { if (!open) finish(); }}
      />
      {value && !disabled && (
        <button type="button" className="e-cb-clear" aria-label={`Clear ${label}`} tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(null); input.current?.focus(); }}>×</button>
      )}
      <span className="e-cb-caret" aria-hidden="true" />
      {open && pos && createPortal(
        <ul
          ref={list} id={listId} role="listbox" aria-label={label} className="e-cb-list"
          style={{ '--top': pos.top !== undefined ? `${pos.top}px` : 'auto', '--bottom': pos.bottom !== undefined ? `${pos.bottom}px` : 'auto', '--left': `${pos.left}px`, '--w': `${pos.width}px` } as CSSProperties}
        >
          {items.map((o, i) => (
            <li
              key={o.value} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              className={value?.value === o.value ? 'e-cb-opt e-cb-current' : 'e-cb-opt'}
              onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}
            >
              <span>{o.label}</span>
              {o.hint && <small>{o.hint}</small>}
            </li>
          ))}
          {status && (
            <li className="e-cb-status" role="presentation" aria-live="polite">
              {busy && <Spinner size={14} />}{status}
            </li>
          )}
        </ul>,
        document.body,
      )}
    </div>
  );
}
