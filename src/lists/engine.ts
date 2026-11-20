import { useQuery } from '@tanstack/react-query';
import { HandlerError, isSessionEnded, postHandler, SessionExpiredError, useMocks } from '../api/http';
import { scriptVars } from '../legacy/contextBridge';
import { redirectToLogin } from '../legacy/session';
import { workingDate } from '../lib/dates';
import { fromLegacyDate, legacyDateFormat, toLegacyDate } from '../lib/legacyDate';
import { sampleDelay } from '../mocks/delay';
import type { StatusTone } from './legacyLabels';

/* Config-driven list screens (React replacements for classic "Search filters + DataTable" list pages).
   Each list is a ListDef read from its classic page, script and handler (no backend change):
   - filters come from the classic page's own server-rendered controls (select options and default values,
     date boxes), so branch lists, statuses and defaults stay whatever the server gives this user;
   - data comes from the same handler action with the same parameters (sent in the query string, as the
     classic DataTables ajax URL does);
   - columns and row actions mirror the classic DataTables "columns" render functions. */

export type Raw = Record<string, unknown>;
export type Option = { value: string; label: string };

export interface FilterDef {
  key: string;
  label: string;
  kind: 'select' | 'date';
  control: string;                 // element id on the classic page (DropDownListBranch, TextBoxStartDate…)
  param: string;                   // handler parameter name
  /** rename an option (e.g. "-1" "Select Status" → "All statuses") */
  relabel?: Record<string, string>;
  /** the classic Search refuses the placeholder option (RequiredSelect2): value "-1" is not accepted */
  required?: boolean;
  /** classic script removes options for some roles: keep only these values for these roles */
  roleLimit?: { roles: number[]; values: string[] };
  /** drop these option values from the list (e.g. "-1" so there is no "All statuses" choice) */
  hideValues?: string[];
}

export interface ColumnDef {
  key: string;
  header: string;
  /** text = field as is; index = row number (#); code = GetCode(codeType, field); date; money = numberFormat;
      status = GetStatusM(field); ref = field shown as reference */
  kind?: 'text' | 'index' | 'code' | 'date' | 'money' | 'status';
  field?: string;
  codeType?: number;
  /** per-row voucher type when it depends on the record (e.g. inter-branch: 77 single, 95 multi) */
  codeTypeOf?: (row: Raw) => number;
  /** header gets " (Rs.)" like GetCurrencySymbolJs */
  currency?: boolean;
  width?: string;
  /** shown under the main value, small */
  subField?: string;
}

export type ListAction =
  | { label: string; kind: 'classic'; url: string }          // open a classic page inside the shell
  | { label: string; kind: 'tab'; url: string }              // new browser tab (HTML report viewer)
  | { label: string; kind: 'report'; url: string };          // POST, blob → new tab (Crystal/PDF report)

export interface ActionContext { roleId: number | null; vars: Record<string, string> }

export interface ListDef {
  id: string;
  route: string;                   // React route, e.g. /accounts/gratuity-fund
  legacyPage: string;              // classic page path, e.g. /JV/GratuityFundList.aspx
  title: string;                   // page title
  listTitle: string;               // table panel title (as on the classic panel heading)
  newScreen?: { label: string; to: string };
  filters: FilterDef[];
  /** the classic list loads on open (DataTables "ajax" set at start); otherwise it waits for Search */
  loadOnOpen: boolean;
  handler: string;                 // e.g. JV/GratuityFundList
  action: string;                  // e.g. PopulateGratuityFundList
  columns: ColumnDef[];
  rowActions?: (row: Raw, ctx: ActionContext) => ListAction[];
  /** message for an empty list (defaults depend on whether the list has filters) */
  emptyText?: string;
  /** voucher amount field for the footer total */
  totalField?: string;
  /** print heading (classic print title); defaults to listTitle */
  printTitle?: string;
  mockRows?: Raw[];
}

export interface ListContext {
  allowed: boolean;
  roleId: number | null;
  vars: Record<string, string>;
  dateFormat: string;
  currencySymbol: string;
  companyName: string;
  options: Record<string, Option[]>;     // per select filter key
  defaults: Record<string, string>;      // per filter key (dates as ISO)
}

function parsePage(def: ListDef, html: string): ListContext {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const vars = scriptVars(doc);
  const fmt = legacyDateFormat(vars.DateFormats);
  const roleId = Number((doc.getElementById('HiddenFieldRoleId') as HTMLInputElement | null)?.value || vars.UserRoleId) || null;
  const options: Record<string, Option[]> = {};
  const defaults: Record<string, string> = {};
  const today = workingDate();

  for (const f of def.filters) {
    const el = doc.getElementById(f.control);
    if (f.kind === 'select') {
      const sel = el as HTMLSelectElement | null;
      let opts = Array.from(sel?.options ?? []).map((o) => ({ value: o.value, label: f.relabel?.[o.value] ?? (o.textContent ?? '').trim() }));
      if (f.roleLimit && roleId && f.roleLimit.roles.includes(roleId)) opts = opts.filter((o) => f.roleLimit!.values.includes(o.value));
      if (f.hideValues) opts = opts.filter((o) => !f.hideValues!.includes(o.value));
      options[f.key] = opts;
      const selected = Array.from(sel?.options ?? []).find((o) => o.hasAttribute('selected'))?.value;
      defaults[f.key] = opts.some((o) => o.value === selected) ? selected! : opts[0]?.value ?? '';
    } else {
      defaults[f.key] = fromLegacyDate((el as HTMLInputElement | null)?.value ?? '', fmt) || today;
    }
  }
  return {
    allowed: true, roleId, vars, dateFormat: fmt,
    currencySymbol: vars.CurrencySymbol || 'Rs.', companyName: vars.CompanyName ?? '', options, defaults,
  };
}

