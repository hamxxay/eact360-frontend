import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { classicRoute } from '../app/nav';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';
import { DataTable, type Column, type RowAction } from '../components/DataTable/DataTable';
import { SearchField } from '../components/FilterBar/FilterBar';
import { Icon } from '../components/Icon/Icon';
import { PageSkeleton, TableSkeleton } from '../components/Loaders/Skeleton';
import { PageHeader } from '../components/PageHeader/PageHeader';
import { LoadError } from '../components/QueryState/QueryState';
import { useToast } from '../components/Toast/Toast';
import { downloadCsv } from '../lib/csv';
import { shortDate } from '../lib/format';
import { isoFromHandler, toLegacyDate } from '../lib/legacyDate';
import { openBlobReport, useListContext, useListRows, type ColumnDef, type FilterValues, type ListContext, type ListDef, type Raw } from './engine';
import { statusOf, voucherCode } from './legacyLabels';

/* Generic list screen (see engine.ts). Same toolbar as the classic DataTables lists: rows per page
   (10/25/50/100/all), column visibility (min. three), Copy, CSV, Print (company, title, time frame), search;
   ledger table with row actions; "Showing x to y of z entries" and paging. Styling: eact.css "Journal voucher list". */

const PAGE_SIZES = [10, 25, 50, 100, 0];
const fmt2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function shellRoute(url: string): string | null {
  try { const u = new URL(url, window.location.origin); return classicRoute(u.pathname + u.search); } catch { return null; }
}

export function ListScreen({ def }: { def: ListDef }) {
  const q = useListContext(def);
  if (q.isPending) return <PageSkeleton label={`Loading ${def.title.toLowerCase()}`} />;
  if (q.isError) return (<><PageHeader title={def.title} /><LoadError what={def.title.toLowerCase()} error={q.error} onRetry={() => q.refetch()} /></>);
  if (!q.data.allowed) {
    return (
      <>
        <PageHeader title="No access" subtitle={`Your role doesn’t include ${def.title.toLowerCase()}.`} />
        <Card><p className="e-note">Ask your administrator for the right if you need it.</p><Button variant="primary" to="/">Go to dashboard</Button></Card>
      </>
    );
  }
  return <ListBody key={def.id} def={def} ctx={q.data} />;
}

