/* Injects the classic-page skin into a classic page shown inside the shell.
   All styling lives in src/styles/eact.css. From the compiled file this keeps only what classic pages need:
   the Inter @font-face rules, the :root tokens (section 2) and the rules scoped to html[data-eact-*]
   (section 9). App rules (reset, .e-* components) are left out, so they never touch classic pages. */
import compiled from '../styles/eact.css?inline';
import { installEnterToNext } from '../lib/enterToNext';

export const CLASSIC_SKIN_ID = 'eact-classic-skin';

/** Splits a selector list on top-level commas only (commas inside :has()/:not()/:is() stay). */
function splitSelectors(prelude: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of prelude) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Keeps @font-face, :root and html[data-eact-*] rules; recurses into @media/@supports. */
function classicOnly(css: string): string {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const prelude = css.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (/^@(media|supports)/.test(prelude)) {
      const inner = classicOnly(body);
      if (inner) out += `${prelude}{${inner}}`;
    } else if (prelude.startsWith('@font-face')) {
      out += `${prelude}{${body}}`;
    } else if (!prelude.startsWith('@')) {
      const sels = splitSelectors(prelude);
      if (sels.every((s) => s.startsWith(':root') || s.startsWith('html[data-eact-'))) out += `${prelude}{${body}}`;
    }
    i = j;
  }
  return out;
}

const SKIN_CSS = classicOnly(compiled);

/** Adds the skin to a same-origin classic page. Safe to call more than once. */
export function applySkin(doc: Document) {
  const root = doc.documentElement;
  const theme = document.documentElement.dataset.eactTheme;
  if (theme) root.dataset.eactTheme = theme;
  const scheme = document.documentElement.dataset.eactScheme;
  if (scheme) root.dataset.eactScheme = scheme;
  if (doc.getElementById(CLASSIC_SKIN_ID)) { root.setAttribute('data-eact-shell', ''); return; }
  root.setAttribute('data-eact-settling', '');
  root.setAttribute('data-eact-shell', '');
  const style = doc.createElement('style');
  style.id = CLASSIC_SKIN_ID;
  style.textContent = SKIN_CSS;
  (doc.head ?? root).appendChild(style);
  void root.offsetHeight; // apply the new styles now, with transitions off
  doc.defaultView?.requestAnimationFrame(() => doc.defaultView?.requestAnimationFrame(() => root.removeAttribute('data-eact-settling')));
  enhanceTables(doc);
  suppressAutoOpenedPickers(doc);
  installKeyboardFlow(doc);
}

/* Data-entry keyboard flow on classic pages (user decision):
   - Enter moves to the next field in the form (shared helper). A field the legacy page already handles keys on
     (jQuery keydown/keypress/keyup bound to it, e.g. JVAdjustments.js Enter-on-description adds the line) is
     left alone, and the last field keeps its normal Enter, so no legacy behaviour changes.
   - Tab skips the helpers between fields (calendar buttons, help icons, links, clear crosses inside form
     groups) by taking them out of the tab order; they still work by mouse. Main buttons stay reachable. */
type JQData = { _data?: (el: Element, key: string) => Record<string, unknown> | undefined };

function installKeyboardFlow(doc: Document) {
  const root = doc.documentElement as HTMLElement;
  if (root.dataset.eactKeys) return;
  root.dataset.eactKeys = '';
  const win = doc.defaultView as (Window & { jQuery?: JQData }) | null;
  installEnterToNext(doc, {
    hasLegacyKeyHandlers: (el) => {
      try {
        const ev = win?.jQuery?._data?.(el, 'events');
        return !!ev && ('keydown' in ev || 'keypress' in ev || 'keyup' in ev);
      } catch { return false; }
    },
  });
  skipHelpersInTabOrder(doc);
  if (win && doc.body) {
    let queued = false;
    const MO = (win as unknown as typeof globalThis).MutationObserver;   // the classic frame's own constructor
    new MO(() => {
      if (queued) return;
      queued = true;
      win.requestAnimationFrame(() => { queued = false; skipHelpersInTabOrder(doc); });
    }).observe(doc.body, { childList: true, subtree: true });
  }
}

const HELPERS = [
  '.form-group .input-group-btn > *:not(.btn-primary):not(.btn-success)',
  '.form-group .input-group-addon:is(a, button, [tabindex])',
  '.form-group label a', '.form-group .help-block a',
  '.form-group a[data-toggle="tooltip"]', '.form-group [data-toggle="tooltip"][tabindex]', '.form-group i[tabindex]',
  '.form-group a[href="#"]', '.form-group a[href^="javascript:"]',
  '.select2-selection__clear',
].join(',');

function skipHelpersInTabOrder(doc: Document) {
  try {
    doc.querySelectorAll<HTMLElement>(HELPERS).forEach((el) => {
      if (el.dataset.eactSkiptab !== undefined) return;
      el.dataset.eactSkiptab = el.getAttribute('tabindex') ?? '';
      el.setAttribute('tabindex', '-1');
    });
  } catch (e) {
    console.warn('E-ACT tab-order tidy skipped:', e);
  }
}

/* Many classic scripts focus the date box on load (e.g. JVAdjustments.js: $("#TextBoxDate").focus()), and
   bootstrap-datepicker opens on focus, so the calendar pops open by itself. Until the user first clicks or
   types in the page, a focus that lands on a date field is undone and its picker closed. Afterwards the
   pickers behave exactly as before. Only focus is touched; field values and legacy handlers stay as they are. */
type JQ = ((el: Element) => { datepicker?: (cmd: string) => void; data?: (k: string) => unknown }) | undefined;