function mockContext(def: ListDef): ListContext {
  const options: Record<string, Option[]> = {};
  const defaults: Record<string, string> = {};
  for (const f of def.filters) {
    if (f.kind === 'select') {
      options[f.key] = f.key === 'branch'
        ? [{ value: '0', label: 'All Branches' }, { value: '1', label: 'Head Office 01' }]
        : [{ value: '-1', label: 'All statuses' }, { value: '4', label: 'Open' }, { value: '2', label: 'Approved' }, { value: '3', label: 'Rejected' }];
      if (f.hideValues) options[f.key] = options[f.key]!.filter((o) => !f.hideValues!.includes(o.value));
      defaults[f.key] = options[f.key]![0]!.value;
    } else defaults[f.key] = f.key === 'start' ? '2026-11-01' : '2026-11-19';
  }
  return { allowed: true, roleId: 2, vars: {}, dateFormat: 'dd/MM/yyyy', currencySymbol: 'Rs.', companyName: 'Saffron Textiles (Pvt) Ltd', options, defaults };
}

async function fetchContext(def: ListDef): Promise<ListContext> {
  if (useMocks) return sampleDelay(mockContext(def));
  let res: Response;
  try {
    res = await fetch(def.legacyPage, { credentials: 'same-origin', headers: { Accept: 'text/html' } });
  } catch {
    redirectToLogin();
    throw new SessionExpiredError();
  }
  const where = new URL(res.url).pathname.toLowerCase();
  if (res.status === 401 || /\/(login|loginportal)(\.aspx)?$/.test(where)) { redirectToLogin(); throw new SessionExpiredError(); }
  if (/unauthori[sz]ed/.test(where)) return { ...mockContext(def), allowed: false };
  if (!res.ok) throw new HandlerError(`The server returned ${res.status} for ${def.title}.`, res.status);
  return parsePage(def, await res.text());
}

export function useListContext(def: ListDef) {
  return useQuery({ queryKey: ['list', def.id, 'context'], queryFn: () => fetchContext(def), staleTime: 5 * 60_000 });
}

export type FilterValues = Record<string, string>;

async function fetchRows(def: ListDef, ctx: ListContext, values: FilterValues): Promise<Raw[]> {
  if (useMocks) return sampleDelay(def.mockRows ?? [], 400);
  const params: Record<string, string> = {};
  for (const f of def.filters) {
    const v = values[f.key] ?? '';
    params[f.param] = f.kind === 'date' ? toLegacyDate(v, ctx.dateFormat) : v;
  }
  const res = await postHandler<{ data: Raw[] | null }>(def.handler, def.action, params, { inQuery: true });
  return res?.data ?? [];
}

export function useListRows(def: ListDef, ctx: ListContext | undefined, values: FilterValues | null) {
  return useQuery({ queryKey: ['list', def.id, 'rows', values], queryFn: () => fetchRows(def, ctx!, values!), enabled: !!ctx && !!values });
}

/** Opens a report the classic page fetches as a blob (Crystal/PDF). The window opens first so pop-up blockers allow it. */
export async function openBlobReport(url: string): Promise<void> {
  const win = window.open('', '_blank');
  if (useMocks) { win?.close(); throw new Error('Reports aren’t available with sample data.'); }
  try {
    const res = await fetch(url, { method: 'POST', credentials: 'same-origin', redirect: 'manual', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (isSessionEnded(res)) { win?.close(); redirectToLogin(); throw new SessionExpiredError(); }
    if (!res.ok) throw new HandlerError(`The server returned ${res.status} for the report.`, res.status);
    const blobUrl = URL.createObjectURL(await res.blob());
    if (win) win.location.href = blobUrl; else window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (e) {
    win?.close();
    throw e;
  }
}

/* Field helpers for row-action rules */
export const str = (r: Raw, k: string) => (r[k] == null ? '' : String(r[k]));
export const num = (r: Raw, k: string) => Number(r[k]) || 0;
export const isRole = (ctx: ActionContext, ...roles: number[]) => ctx.roleId != null && roles.includes(ctx.roleId);
/** "<var>?guid=<ShortGUID>" for a page var, or null when the var is missing */
export const withGuid = (ctx: ActionContext, varName: string, guid: string) => (ctx.vars[varName] && guid ? `${ctx.vars[varName]}?guid=${encodeURIComponent(guid)}` : null);
export const handlerUrl = (path: string, action: string, params: Record<string, string>) =>
  `/AjaxHandlers/${path}.ashx?${new URLSearchParams({ action, ...params }).toString()}`;
export type { StatusTone };
