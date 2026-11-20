import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { newShortGuid, saveVoucher, searchAccounts, searchDonors, useActivities, useJvContext } from '../../api/jv/jv';
import type { JvLine, JvPageContext, Option } from '../../api/jv/types';
import { classicRoute } from '../../app/nav';
import { reportRoute } from '../../lib/reportRoute';
import { Alert } from '../../components/Alert/Alert';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Combobox } from '../../components/Combobox/Combobox';
import { PageSkeleton } from '../../components/Loaders/Skeleton';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { LoadError } from '../../components/QueryState/QueryState';
import { useToast } from '../../components/Toast/Toast';
import { workingDate } from '../../lib/dates';
import { clearDraft, loadDraft, saveDraft } from '../../legacy/session';

/* New journal voucher: React replacement for JV/JVAdjustments.aspx (MIGRATED in src/app/nav.ts).

   Layout follows QuickBooks Online's Journal entry: journal date, then a grid of always-editable rows (8 blank
   rows to start; "Add lines" adds more) with Account, Debits, Credits, Description and the line details the
   legacy page needs (project, sub project / activity, fund/class, donor as "Name"), a Total row, and a dark
   action bar pinned to the bottom. Blank rows are ignored on save; filled rows are validated together.

   No backend change: the legacy server has no per-line endpoint (lines only exist in the browser until the
   voucher is saved), so the voucher is saved in one call to the existing JVAdjustments.ashx InsertIntoDB, with
   the same checks and payload as the classic page. Memo and attachments are not shown: the legacy save has
   nowhere to put them. Filled lines are kept as a draft in this browser (session timeouts, reloads). */

const DRAFT_KEY = 'jv-new';
const CLASSIC_PAGE = '/classic/JV/JVAdjustments.aspx?eactClassic=1';
const START_ROWS = 8;
const ADD_ROWS = 2;