function isDateField(el: Element | null, $: JQ): el is HTMLInputElement {
  if (!(el instanceof (el?.ownerDocument.defaultView?.HTMLInputElement ?? HTMLInputElement))) return false;
  if (/datepicker/i.test(el.className)) return true;
  try { return !!$?.(el).data?.('datepicker'); } catch { return false; }
}

function suppressAutoOpenedPickers(doc: Document) {
  const win = doc.defaultView as (Window & { jQuery?: JQ }) | null;
  if (!win || (doc.documentElement as HTMLElement).dataset.eactPickerGuard) return;
  (doc.documentElement as HTMLElement).dataset.eactPickerGuard = '';
  let userActed = false;

  const close = (el: HTMLInputElement) => {
    try { win.jQuery?.(el).datepicker?.('hide'); } catch { /* not a jQuery datepicker */ }
    el.blur();
    doc.querySelectorAll<HTMLElement>('.datepicker.datepicker-dropdown, .datepicker.dropdown-menu').forEach((p) => { p.style.display = 'none'; });
  };
  const onFocus = (e: FocusEvent) => { if (!userActed && isDateField(e.target as Element, win.jQuery)) close(e.target as HTMLInputElement); };
  const acted = () => {
    userActed = true;
    doc.removeEventListener('focusin', onFocus, true);
    doc.removeEventListener('pointerdown', acted, true);
    doc.removeEventListener('keydown', acted, true);
  };
  doc.addEventListener('pointerdown', acted, true);
  doc.addEventListener('keydown', acted, true);
  doc.addEventListener('focusin', onFocus, true);
  // Focus that already happened before the skin was applied (the page's ready handler runs before load).
  try {
    if (isDateField(doc.activeElement, win.jQuery)) close(doc.activeElement as HTMLInputElement);
  } catch (e) { console.warn('E-ACT picker guard skipped:', e); }
}

/* Classic placeholders read "Please Type Here! Branch Name". Drop the "Please … Here!" prefix, and drop the
   placeholder entirely when what's left only repeats the field's label. Only the attribute changes. */
const PLACEHOLDER_PREFIX = /^\s*please\s+(type|search|enter|select|write)(\s+here)?\s*[!:.-]*\s*/i;
const norm = (s: string) => s.replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();

function labelFor(doc: Document, el: HTMLElement): string {
  const byFor = el.id ? doc.querySelector(`label[for="${window.CSS.escape(el.id)}"]`) : null;
  const inGroup = el.closest('.form-group')?.querySelector('label.control-label, label');
  return ((byFor ?? inGroup)?.textContent ?? '').trim();
}

function tidyPlaceholders(doc: Document) {
  doc.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder]:not([data-eact-ph]), textarea[placeholder]:not([data-eact-ph])').forEach((el) => {
    el.setAttribute('data-eact-ph', '');
    const original = el.getAttribute('placeholder') ?? '';
    if (!PLACEHOLDER_PREFIX.test(original)) return;
    const rest = original.replace(PLACEHOLDER_PREFIX, '').trim();
    const label = labelFor(doc, el);
    el.setAttribute('placeholder', !rest || (label && norm(rest) === norm(label)) ? '' : rest);
  });
}

/* Ledger convention: numeric, currency and date columns are right-aligned, header included. Classic tables
   don't say which columns are which, so sample the cells: a column whose non-empty values are mostly amounts,
   percentages or dates gets class "e-num" on its header and cells. Re-run on redraw (paging, AJAX loads). */
const NUM = /^[-+−(]?\s*(?:rs\.?|pkr|usd|\$|€|£)?\s*\d[\d,]*(?:\.\d+)?\s*\)?\s*%?$/i;
const DATE = /^(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\s-][A-Za-z]{3,9}[\s,-]+\d{2,4}|[A-Za-z]{3,9}[\s-]\d{1,2},?[\s-]\d{4})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)?$/i;

function alignNumericColumns(doc: Document) {
  doc.querySelectorAll<HTMLTableElement>('table.table, table.dataTable').forEach((table) => {
    const head = table.tHead?.rows[table.tHead.rows.length - 1];
    const body = table.tBodies[0];
    if (!head || !body) return;
    const cols = head.cells.length;
    const rows = [...body.rows].filter((r) => r.cells.length === cols).slice(0, 30);
    if (!rows.length) return;
    for (let c = 0; c < cols; c++) {
      const values = rows.map((r) => (r.cells[c]?.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((v) => v && v !== '-');
      const numeric = values.length > 0 && values.filter((v) => NUM.test(v) || DATE.test(v)).length / values.length >= 0.8;
      if (!numeric) continue;
      head.cells[c]?.classList.add('e-num');
      for (const r of body.rows) if (r.cells.length === cols) r.cells[c]?.classList.add('e-num');
    }
  });
}

/* The skin hides DataTables' "Search:" label text (the search box shows an icon instead), so give each search
   input a placeholder and an accessible name. Legacy pages often build tables later (after an AJAX search),
   so new ones are picked up as they appear. Only attributes are added; no legacy behaviour changes. */
function enhanceTables(doc: Document) {
  const win = doc.defaultView;
  // Enhancements are cosmetic: a failure must never stop the classic page from showing.
  const run = () => {
    try {
      doc.querySelectorAll<HTMLInputElement>('.dataTables_filter input:not([data-eact])').forEach((input) => {
        input.setAttribute('data-eact', '');
        if (!input.placeholder) input.placeholder = 'Search…';
        if (!input.getAttribute('aria-label')) input.setAttribute('aria-label', 'Search this table');
      });
      tidyPlaceholders(doc);
      alignNumericColumns(doc);
    } catch (e) {
      console.warn('E-ACT classic enhancement skipped:', e);
    }
  };
  run();
  if (!win || !doc.body) return;
  let queued = false;
  new win.MutationObserver(() => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(() => { queued = false; run(); });
  }).observe(doc.body, { childList: true, subtree: true });
}
