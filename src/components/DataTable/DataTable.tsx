import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../Icon/Icon';

/* "Ledger" table: horizontal + vertical scroll area, header pinned to the top, first column pinned to the left,
   hairline row dividers, numbers right-aligned, row actions (···) shown on row hover/focus.
   Styling: src/styles/eact.css, section "Data table". */

export interface Column<T> {
  key: string;
  header: string;
  /** right = numbers, money and dates (header included) */
  align?: 'left' | 'right';
  width?: string;
  render: (row: T) => ReactNode;
}

export interface RowAction {
  label: string;
  /** route inside the app */
  to?: string;
  onSelect?: () => void;
}

interface Props<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowId: (row: T) => string;
  rowLabel?: (row: T) => string;       // for checkbox and menu labels
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  rowActions?: (row: T) => RowAction[];
  empty?: ReactNode;
  id?: string;
  /** Inline row editing: return the row's editor cells (one <td> per column, plus the actions cell) for the
      row being edited, or null to show it normally. */
  editRow?: (row: T) => ReactNode | null;
  /** Entry row pinned to the bottom of the scroll area (in <tfoot>), e.g. for adding lines. Its cells must
      match the columns (plus the actions cell when rowActions is set). */
  entryRow?: ReactNode;
  /** Extra class per row, e.g. "e-dt-void" for a cancelled record (kept visible, struck through). */
  rowClass?: (row: T) => string | undefined;
}

export function DataTable<T>({ caption, columns, rows, rowId, rowLabel, selected, onSelectedChange, rowActions, empty, id, editRow, entryRow, rowClass }: Props<T>) {
  const selectable = !!selected && !!onSelectedChange;
  const ids = rows.map(rowId);
  const nSel = selectable ? ids.filter((i) => selected!.has(i)).length : 0;
  const all = selectable && rows.length > 0 && nSel === rows.length;
  const some = nSel > 0 && !all;
  const headBox = useRef<HTMLInputElement>(null);
  useEffect(() => { if (headBox.current) headBox.current.indeterminate = some; }, [some]);

  function toggleAll() {
    const next = new Set(selected);
    if (all) ids.forEach((i) => next.delete(i)); else ids.forEach((i) => next.add(i));
    onSelectedChange!(next);
  }
  function toggle(i: string) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i); else next.add(i);
    onSelectedChange!(next);
  }

  // Pinned columns: the checkbox (if any) and the first data column; the shadow sits on the last pinned one.
  const firstCls = (base?: string) =>
    [base, selectable ? 'e-dt-pin2' : 'e-dt-pin', 'e-dt-pin-edge'].filter(Boolean).join(' ');
  const cellCls = (c: Column<T>, idx: number) =>
    idx === 0 ? firstCls(c.align === 'right' ? 'e-dt-num' : undefined) : c.align === 'right' ? 'e-dt-num' : undefined;

  return (
    <div className={'e-dt-wrap'} id={id} tabIndex={0} role="region" aria-label={caption}>
      <table className={'e-dt-table'}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {selectable && (
              <th className={'e-dt-check e-dt-pin'} scope="col">
                <input ref={headBox} type="checkbox" className={'e-dt-box'} checked={all} onChange={toggleAll} aria-label="Select all rows" disabled={!rows.length} />
              </th>
            )}
            {columns.map((c, idx) => (
              <th key={c.key} scope="col" style={c.width ? ({ '--w': c.width } as CSSProperties) : undefined} className={cellCls(c, idx)}>{c.header}</th>
            ))}
            {rowActions && <th scope="col" className="e-dt-actions-col"><span className="visually-hidden">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const i = rowId(r);
            const on = selectable && selected!.has(i);
            const editor = editRow?.(r);
            if (editor) return <tr key={i} className="e-dt-editing">{editor}</tr>;
            return (
              <tr key={i} className={[on && 'e-dt-sel', rowClass?.(r)].filter(Boolean).join(' ') || undefined}>
                {selectable && (
                  <td className={'e-dt-check e-dt-pin'}>
                    <input type="checkbox" className={'e-dt-box'} checked={on} onChange={() => toggle(i)} aria-label={`Select ${rowLabel ? rowLabel(r) : i}`} />
                  </td>
                )}
                {columns.map((c, idx) => <td key={c.key} className={cellCls(c, idx)}>{c.render(r)}</td>)}
                {rowActions && (
                  <td className="e-dt-actions-col">
                    <RowMenu label={rowLabel ? rowLabel(r) : i} actions={rowActions(r)} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        {entryRow && <tfoot className="e-dt-entry">{entryRow}</tfoot>}
      </table>
      {!rows.length && !entryRow && <div className={'e-dt-empty'}>{empty ?? 'Nothing to show.'}</div>}
    </div>
  );
}

/** ··· button with a small menu, rendered in a fixed layer so the table's scroll area never clips it. */
function RowMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const width = 220;
    const below = r.bottom + 4 + 40 * actions.length < window.innerHeight;
    setPos({ top: below ? r.bottom + 4 : r.top - 4 - 40 * actions.length, left: Math.max(8, r.right - width) });
  }, [open, actions.length]);

  // Move focus into the menu once it is rendered (it renders after its position is known)
  useEffect(() => {
    if (open && pos) menu.current?.querySelector<HTMLElement>('button, a')?.focus({ preventScroll: true });
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    const close = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false); };
    // Close when the page or table scrolls (the menu is positioned for where the button was), but ignore the
    // scroll that clicking the button itself can cause as the browser brings it into view.
    const openedAt = performance.now();
    const onScroll = () => { if (performance.now() - openedAt > 200) setOpen(false); };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  if (!actions.length) return null;

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('button, a') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(at + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(at - 1 + items.length) % items.length]?.focus(); }
    if (e.key === 'Tab') setOpen(false);
  }

  function run(a: RowAction) {
    setOpen(false);
    if (a.to) navigate(a.to);
    a.onSelect?.();
  }

  return (
    <>
      <button
        ref={btn} type="button" className="e-dt-more" aria-haspopup="menu" aria-expanded={open}
        aria-label={`Actions for ${label}`} onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more" size={18} />
      </button>
      {/* Portalled to <body>: panels with backdrop-filter (frosted glass) would otherwise become the containing
          block of this position: fixed menu and misplace it. */}
      {open && pos && createPortal(
        <div ref={menu} className="e-dt-menu" role="menu" aria-label={`Actions for ${label}`} style={{ '--top': `${pos.top}px`, '--left': `${pos.left}px` } as CSSProperties} onKeyDown={onMenuKey}>
          {actions.map((a) => (
            <button key={a.label} type="button" role="menuitem" onClick={() => run(a)}>{a.label}</button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
