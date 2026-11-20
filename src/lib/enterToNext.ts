/* Data-entry keyboard flow (user decision): Enter moves to the next field, like Tab, in the same form or table
   row. On the last field of that scope Enter keeps its normal job (the filter form searches, the voucher entry
   row saves), so nothing that worked before stops working.
   Shared by the new screens (document) and the classic pages (installed into each classic document by the
   skin). Left alone: textareas, buttons, an open dropdown list (Enter picks), IME composition, modified keys,
   and anything a handler already dealt with (event.defaultPrevented). */

const FIELD =
  'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]):not([type=file]),' +
  'select:not(.select2-hidden-accessible),textarea,.select2-selection[tabindex]';

const ENTER_TYPES = /^(text|search|email|tel|url|number|password|date|datetime-local|month|time|week)$/;

export interface EnterToNextOptions {
  /** classic pages: leave a field alone when the legacy page bound its own key handlers to it */
  hasLegacyKeyHandlers?: (el: Element) => boolean;
}

function usable(el: Element): el is HTMLElement {
  const h = el as HTMLElement & { disabled?: boolean; readOnly?: boolean };
  if (h.disabled || h.readOnly || h.getAttribute('aria-disabled') === 'true' || h.tabIndex < 0) return false;
  if (!h.getClientRects().length) return false;                       // hidden
  const style = h.ownerDocument.defaultView?.getComputedStyle(h);
  return !style || (style.visibility !== 'hidden' && style.display !== 'none');
}

function scopeOf(el: Element): ParentNode {
  return el.closest('tr, form, [role="dialog"], .modal, [data-enter-scope]') ?? el.ownerDocument.body;
}

export function nextField(from: Element): HTMLElement | null {
  const fields = [...scopeOf(from).querySelectorAll(FIELD)].filter(usable);
  const at = fields.indexOf(from as HTMLElement);
  return at >= 0 ? fields[at + 1] ?? null : null;
}

export function installEnterToNext(doc: Document, opts: EnterToNextOptions = {}): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    if (!t || !(t instanceof (doc.defaultView?.HTMLElement ?? HTMLElement))) return;
    if (t.dataset.enter === 'default') return;
    const isInput = t.tagName === 'INPUT' && ENTER_TYPES.test((t as HTMLInputElement).type || 'text');
    const isSelect = t.tagName === 'SELECT';
    if (!isInput && !isSelect) return;                                   // textarea, buttons, select2 (Enter opens it)
    if (t.getAttribute('aria-expanded') === 'true') return;              // an open combobox list: Enter picks
    if (t.classList.contains('select2-search__field')) return;
    if (opts.hasLegacyKeyHandlers?.(t)) return;
    const next = nextField(t);
    if (!next) return;                                                   // last field: Enter keeps its normal job
    e.preventDefault();
    next.focus();
    if (next instanceof (doc.defaultView?.HTMLInputElement ?? HTMLInputElement) && /^(text|search|email|tel|url|number|password)$/.test(next.type)) {
      try { next.select(); } catch { /* some types can't select */ }
    }
  };
  doc.addEventListener('keydown', onKey);
  return () => doc.removeEventListener('keydown', onKey);
}
