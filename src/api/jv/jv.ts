import { useQuery } from '@tanstack/react-query';
import { HandlerError, postHandler, SessionExpiredError, useMocks } from '../http';
import { scriptVars } from '../../legacy/contextBridge';
import { redirectToLogin } from '../../legacy/session';
import { sampleDelay } from '../../mocks/delay';
import { MOCK_ACCOUNTS, MOCK_ACTIVITIES, MOCK_DONORS, MOCK_JV_CONTEXT } from '../../mocks/jv';
import type { JvLine, JvPageContext, Option, SaveOutcome } from './types';
import { legacyDateFormat, toLegacyDate } from '../../lib/legacyDate';

/* Legacy contract, read from the legacy code (no backend change):
   - JV/JVAdjustments.aspx (+ .cs): flags IsProjectApplicable, IsFundClass, IsDonorApplicable, IsConstructionCompany,
     HTMLReportViewerURL, JVAdjustmentListURL, ManagerDashboardURL as inline vars; project and fund/class lists are
     server-rendered <select>s (DropDownListProject, DropDownListFundManagementType); no JV right → Unauthorized redirect.
   - assets/js/JV/JVAdjustments.js: lines are kept in the browser and the voucher is saved in one call.
   - AjaxHandlers/JV/JVAdjustments.ashx
       PopulateAccounts  q → { data: [{ Id, Description, Category, ShortDesc, AccountNature }] }
       InsertIntoDB      postedData (JSON JVAdjestmentsParameter[], all string fields), TransDate (session date
                         format), ShortGUID (one per voucher; reused on retry) →
                         { data: Code, VCID, ShortGUID, IsAuthLevel, IsJvApplicable, IsfundClassAmountMatch,
                           IsAccountAvailable, IsJvBalance }
   - AjaxHandlers/Company/DonorManagement.ashx PopulateDonorList  q, pageno → { data: [{ Id, Name, Code }] }
   - AjaxHandlers/PurchaseOrders/PurchaseOrders.ashx PopulateProjectActivity  ProjectId → { data: [{ Id, Description }] } */

const JV = 'JV/JVAdjustments';
const PAGE = '/JV/JVAdjustments.aspx';

const isTrue = (v?: string) => (v ?? '').trim().toLowerCase() === 'true';

function selectOptions(doc: Document, id: string, skip: string[]): Option[] {
  const sel = doc.getElementById(id) as HTMLSelectElement | null;
  if (!sel) return [];
  return Array.from(sel.options)
    .filter((o) => !skip.includes(o.value))
    .map((o) => ({ value: o.value, label: (o.textContent ?? '').trim() }));
}

/** "7/1/2026 12:00:00 AM" (server culture M/d/yyyy) → "2026-07-01". */
function isoFromServerDate(s?: string): string | undefined {
  const m = s?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return undefined;
  return `${m[3]}-${m[1]!.padStart(2, '0')}-${m[2]!.padStart(2, '0')}`;
}

export function parseJvPage(html: string): JvPageContext {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const v = scriptVars(doc);
  return {
    allowed: true,
    projectApplicable: isTrue(v.IsProjectApplicable),
    fundClassApplicable: isTrue(v.IsFundClass),
    donorApplicable: isTrue(v.IsDonorApplicable),
    constructionCompany: isTrue(v.IsConstructionCompany),
    projects: selectOptions(doc, 'DropDownListProject', ['0']),
    fundClasses: selectOptions(doc, 'DropDownListFundManagementType', ['-1']),
    dateFormat: legacyDateFormat(v.DateFormats),   // DateFormats is "picker@.NET@range"; the .NET one
    currencySymbol: v.CurrencySymbol || 'Rs.',
    roleId: v.UserRoleId ? Number(v.UserRoleId) : null,
    periodStart: isoFromServerDate(v.PeriodStartDate),
    periodEnd: isoFromServerDate(v.PeriodEndsDate),
    reportViewerUrl: v.HTMLReportViewerURL ?? '',
    jvListUrl: v.JVAdjustmentListURL ?? '',
    managerInboxUrl: v.ManagerDashboardURL ?? '',
  };
}

async function fetchJvContext(): Promise<JvPageContext> {
  if (useMocks) return sampleDelay(MOCK_JV_CONTEXT);
  let res: Response;
  try {
    res = await fetch(PAGE, { credentials: 'same-origin', headers: { Accept: 'text/html' } });
  } catch {
    redirectToLogin();
    throw new SessionExpiredError();
  }
  const where = new URL(res.url).pathname.toLowerCase();
  if (res.status === 401 || /\/(login|loginportal)(\.aspx)?$/.test(where)) {
    redirectToLogin();
    throw new SessionExpiredError();
  }
  if (/unauthori[sz]ed/.test(where)) return { ...MOCK_JV_CONTEXT, allowed: false };
  if (!res.ok) throw new HandlerError(`The server returned ${res.status} for the journal voucher screen.`, res.status);
  return parseJvPage(await res.text());
}

export function useJvContext() {
  return useQuery({ queryKey: ['jv', 'context'], queryFn: fetchJvContext, staleTime: 5 * 60_000 });
}

/* ---------- Lookups ---------- */

interface RawAccount { Id: number | string; Description: string | null; Category: string | null; ShortDesc: string | null; AccountNature?: string | null }