const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => fmt.format(n);
const parseAmount = (s: string) => {
  const t = s.replace(/,/g, '').trim();
  if (!t) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const cents = (n: number) => Math.round(n * 100);

interface Draft { date: string; lines: JvLine[] }

/* ---------- Row values ---------- */

interface Row {
  id: string;
  account: Option | null;
  debit: string;
  credit: string;
  description: string;
  project: Option | null;
  activity: Option | null;
  fundClass: Option | null;
  donor: Option | null;
}
type RowKey = 'account' | 'description' | 'amount' | 'fundClass' | 'donor';
type RowErrors = Partial<Record<RowKey, string>>;

let seq = 0;
const newId = () => `r${Date.now().toString(36)}${seq++}`;
const blankRow = (): Row => ({ id: newId(), account: null, debit: '', credit: '', description: '', project: null, activity: null, fundClass: null, donor: null });
const blankRows = (n: number) => Array.from({ length: n }, blankRow);

const opt = (value: string, label: string): Option | null => (value ? { value, label } : null);

const rowFrom = (l: JvLine): Row => ({
  id: newId(),
  account: opt(l.accountId, l.accountName),
  debit: l.debit ? String(l.debit) : '',
  credit: l.credit ? String(l.credit) : '',
  description: l.description,
  project: opt(l.projectId, l.projectName),
  activity: opt(l.activityId, l.activityName),
  fundClass: opt(l.fundClassId, l.fundClassName),
  donor: opt(l.donorId, l.donorName),
});

const isBlank = (r: Row) => !r.account && !r.debit.trim() && !r.credit.trim() && !r.description.trim();

function validateRow(r: Row, ctx: JvPageContext): RowErrors {
  const e: RowErrors = {};
  if (!r.account) e.account = 'Choose an account.';
  if (!r.description.trim()) e.description = 'Enter a description.';
  const d = parseAmount(r.debit);
  const c = parseAmount(r.credit);
  if (Number.isNaN(d) || Number.isNaN(c)) e.amount = 'Enter amounts as numbers.';
  else if (d < 0 || c < 0) e.amount = 'Amounts can’t be negative.';
  else if (!d && !c) e.amount = 'Enter a debit or a credit.';
  if (ctx.fundClassApplicable && !r.fundClass) e.fundClass = 'Choose a fund/class.';
  if (ctx.donorApplicable && !r.donor) e.donor = 'Choose a donor.';
  return e;
}

function toLine(r: Row): JvLine {
  return {
    id: r.id,
    accountId: r.account!.value, accountName: r.account!.label, accountCode: r.account!.hint,
    description: r.description.trim(),
    projectId: r.project?.value ?? '', projectName: r.project?.label ?? '',
    activityId: r.activity?.value ?? '', activityName: r.activity?.label ?? '',
    fundClassId: r.fundClass?.value ?? '', fundClassName: r.fundClass?.label ?? '',
    donorId: r.donor?.value ?? '', donorName: r.donor?.label ?? '',
    debit: parseAmount(r.debit) || 0,
    credit: parseAmount(r.credit) || 0,
  };
}

function Err({ id, children }: { id: string; children?: string }) {
  return children ? <span id={id} className="e-jv-err">{children}</span> : null;
}

/* ---------- Optional grid columns (project, sub project, fund/class, donor) ---------- */

type DimKey = 'project' | 'activity' | 'fundClass' | 'donor';
type DimCols = Record<DimKey, boolean>;
const DIM_LABEL: Record<DimKey, string> = { project: 'Project', activity: 'Sub project / activity', fundClass: 'Fund/Class', donor: 'Name (donor)' };
const DIM_KEYS = Object.keys(DIM_LABEL) as DimKey[];
const COLS_KEY = 'eact-jv-cols';

/** Fund/class stays on when required (the name/donor column can be hidden; Save shows it again if it is needed): with no separate details panel they would have nowhere to be filled in. */
const requiredCols = (ctx: JvPageContext): Partial<DimCols> => ({ ...(ctx.fundClassApplicable ? { fundClass: true } : {}) });

function initialCols(ctx: JvPageContext): DimCols {
  const base: DimCols = { project: false, activity: false, fundClass: ctx.fundClassApplicable, donor: ctx.donorApplicable };
  try {
    const raw = localStorage.getItem(COLS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<DimCols>;
      for (const k of DIM_KEYS) if (typeof saved[k] === 'boolean') base[k] = saved[k] as boolean;
    }
  } catch { /* storage unavailable: defaults */ }
  return { ...base, ...requiredCols(ctx) };
}

function ActivityCell({ row, lbl, onPick }: { row: Row; lbl: string; onPick: (v: Option | null) => void }) {
  const activities = useActivities(row.project?.value ?? '', true);
  return (
    <Combobox id={`${row.id}-activity`} label={`${lbl}: sub project / activity`} value={row.activity} onChange={onPick}
      options={activities.data ?? []} disabled={!row.project}
      placeholder={!row.project ? 'Choose a project first' : activities.isFetching ? 'Loading…' : 'None'} />
  );
}

/* ---------- One grid row ---------- */

function GridRow({ ctx, row, n, errors, cols, active, onActivate, onChange, onCopy, onDelete }: {
  ctx: JvPageContext; row: Row; n: number; errors: RowErrors; cols: DimCols; active: boolean; onActivate: () => void;
  onChange: (next: Row) => void; onCopy: () => void; onDelete: () => void;
}) {
  const put = (patch: Partial<Row>) => {
    const next = { ...row, ...patch };
    // Debit and credit are exclusive, as on the classic page.
    if (patch.debit !== undefined && patch.debit.trim()) next.credit = '';
    if (patch.credit !== undefined && patch.credit.trim()) next.debit = '';
    onChange(next);
  };
  const eid = (k: 'account' | 'description' | 'amount') => (errors[k] ? `${row.id}-${k}-err` : undefined);
  const lbl = `Line ${n}`;

  return (
    <tr className={active ? 'e-jvq-active' : undefined} onFocus={onActivate}>
      <td className="e-jvq-n">{n}</td>
      <td>
        <Combobox id={`${row.id}-account`} label={`${lbl}: account`} value={row.account} onChange={(v) => put({ account: v })}
          search={searchAccounts} invalid={!!errors.account} describedBy={eid('account')} />
        <Err id={`${row.id}-account-err`}>{errors.account}</Err>
      </td>
      <td className="e-jvq-num">
        <input className="e-jvq-input" type="text" inputMode="decimal" aria-label={`${lbl}: debit (${ctx.currencySymbol})`}
          value={row.debit} onChange={(e) => put({ debit: e.target.value })}
          aria-invalid={!!errors.amount || undefined} aria-describedby={eid('amount')} />
        <Err id={`${row.id}-amount-err`}>{errors.amount}</Err>
      </td>
      <td className="e-jvq-num">
        <input className="e-jvq-input" type="text" inputMode="decimal" aria-label={`${lbl}: credit (${ctx.currencySymbol})`}
          value={row.credit} onChange={(e) => put({ credit: e.target.value })} aria-invalid={!!errors.amount || undefined} />
      </td>
      <td>
        <input className="e-jvq-input" type="text" aria-label={`${lbl}: description`} value={row.description}
          onChange={(e) => put({ description: e.target.value })} aria-invalid={!!errors.description || undefined} aria-describedby={eid('description')} />
        <Err id={`${row.id}-description-err`}>{errors.description}</Err>
      </td>
      {cols.project && (
        <td className="e-jvq-dim">
          <Combobox id={`${row.id}-project`} label={`${lbl}: project`} value={row.project}
            onChange={(v) => put({ project: v, activity: null })} options={ctx.projects} placeholder="None" />
        </td>
      )}
      {cols.activity && (
        <td className="e-jvq-dim"><ActivityCell row={row} lbl={lbl} onPick={(v) => put({ activity: v })} /></td>
      )}
      {cols.fundClass && (
        <td className="e-jvq-dim">
          <Combobox id={`${row.id}-fund`} label={`${lbl}: fund/class`} value={row.fundClass} onChange={(v) => put({ fundClass: v })}
            options={ctx.fundClasses} placeholder="Choose" invalid={!!errors.fundClass} describedBy={errors.fundClass ? `${row.id}-fund-err` : undefined} />
          <Err id={`${row.id}-fund-err`}>{errors.fundClass}</Err>
        </td>
      )}
      {cols.donor && (
        <td className="e-jvq-dim">
          <Combobox id={`${row.id}-donor`} label={`${lbl}: name (donor)`} value={row.donor} onChange={(v) => put({ donor: v })}
            search={searchDonors} minChars={3} placeholder="Search donor" invalid={!!errors.donor} describedBy={errors.donor ? `${row.id}-donor-err` : undefined} />
          <Err id={`${row.id}-donor-err`}>{errors.donor}</Err>
        </td>
      )}
      <td className="e-jvq-tools">
        <button type="button" className="e-jvq-icon" tabIndex={-1} onClick={onCopy} aria-label={`Duplicate line ${n}`} title="Duplicate line">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8" /></svg>
        </button>
        <button type="button" className="e-jvq-icon" tabIndex={-1} onClick={onDelete} aria-label={`Delete line ${n}`} title="Delete line">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
        </button>
      </td>
    </tr>
  );
}

/* ---------- Page ---------- */

export function JournalVoucherPage() {
  const q = useJvContext();
  if (q.isPending) return <PageSkeleton label="Loading the journal voucher" />;
  if (q.isError) {
    return (
      <>
        <PageHeader title="Journal entry" />
        <LoadError what="the journal voucher screen" error={q.error} onRetry={() => q.refetch()} />
      </>
    );
  }
  if (!q.data.allowed) {
    return (
      <>
        <PageHeader title="No access" subtitle="Your role doesn’t include journal vouchers." />
        <Card>
          <p className="e-note">Ask your administrator for the JV right if you need it.</p>
          <Button variant="primary" to="/">Go to dashboard</Button>
        </Card>
      </>
    );
  }
  return <VoucherForm ctx={q.data} />;
}

function clampDate(iso: string, ctx: JvPageContext) {
  if (ctx.periodStart && iso < ctx.periodStart) return ctx.periodStart;
  if (ctx.periodEnd && iso > ctx.periodEnd) return ctx.periodEnd;
  return iso;
}

/** Absolute legacy URL from the page → route inside the shell. */
function shellRoute(url: string): string | null {
  try {
    const u = new URL(url, window.location.origin);
    return classicRoute(u.pathname + u.search);
  } catch { return null; }
}

function VoucherForm({ ctx }: { ctx: JvPageContext }) {
  const notify = useToast();
  const navigate = useNavigate();
  const restored = useRef(loadDraft<Draft>(DRAFT_KEY));
  const [date, setDate] = useState(() => clampDate(restored.current?.date || workingDate(), ctx));
  const [rows, setRows] = useState<Row[]>(() => {
    const saved = restored.current?.lines ?? [];
    return [...saved.map(rowFrom), ...blankRows(Math.max(START_ROWS - saved.length, ADD_ROWS))];
  });
  const [errors, setErrors] = useState<Record<string, RowErrors>>({});
  const [saving, setSaving] = useState<'save' | 'saveNew' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cols, setCols] = useState<DimCols>(() => initialCols(ctx));
  const dimCount = DIM_KEYS.filter((k) => cols[k]).length;
  const toggleCol = (k: DimKey) => setCols((c) => {
    const next = { ...c, [k]: !c[k], ...requiredCols(ctx) };
    try { localStorage.setItem(COLS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  });
  const shortGuid = useRef(newShortGuid());

  const toldRestore = useRef(false);
  useEffect(() => {
    if (toldRestore.current || !restored.current?.lines.length) return;
    toldRestore.current = true;
    const n = restored.current.lines.length;
    notify({ type: 'info', title: 'Unsaved lines restored', sub: `${n === 1 ? '1 line' : `${n} lines`} from your last visit` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep complete lines in this browser (session timeout, reload).
  useEffect(() => {
    const done = rows.filter((r) => !isBlank(r) && !Object.keys(validateRow(r, ctx)).length).map(toLine);
    if (done.length) saveDraft<Draft>(DRAFT_KEY, { date, lines: done }); else clearDraft(DRAFT_KEY);
  }, [date, rows, ctx]);

  const totals = useMemo(() => {
    let d = 0; let c = 0; let used = 0;
    rows.forEach((r) => {
      if (isBlank(r)) return;
      used += 1;
      d += cents(parseAmount(r.debit) || 0);
      c += cents(parseAmount(r.credit) || 0);
    });
    return { debit: d / 100, credit: c / 100, diff: (d - c) / 100, balanced: d === c && d > 0, used };
  }, [rows]);

  const cur = ctx.currencySymbol;
  const busy = saving !== null;
  const diffTone = !totals.used ? 'neutral' : totals.balanced ? 'ok' : 'bad';

  const change = (id: string, next: Row) => {
    setRows((rs) => rs.map((r) => (r.id === id ? next : r)));
    if (errors[id]) setErrors((e) => ({ ...e, [id]: validateRow(next, ctx) }));
    setSaveError(null);
  };
  const copy = (id: string) => setRows((rs) => { const i = rs.findIndex((r) => r.id === id); return [...rs.slice(0, i + 1), { ...rs[i], id: newId() }, ...rs.slice(i + 1)]; });
  const remove = (id: string) => setRows((rs) => (rs.length <= 1 ? blankRows(1) : rs.filter((r) => r.id !== id)));
  const addLines = (n = ADD_ROWS) => setRows((rs) => [...rs, ...blankRows(n)]);
  // The cursor reaching the last line adds a new one, so there is always an empty row to move on to.
  const activate = (id: string) => {
    setActiveId(id);
    if (rows[rows.length - 1]?.id === id) addLines(1);
  };
  const active = rows.find((r) => r.id === activeId) ?? rows[0];

  function reset() {
    setRows(blankRows(START_ROWS)); setErrors({}); setSaveError(null); setDateError(null);
    shortGuid.current = newShortGuid();
    clearDraft(DRAFT_KEY);
  }

  /** Returns the lines to save, or a message (and marks the bad cells). */
  function checkVoucher(): { lines: JvLine[] } | { problem: string } {
    if (!date) { setDateError('Choose a date.'); return { problem: 'Choose a journal date.' }; }
    if ((ctx.periodStart && date < ctx.periodStart) || (ctx.periodEnd && date > ctx.periodEnd)) {
      setDateError('The date is outside the financial period.'); return { problem: 'The journal date is outside the financial period.' };
    }
    setDateError(null);
    const used = rows.filter((r) => !isBlank(r));
    if (!used.length) return { problem: 'Add at least one line.' };

    const bad: Record<string, RowErrors> = {};
    let firstMsg = '';
    used.forEach((r) => {
      const e = validateRow(r, ctx);
      const k = (Object.keys(e) as RowKey[])[0];
      if (k) {
        bad[r.id] = e;
        if (!firstMsg) firstMsg = `Line ${rows.indexOf(r) + 1}: ${e[k]}`;
      }
    });
    setErrors(bad);
    if (Object.values(bad).some((e) => e.donor)) setCols((c) => (c.donor ? c : { ...c, donor: true }));
    const firstBad = used.find((r) => bad[r.id]);
    if (firstBad) setActiveId(firstBad.id);
    if (firstMsg) return { problem: firstMsg };

    const lines = used.map(toLine);
    if (!totals.balanced) return { problem: `Debit and credit must be equal. The difference is ${cur} ${money(Math.abs(totals.diff))}.` };
    if (ctx.fundClassApplicable) {
      const byClass = new Map<string, number>();
      lines.forEach((l) => byClass.set(l.fundClassId, (byClass.get(l.fundClassId) ?? 0) + cents(l.debit) - cents(l.credit)));
      const off = [...byClass.entries()].find(([, v]) => v !== 0);
      if (off) {
        const name = lines.find((l) => l.fundClassId === off[0])?.fundClassName || 'a fund/class';
        return { problem: `Debit and credit must be equal within each fund/class (${name} is off by ${cur} ${money(Math.abs(off[1]) / 100)}).` };
      }
    }
    return { lines };
  }

  const save = useCallback(async (kind: 'save' | 'saveNew') => {
    if (saving) return;
    const checked = checkVoucher();
    if ('problem' in checked) { setSaveError(checked.problem); return; }
    setSaving(kind); setSaveError(null);
    try {
      const r = await saveVoucher(ctx, checked.lines, date, shortGuid.current);
      if (!r.ok) { setSaveError(r.message); return; }

      const reportUrl = ctx.reportViewerUrl ? reportRoute(`${ctx.reportViewerUrl}?guid=${encodeURIComponent(r.shortGuid)}&report=JV`) : '';
      const opened = reportUrl ? window.open(reportUrl, '_blank') : null;
      notify({
        type: 'ok', title: `${r.code} saved`, sub: 'Journal voucher created',
        action: reportUrl && !opened ? { label: 'Open report', onClick: () => window.open(reportUrl, '_blank') } : undefined,
      });
      reset();

      // Where the classic page goes after "Save" (not "Save and new"), by role.
      if (kind === 'save') {
        const role = ctx.roleId;
        const to = role === 3 || role === 4 ? (ctx.managerInboxUrl ? shellRoute(`${ctx.managerInboxUrl}Created&code=${encodeURIComponent(r.code)}`) : null)
          : role === 21 || role === 22 ? (ctx.jvListUrl ? shellRoute(`${ctx.jvListUrl}&code=${encodeURIComponent(r.code)}`) : null) : null;
        if (to) navigate(to);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'The voucher wasn’t saved.');
    } finally {
      setSaving(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, ctx, rows, date, totals]);

  // F9 save, F10 save and new: same keys as the classic page.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'F9') { e.preventDefault(); void save('save'); }
      if (e.key === 'F10') { e.preventDefault(); void save('saveNew'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  return (
    <div className="e-jvq">
      <header className="e-jv-title">
        <h1>Journal entry</h1>
        <Button variant="ghost" to={CLASSIC_PAGE}>Open classic screen</Button>
      </header>

      <div className="e-jvq-head">
        <div className="e-jv-date">
          <label htmlFor="jv-date">Journal date</label>
          <input
            id="jv-date" type="date" className="e-jv-input" value={date} min={ctx.periodStart} max={ctx.periodEnd}
            onChange={(e) => { setDate(e.target.value); setDateError(null); }} aria-invalid={!!dateError || undefined} aria-describedby={dateError ? 'jv-date-err' : undefined}
          />
          <Err id="jv-date-err">{dateError ?? undefined}</Err>
        </div>
        {(ctx.periodStart || ctx.periodEnd) && (
          <p className="e-jv-period">Financial period {ctx.periodStart ?? '…'} to {ctx.periodEnd ?? '…'}</p>
        )}
      </div>

      {saveError && <Alert variant="band">{saveError}</Alert>}

      <fieldset className="e-jvq-cols">
        <legend>Add columns</legend>
        {DIM_KEYS.map((k) => (
          <label key={k} className="e-jvq-col-opt">
            <input type="checkbox" checked={cols[k]} onChange={() => toggleCol(k)} disabled={!!requiredCols(ctx)[k]} />
            <span>{DIM_LABEL[k]}</span>
          </label>
        ))}
      </fieldset>

      <div className="e-jvq-scroll">
        <table className="e-jvq-grid" style={{ '--dim-cols': dimCount } as CSSProperties}>
          <caption className="visually-hidden">Journal voucher lines</caption>
          <thead>
            <tr>
              <th className="e-jvq-n">#</th>
              <th>Account</th>
              <th className="e-jvq-num">Debits</th>
              <th className="e-jvq-num">Credits</th>
              <th>Description</th>
              {DIM_KEYS.filter((k) => cols[k]).map((k) => <th key={k} className="e-jvq-dim">{DIM_LABEL[k]}</th>)}
              <th aria-label="Line actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <GridRow key={r.id} ctx={ctx} row={r} n={i + 1} errors={errors[r.id] ?? {}} cols={cols} active={r.id === active.id} onActivate={() => activate(r.id)}
                onChange={(next) => change(r.id, next)} onCopy={() => copy(r.id)} onDelete={() => remove(r.id)} />
            ))}
          </tbody>
          <tfoot>
            <tr className="e-jvq-total">
              <th scope="row" colSpan={2}>Total</th>
              <td className="e-jvq-num">{cur} {money(totals.debit)}</td>
              <td className="e-jvq-num">{cur} {money(totals.credit)}</td>
              <td colSpan={2 + dimCount} className={`e-jvq-diff e-jvq-diff-${diffTone}`} aria-live="polite">
                {!totals.used ? 'No lines yet' : totals.balanced ? 'Balanced' : `Difference ${cur} ${money(Math.abs(totals.diff))} (${totals.diff > 0 ? 'debit' : 'credit'} is higher)`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="e-jvq-add">
        <Button onClick={() => addLines()} disabled={busy}>Add lines</Button>
        <Button onClick={() => setRows(blankRows(START_ROWS))} disabled={busy}>Clear all lines</Button>
      </div>

      <footer className="e-jv-actions e-jvq-bar">
        <Button variant="ghost" onClick={() => navigate(-1)} disabled={busy}>Cancel</Button>
        <Button variant="ghost" onClick={reset} disabled={busy}>Clear</Button>
        <span className="e-jv-keys">F9 save · F10 save and new · Enter moves to the next field</span>
        <Button onClick={() => void save('save')} loading={saving === 'save'} loadingText="Saving…" disabled={busy}>Save</Button>
        <Button variant="primary" onClick={() => void save('saveNew')} loading={saving === 'saveNew'} loadingText="Saving…" disabled={busy}>Save and new</Button>
      </footer>
    </div>
  );
}
