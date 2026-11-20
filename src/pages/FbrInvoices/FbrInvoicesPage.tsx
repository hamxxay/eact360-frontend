import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFbrInvoices } from '../../api/fbr/invoices';
import { STATUSES, STATUS_LABEL, type FbrInvoice, type FbrStatus } from '../../api/fbr/types';
import { Alert } from '../../components/Alert/Alert';
import { Badge, type Tone } from '../../components/Badge/Badge';
import { Button } from '../../components/Button/Button';
import { DataTable, type Column, type RowAction } from '../../components/DataTable/DataTable';
import { FilterBar, SearchField, Select } from '../../components/FilterBar/FilterBar';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { TableSkeleton } from '../../components/Loaders/Skeleton';
import { LoadError } from '../../components/QueryState/QueryState';
import { Tabs } from '../../components/Tabs/Tabs';
import { useToast } from '../../components/Toast/Toast';
import { downloadCsv } from '../../lib/csv';
import { monthName, monthOf, recentMonths, workingDate } from '../../lib/dates';
import { amount, plural } from '../../lib/format';

/* Classic screens this page links to until they are rebuilt; they open inside the shell. */
const LEGACY = {
  import: '/classic/FBRIntegration/ClientInvoiceImport.aspx',
  add: '/classic/FBRIntegration/DigitalInvoiceAdd.aspx',
  posting: '/classic/FBRIntegration/DigitalInvoicePosting.aspx',
};

type TabId = 'all' | FbrStatus;
const TAB_ORDER: TabId[] = ['all', ...STATUSES];
const TAB_LABEL: Record<TabId, string> = { all: 'All', ...STATUS_LABEL };
const TONE: Record<FbrStatus, Tone> = {
  open: 'neutral', validated: 'wait', notValidated: 'bad', posted: 'ok', inProgress: 'wait', suspicious: 'bad', void: 'neutral',
};

const isTab = (v: string | null): v is TabId => !!v && (TAB_ORDER as string[]).includes(v);