export async function searchAccounts(q: string): Promise<Option[]> {
  const term = q.trim();
  if (!term) return [];
  const rows: RawAccount[] = useMocks
    ? await sampleDelay(MOCK_ACCOUNTS.filter((a) => `${a.Description} ${a.ShortDesc}`.toLowerCase().includes(term.toLowerCase())), 250)
    : (await postHandler<{ data: RawAccount[] | null }>(JV, 'PopulateAccounts', { q: term }))?.data ?? [];
  // Same label the classic select2 shows and posts as ShortDesc: "Description (Category )"
  return rows.map((a) => ({
    value: String(a.Id),
    label: `${a.Description ?? ''} (${a.Category ?? ''} )`,
    hint: [a.ShortDesc, a.AccountNature].filter(Boolean).join(' · '),
  }));
}

interface RawDonor { Id: number | string; Name: string | null; Code: string | null }

export async function searchDonors(q: string): Promise<Option[]> {
  const term = q.trim();
  if (term.length < 3) return [];
  const rows: RawDonor[] = useMocks
    ? await sampleDelay(MOCK_DONORS.filter((d) => `${d.Name} ${d.Code}`.toLowerCase().includes(term.toLowerCase())), 250)
    : (await postHandler<{ data: RawDonor[] | null }>('Company/DonorManagement', 'PopulateDonorList', { q: term, pageno: 1 }))?.data ?? [];
  return rows.map((d) => ({ value: String(d.Id), label: d.Name ?? '', hint: d.Code ?? undefined }));
}

interface RawActivity { Id: number | string; Description: string | null }

async function fetchActivities(projectId: string): Promise<Option[]> {
  const rows: RawActivity[] = useMocks
    ? await sampleDelay(MOCK_ACTIVITIES[projectId] ?? [], 200)
    : (await postHandler<{ data: RawActivity[] | null }>('PurchaseOrders/PurchaseOrders', 'PopulateProjectActivity', { ProjectId: projectId }))?.data ?? [];
  return rows.map((a) => ({ value: String(a.Id), label: a.Description ?? '' }));
}

export function useActivities(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['jv', 'activities', projectId],
    queryFn: () => fetchActivities(projectId),
    enabled: enabled && !!projectId,
    staleTime: 5 * 60_000,
  });
}

/* ---------- Save ---------- */

/** Voucher submit id, same shape as the classic generateShortGUID. randomUUID needs a secure context (https or
   localhost), so plain-http intranet hosts fall back to getRandomValues. */
export function newShortGuid(): string {
  if (typeof crypto.randomUUID === 'function' && window.isSecureContext) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const money = (n: number) => n.toFixed(2);

interface RawSave {
  data: string | null; VCID: number | null; ShortGUID: string | null;
  IsAuthLevel: boolean | null; IsJvApplicable: boolean | null; IsfundClassAmountMatch: boolean | null;
  IsAccountAvailable: boolean | null; IsJvBalance: boolean | null;
}

/** One call for the whole voucher, the same payload the classic page posts. */
export async function saveVoucher(ctx: JvPageContext, lines: JvLine[], isoDate: string, shortGuid: string): Promise<SaveOutcome> {
  const posted = lines.map((l) => ({
    ShortDesc: l.accountName,
    AccountId: l.accountId,
    Description: l.description,
    // The screen always offers project, sub project, fund/class and donor; a chosen value is posted even when the
    // company flag is off (the classic page would send null/0 there). Empty values match the classic defaults.
    ProjectId: l.projectId || (ctx.projectApplicable ? '0' : null),
    Debit: money(l.debit),
    Credit: money(l.credit),
    FundClassId: l.fundClassId || null,
    DonorId: l.donorId || null,
    ConsProjectActiveId: l.activityId || '0',
  }));

  if (useMocks) {
    await sampleDelay(null, 900);
    return { ok: true, code: 'JV-' + String(Math.floor(Math.random() * 9000) + 1000), shortGuid, voucherId: null };
  }

  let r: RawSave;
  try {
    r = await postHandler<RawSave>(JV, 'InsertIntoDB', {
      postedData: JSON.stringify(posted), TransDate: toLegacyDate(isoDate, ctx.dateFormat), ShortGUID: shortGuid,
    });
  } catch (e) {
    if (e instanceof SessionExpiredError) throw e;
    return { ok: false, message: e instanceof Error ? `The voucher wasn’t saved. ${e.message}` : 'The voucher wasn’t saved.' };
  }
  // Same checks and messages as the classic page, in the same order.
  if (r.IsAuthLevel === false) return { ok: false, message: 'Add at least one approval level first (User Authorisation form).' };
  if (r.IsJvApplicable === false) return { ok: false, message: 'Debit and credit totals are not equal.' };
  if (r.IsfundClassAmountMatch === false) return { ok: false, message: 'Debit and credit are not equal within each fund/class.' };
  if (r.IsAccountAvailable === false) return { ok: false, message: 'One or more accounts on the lines no longer exist. Review the accounts and save again.' };
  if (r.IsJvBalance === false) return { ok: false, message: 'Debit and credit are not equal, or an account is inactive in the chart of accounts. Review the lines and try again.' };
  if (!r.data) return { ok: false, message: 'The server didn’t return a voucher number. Check the JV list before saving again.' };
  return { ok: true, code: r.data, shortGuid: r.ShortGUID ?? shortGuid, voucherId: r.VCID ?? null };
}