function ListBody({ def, ctx }: { def: ListDef; ctx: ListContext }) {
  const notify = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [draft, setDraft] = useState<FilterValues>(ctx.defaults);
  const [applied, setApplied] = useState<FilterValues | null>(def.loadOnOpen ? ctx.defaults : null);
  const [dateError, setDateError] = useState('');
  const list = useListRows(def, ctx, applied);

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

  const startKey = def.filters.find((f) => f.kind === 'date' && /start|from/i.test(f.key))?.key;
  const endKey = def.filters.find((f) => f.kind === 'date' && /end|to/i.test(f.key))?.key;

  // Classic success message after add / update / delete (?action=add&code=…)
  useEffect(() => {
    const action = params.get('action');
    const code = params.get('code');
    if (!code || !action) return;
    const verb = action === 'add' ? 'added' : action === 'update' ? 'updated' : action === 'delete' ? 'deleted' : '';
    if (verb) notify({ type: 'ok', title: `${code} ${verb}` });
    const next = new URLSearchParams(params); next.delete('action'); next.delete('code');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runSearch() {
    const missing = def.filters.find((f) => f.required && (!draft[f.key] || draft[f.key] === '-1'));
    if (missing) { setDateError(`Choose a ${missing.label.toLowerCase()}.`); return; }
    if (startKey && endKey) {
      if (!draft[startKey] || !draft[endKey]) { setDateError('Choose both dates.'); return; }
      if (draft[startKey]! > draft[endKey]!) { setDateError('The start date is after the end date.'); return; }
    }
    setDateError('');
    const same = JSON.stringify(draft) === JSON.stringify(applied);
    setApplied({ ...draft });
    setPage(0);
    if (same) void list.refetch();
  }

  const cur = ctx.currencySymbol;
  const rows = list.data ?? [];

  /** Display text per column, also used for search, copy, CSV and print */
  const textOf = (c: ColumnDef, r: Raw, i: number): string => {
    const v = c.field ? r[c.field] : undefined;
    switch (c.kind) {
      case 'index': return String(i + 1);
      case 'code': return v == null || v === '' ? '' : voucherCode(c.codeTypeOf?.(r) ?? c.codeType ?? 0, String(v));
      case 'date': { const iso = isoFromHandler(v as string); return iso ? toLegacyDate(iso, ctx.dateFormat) : ''; }
      case 'money': return fmt2.format(Number(v) || 0);
      case 'status': return statusOf(v == null ? null : Number(v)).label;
      default: return v == null ? '' : String(v);
    }
  };

  const indexed = useMemo(() => rows.map((r, i) => ({ r, i, id: `${i}` })), [rows]);
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return indexed;
    return indexed.filter(({ r, i }) => def.columns.some((c) => textOf(c, r, i).toLowerCase().includes(t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexed, search]);

  useEffect(() => { setPage(0); }, [search, pageSize]);
  const size = pageSize || filtered.length || 1;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, pages - 1);
  const shown = printing ? filtered : filtered.slice(safePage * size, safePage * size + size);
  const from = filtered.length ? safePage * size + 1 : 0;
  const to = Math.min(filtered.length, safePage * size + size);
  const total = def.totalField ? filtered.reduce((s, x) => s + (Number(x.r[def.totalField!]) || 0), 0) : null;
  // Status column (if any): counts for the counterfoil band, and void rows kept visible but struck through
  const statusCol = def.columns.find((c) => c.kind === 'status');
  const statusCounts = useMemo(() => {
    if (!statusCol?.field) return [] as [string, number][];
    const m = new Map<string, number>();
    filtered.forEach(({ r }) => { const l = statusOf(r[statusCol.field!] == null ? null : Number(r[statusCol.field!])).label; m.set(l, (m.get(l) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);
  const isVoid = (r: Raw) => !!statusCol?.field && statusOf(r[statusCol.field] == null ? null : Number(r[statusCol.field])).tone === 'void';

  const visibleDefs = def.columns.filter((c) => !hidden.has(c.key));
  const header = (c: ColumnDef) => (c.currency ? `${c.header} (${cur})` : c.header);
  const columns: Column<typeof indexed[number]>[] = visibleDefs.map((c) => ({
    key: c.key,
    header: header(c),
    align: c.kind === 'money' || c.kind === 'date' || c.kind === 'index' ? 'right' : 'left',
    width: c.width ?? (c.kind === 'index' ? '64px' : undefined),
    render: ({ r, i }) => {
      const text = textOf(c, r, i);
      const sub = c.subField && r[c.subField] != null ? String(r[c.subField]) : '';
      if (c.kind === 'status') {
        const s = statusOf(r[c.field!] == null ? null : Number(r[c.field!]));
        // Void reads as a stamp (VOID); the full legacy label stays for screen readers, search, CSV and print
        if (s.tone === 'void') return <Badge tone="void"><span aria-hidden="true">Void</span><span className="visually-hidden">{s.label}</span></Badge>;
        return <Badge tone={s.tone}>{s.label}</Badge>;
      }
      if (c.kind === 'date') { const iso = isoFromHandler(r[c.field!] as string); return iso ? shortDate(iso) : ''; }
      if (c.kind === 'code') return <span className="e-jvl-code">{text}</span>;
      return <>{text}{sub && <span className="e-dt-sub">{sub}</span>}</>;
    },
  }));

  function toggleColumn(k: string) {
    const next = new Set(hidden);
    if (next.has(k)) next.delete(k);
    else {
      if (def.columns.length - next.size <= 3) { notify({ type: 'info', title: 'At least three columns are needed', sub: 'They’re used for copy, CSV and print.' }); return; }
      next.add(k);
    }
    setHidden(next);
  }

  const exportHead = () => visibleDefs.map(header);
  const exportRows = () => filtered.map(({ r, i }) => visibleDefs.map((c) => textOf(c, r, i)));
  const timeFrame = applied && startKey && endKey ? `${toLegacyDate(applied[startKey]!, ctx.dateFormat)} - ${toLegacyDate(applied[endKey]!, ctx.dateFormat)}` : '';
  const slug = def.id;

  async function copyRows() {
    const text = [exportHead(), ...exportRows()].map((r) => r.join('\t')).join('\n');
    try { await navigator.clipboard.writeText(text); notify({ type: 'ok', title: `Copied ${filtered.length} ${filtered.length === 1 ? 'row' : 'rows'}`, sub: 'Paste into Excel or a document' }); }
    catch { notify({ type: 'bad', title: 'Couldn’t copy to the clipboard' }); }
  }
  const csvRows = () => downloadCsv(`${slug}${applied && startKey && endKey ? `-${applied[startKey]}-to-${applied[endKey]}` : ''}.csv`, exportHead(), exportRows());
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done, { once: true });
    const t = setTimeout(() => window.print(), 50);
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done); };
  }, [printing]);

  const rowActions = def.rowActions ? ({ r }: typeof indexed[number]): RowAction[] => {
    return def.rowActions!(r, { roleId: ctx.roleId, vars: ctx.vars }).map((a) => {
      if (a.kind === 'classic') return { label: a.label, onSelect: () => { const to = shellRoute(a.url); if (to) navigate(to); else window.location.assign(a.url); } };
      if (a.kind === 'tab') return { label: a.label, onSelect: () => window.open(a.url, '_blank') };
      return { label: a.label, onSelect: () => { openBlobReport(a.url).catch((e) => notify({ type: 'bad', title: 'Couldn’t open the report', sub: e instanceof Error ? e.message : undefined })); } };
    });
  } : undefined;

  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const summary = def.filters.filter((f) => f.kind === 'select')
    .map((f) => ctx.options[f.key]?.find((o) => o.value === applied?.[f.key])?.label).filter(Boolean).join(' · ');

  return (
    <>
      <PageHeader
        title={def.title}
        subtitle={list.data && applied ? `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}${startKey && endKey ? ` · ${shortDate(applied[startKey]!)} to ${shortDate(applied[endKey]!)}` : ''}` : undefined}
        actions={
          <>
            <Button to={`/classic${def.legacyPage}?eactClassic=1`}>Open classic screen</Button>
            {def.newScreen && <Button variant="primary" to={def.newScreen.to}>{def.newScreen.label}</Button>}
          </>
        }
      />

      <div className="e-jvl-print-head" aria-hidden="true">
        <b>{ctx.companyName}</b>
        <span>{def.printTitle ?? def.listTitle}</span>
        {timeFrame && <span>Time Frame: {timeFrame}</span>}
      </div>

      <div className="e-jvl-top">
      {def.filters.length > 0 && (
        <section className="e-jvl-filters" aria-labelledby={`${slug}-filters-title`}>
          <h2 id={`${slug}-filters-title`}><Icon name="search" size={16} /> Search filters</h2>
          <form className="e-jvl-filter-grid" style={{ '--cols': def.filters.length } as CSSProperties} onSubmit={(e) => { e.preventDefault(); runSearch(); }}>
            {def.filters.map((f) => (
              <div key={f.key} className="e-jv-field">
                <label htmlFor={`${slug}-${f.key}`}>{f.label}</label>
                {f.kind === 'select' ? (
                  <select id={`${slug}-${f.key}`} className="e-jvl-select" value={draft[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                    {(ctx.options[f.key] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input id={`${slug}-${f.key}`} type="date" className="e-jv-input e-jvl-date" value={draft[f.key] ?? ''}
                    onChange={(e) => set(f.key, e.target.value)} aria-invalid={!!dateError || undefined} aria-describedby={dateError ? `${slug}-date-err` : undefined} />
                )}
              </div>
            ))}
            <div className="e-jvl-search-btn">
              <button type="submit" className="e-btn e-btn-primary" disabled={list.isFetching} aria-busy={list.isFetching || undefined}>
                <Icon name="search" size={16} /> {list.isFetching ? 'Searching…' : 'Search'}
              </button>
            </div>
            {dateError && <span id={`${slug}-date-err`} className="e-jv-err e-jvl-err">{dateError}</span>}
          </form>
        </section>
      )}
      {/* Counterfoil stub: the list's totals, as on a cheque book's counterfoil */}
      {list.data && applied && (
        <aside className="e-cf" aria-label={`${def.listTitle} totals`}>
          <span className="e-cf-label">{total !== null ? 'List total' : 'Records'}</span>
          <span className="e-cf-figure">{total !== null ? `${cur} ${fmt2.format(total)}` : filtered.length}</span>
          <span className="e-cf-band">
            {[`${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}`, ...statusCounts.map(([label, n]) => `${n} ${label}`)].map((item) => (
              <span key={item} className="e-cf-item">{item}</span>
            ))}
          </span>
        </aside>
      )}
      </div>

      <section className="e-jv-panel" aria-labelledby={`${slug}-title`}>
        <header className="e-jv-panel-head">
          <h2 id={`${slug}-title`}>{def.listTitle}</h2>
          {summary && <span>{summary}</span>}
          {def.filters.length === 0 && (
            <button type="button" className="e-jvl-chip e-jvl-refresh" onClick={() => void list.refetch()} disabled={list.isFetching}>
              {list.isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </header>

        <div className="e-jvl-tools">
          <div className="e-jvl-tool-group" role="group" aria-label="Table tools">
            <label className="e-jvl-chip">
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Rows per page">
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n ? `Show ${n} rows` : 'Show all'}</option>)}
              </select>
            </label>
            <ColumnsMenu columns={def.columns.map((c) => ({ key: c.key, label: header(c) }))} hidden={hidden} onToggle={toggleColumn} />
            <button type="button" className="e-jvl-chip" onClick={() => void copyRows()} disabled={!filtered.length}>Copy</button>
            <button type="button" className="e-jvl-chip" onClick={csvRows} disabled={!filtered.length}>CSV</button>
            <button type="button" className="e-jvl-chip" onClick={() => setPrinting(true)} disabled={!filtered.length}>Print</button>
          </div>
          <div className="e-jvl-tool-search">
            <SearchField label={`Search ${def.listTitle.toLowerCase()}`} placeholder="Search…" value={search} onChange={setSearch} />
          </div>
        </div>

        {!applied && <div className="e-dt-empty">Choose the filters above and select <b>Search</b>.</div>}
        {applied && list.isPending && <TableSkeleton rows={8} cols={Math.max(3, visibleDefs.length)} label={`Loading ${def.listTitle.toLowerCase()}`} />}
        {list.isError && <LoadError what={def.listTitle.toLowerCase()} error={list.error} onRetry={() => list.refetch()} />}
        {list.data && (
          <DataTable
            id={`${slug}-table`}
            caption={`${def.listTitle}${summary ? `, ${summary}` : ''}${timeFrame ? `, ${timeFrame}` : ''}`}
            columns={columns}
            rows={shown}
            rowId={(x) => x.id}
            rowLabel={(x) => {
              const codeCol = def.columns.find((c) => c.kind === 'code') ?? def.columns.find((c) => c.kind !== 'index');
              return codeCol ? textOf(codeCol, x.r, x.i) : `row ${x.i + 1}`;
            }}
            rowActions={rowActions}
            rowClass={({ r }) => (isVoid(r) ? 'e-dt-void' : undefined)}
            empty={search ? 'No records match this search.' : def.emptyText ?? (def.filters.length ? 'No records for these filters.' : 'Nothing to show yet.')}
          />
        )}

        {list.data && (
          <footer className="e-jvl-foot">
            <span>Showing {from} to {to} of {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}{search && rows.length !== filtered.length ? ` (filtered from ${rows.length})` : ''}</span>
            {total !== null && <span className="e-jvl-total">Total <b>{cur} {fmt2.format(total)}</b></span>}
            <nav className="e-jvl-pager" aria-label="Pages">
              <button type="button" className="e-jvl-chip" onClick={() => setPage(safePage - 1)} disabled={safePage === 0}>Previous</button>
              <span aria-live="polite">Page {safePage + 1} of {pages}</span>
              <button type="button" className="e-jvl-chip" onClick={() => setPage(safePage + 1)} disabled={safePage >= pages - 1}>Next</button>
            </nav>
          </footer>
        )}
      </section>
    </>
  );
}

function ColumnsMenu({ columns, hidden, onToggle }: { columns: { key: string; label: string }[]; hidden: Set<string>; onToggle: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="e-jvl-cols" ref={box}>
      <button type="button" className="e-jvl-chip" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        Column visibility{hidden.size ? ` (${columns.length - hidden.size}/${columns.length})` : ''}
      </button>
      {open && (
        <div className="e-jvl-cols-pop" role="group" aria-label="Visible columns">
          {columns.map((c) => (
            <label key={c.key}>
              <input type="checkbox" className="e-dt-box" checked={!hidden.has(c.key)} onChange={() => onToggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