export function FbrInvoicesPage() {
  const months = useMemo(() => recentMonths(workingDate()), []);
  const defaultMonth = monthOf(workingDate());

  const [params, setParams] = useSearchParams();
  const status: TabId = isTab(params.get('status')) ? (params.get('status') as TabId) : 'all';
  const month = params.get('month') ?? defaultMonth;
  const buyer = params.get('buyer') ?? 'all';
  const province = params.get('province') ?? 'all';
  const search = (params.get('q') ?? '').trim().toLowerCase();

  const q = useFbrInvoices(month);
  const notify = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function setParam(key: string, value: string, fallback: string) {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  }

  // Everything except the status tab narrows the list; tab counts reflect those filters.
  const base = useMemo(() => (q.data ?? []).filter((i) =>
    (buyer === 'all' || i.buyer === buyer) &&
    (province === 'all' || i.province === province) &&
    (!search || [i.number, i.buyer, i.buyerRegNo, i.fbrNumber ?? ''].some((f) => f.toLowerCase().includes(search)))
  ), [q.data, buyer, province, search]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(TAB_ORDER.map((t) => [t, 0])) as Record<TabId, number>;
    c.all = base.length;
    base.forEach((i) => { c[i.status]++; });
    return c;
  }, [base]);

  const rows = status === 'all' ? base : base.filter((i) => i.status === status);
  const totals = rows.reduce((t, i) => ({ value: t.value + i.value, tax: t.tax + i.salesTax, further: t.further + i.furtherTax }), { value: 0, tax: 0, further: 0 });

  const buyers = useMemo(() => [...new Set((q.data ?? []).map((i) => i.buyer).filter(Boolean))].sort(), [q.data]);
  const provinces = useMemo(() => [...new Set((q.data ?? []).map((i) => i.province).filter(Boolean))].sort(), [q.data]);

  // Clear the selection when the visible set changes, so actions never touch hidden rows.
  useEffect(() => { setSelected(new Set()); }, [status, month, buyer, province, search]);

  const mLabel = monthName(month);
  const selectedRows = rows.filter((r) => selected.has(r.id));

  function exportSelected() {
    downloadCsv(
      `fbr-invoices-${month}.csv`,
      ['Invoice', 'Type', 'FBR invoice no.', 'Buyer', 'Registration no.', 'Registration type', 'Origin province', 'Destination province',
        'Value (PKR)', 'Sales tax (PKR)', 'Further tax (PKR)', 'Status', 'FBR message'],
      selectedRows.map((i) => [i.number, i.type, i.fbrNumber ?? '', i.buyer, i.buyerRegNo, i.registrationType, i.originProvince, i.province,
        i.value, i.salesTax, i.furtherTax, STATUS_LABEL[i.status], i.error ?? '']),
    );
    notify({ type: 'ok', title: `Exported ${plural(selectedRows.length, 'invoice')}`, sub: `fbr-invoices-${month}.csv` });
  }

  const columns: Column<FbrInvoice>[] = [
    {
      key: 'inv', header: 'Invoice', render: (i) => (
        <>
          <span className={'e-fbr-inv'}>{i.number}</span>
          <span className={'e-fbr-sub'}>{i.fbrNumber ? `FBR ${i.fbrNumber}` : i.type}</span>
        </>
      ),
    },
    {
      key: 'buyer', header: 'Buyer', render: (i) => (
        <>{i.buyer}<span className={'e-fbr-sub'}>{[i.buyerRegNo, i.registrationType].filter(Boolean).join(' · ')}</span></>
      ),
    },
    { key: 'prov', header: 'Destination', render: (i) => i.province },
    { key: 'value', header: 'Value (PKR)', align: 'right', render: (i) => amount(i.value) },
    { key: 'tax', header: 'Sales tax (PKR)', align: 'right', render: (i) => amount(i.salesTax) },
    { key: 'further', header: 'Further tax (PKR)', align: 'right', render: (i) => amount(i.furtherTax) },
    {
      key: 'status', header: 'Status', width: '24%', render: (i) => (
        <>
          <Badge tone={TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
          {i.error && <span className={'e-fbr-why'}>{i.error}</span>}
        </>
      ),
    },
  ];

  /* Per-row actions, the same ones the classic list offers (assets/js/FBRIntegration/DigitalInvoiceList.js):
     Re-open for Not validated / Suspicious, Update FBR invoice no. for Suspicious; both open the classic screen
     with ?ShortGUID=<InvoiceParentGUID>. Plus copying the numbers. */
  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); notify({ type: 'ok', title: `${what} copied`, sub: text }); }
    catch { notify({ type: 'bad', title: `Couldn’t copy the ${what.toLowerCase()}` }); }
  }
  const rowActions = (i: FbrInvoice): RowAction[] => {
    const list: RowAction[] = [{ label: 'Copy invoice number', onSelect: () => copy(i.number, 'Invoice number') }];
    if (i.fbrNumber) list.push({ label: 'Copy FBR invoice number', onSelect: () => copy(i.fbrNumber!, 'FBR invoice number') });
    if (i.guid && (i.status === 'notValidated' || i.status === 'suspicious')) {
      list.push({ label: 'Re-open invoice', to: `/classic/FBRIntegration/DigitalInvoiceReOpenEntry.aspx?ShortGUID=${encodeURIComponent(i.guid)}` });
    }
    if (i.guid && i.status === 'suspicious') {
      list.push({ label: 'Update FBR invoice number', to: `/classic/FBRIntegration/DigitalInvoiceUpdateRefNo.aspx?ShortGUID=${encodeURIComponent(i.guid)}` });
    }
    return list;
  };

  const failed = counts.notValidated;

  return (
    <>
      <PageHeader
        title="FBR digital invoices"
        subtitle={q.data ? `${plural(counts.all, 'invoice')} in ${mLabel}` : mLabel}
        actions={
          <>
            <Button to={LEGACY.import}>Import</Button>
            <Button to={LEGACY.add}>New invoice</Button>
            <Button variant="primary" to={LEGACY.posting}>
              {counts.validated > 0 ? `Post ${amount(counts.validated)} to FBR` : 'Post to FBR'}
            </Button>
          </>
        }
      />

      <section className={'e-fbr-panel'}>
        <Tabs
          label="Filter by status" controls="fbr-invoice-table"
          items={TAB_ORDER.map((id) => ({ id, label: TAB_LABEL[id], count: q.data ? counts[id] : undefined }))}
          value={status} onChange={(id) => setParam('status', id, 'all')}
        />

        {failed > 0 && status !== 'notValidated' && (
          <Alert variant="band" action={{ label: 'Review', onClick: () => setParam('status', 'notValidated', 'all') }}>
            {failed === 1 ? '1 invoice' : `${failed} invoices`} failed FBR validation and {failed === 1 ? 'needs' : 'need'} correction.
          </Alert>
        )}

        <FilterBar
          search={<SearchField label="Search invoices" placeholder="Search invoice, buyer, NTN…" value={params.get('q') ?? ''} onChange={(v) => setParam('q', v.trim(), '')} />}
        >
          <Select label="Month" value={month} onChange={(v) => setParam('month', v, defaultMonth)} options={months} />
          <Select label="Buyer" value={buyer} onChange={(v) => setParam('buyer', v, 'all')}
            options={[{ value: 'all', label: 'Any' }, ...buyers.map((b) => ({ value: b, label: b }))]} />
          <Select label="Destination" value={province} onChange={(v) => setParam('province', v, 'all')}
            options={[{ value: 'all', label: 'Any' }, ...provinces.map((p) => ({ value: p, label: p }))]} />
        </FilterBar>

        {selectedRows.length > 0 && (
          <div className={'e-fbr-selbar'} role="region" aria-label="Selection">
            <b>{plural(selectedRows.length, 'invoice')} selected</b>
            <Button variant="ghost" onClick={exportSelected}>Export to CSV</Button>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
        )}

        {q.isPending && <TableSkeleton rows={8} cols={6} label="Loading invoices" />}
        {q.isError && <LoadError what="FBR invoices" error={q.error} onRetry={() => q.refetch()} />}
        {q.data && (
          <>
            <DataTable
              id="fbr-invoice-table"
              caption={`FBR digital invoices, ${TAB_LABEL[status].toLowerCase()}, ${mLabel}`}
              columns={columns} rows={rows} rowId={(i) => i.id} rowLabel={(i) => i.number}
              selected={selected} onSelectedChange={setSelected} rowActions={rowActions}
              empty={search || buyer !== 'all' || province !== 'all'
                ? 'No invoices match these filters.'
                : status === 'all' ? `No invoices in ${mLabel}.` : `No “${TAB_LABEL[status]}” invoices in ${mLabel}.`}
            />
            {rows.length > 0 && (
              <div className={'e-fbr-foot'}>
                <span>{plural(rows.length, 'invoice')}</span>
                <span>Value <b>PKR {amount(totals.value)}</b></span>
                <span>Sales tax <b>PKR {amount(totals.tax)}</b></span>
                <span>Further tax <b>PKR {amount(totals.further)}</b></span>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
