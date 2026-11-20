import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { classicRoute, useHasRoute, useNav } from '../../app/nav';
import { useFinanceSummary } from '../../api/dashboard/dashboard';
import type { FinanceSummary } from '../../api/dashboard/types';
import { useFbrInvoices } from '../../api/fbr/invoices';
import { STATUS_LABEL, type FbrStatus } from '../../api/fbr/types';
import { Alert } from '../../components/Alert/Alert';
import { BarChart } from '../../components/BarChart/BarChart';
import { Card } from '../../components/Card/Card';
import { GhostPattern } from '../../components/GhostPattern/GhostPattern';
import { Guilloche } from '../../components/Guilloche/Guilloche';
import { KpiCard } from '../../components/KpiCard/KpiCard';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ProgressTrack } from '../../components/ProgressTrack/ProgressTrack';
import { ChartSkeleton, KpiRowSkeleton, ListSkeleton } from '../../components/Loaders/Skeleton';
import { LoadError } from '../../components/QueryState/QueryState';
import { monthName, monthOf, workingDate } from '../../lib/dates';
import { amount, longDate, millions, percentChange, pkrMillions, shortDate } from '../../lib/format';

const FBR_ROWS: { status: FbrStatus; tone: 'ok' | 'wait' | 'bad' | 'neutral' }[] = [
  { status: 'posted', tone: 'ok' },
  { status: 'validated', tone: 'wait' },
  { status: 'open', tone: 'neutral' },
  { status: 'notValidated', tone: 'bad' },
];

export function DashboardPage() {
  const today = workingDate();
  const month = monthOf(today);
  const finance = useFinanceSummary(today);
  const canSeeFbr = useHasRoute('/fbr/invoices');
  const { loading: menuLoading } = useNav();
  // While rights are unknown, hold the FBR card's place with a skeleton (no FBR calls until rights are known).
  const fbrSlot = canSeeFbr ? <FbrCard month={month} />
    : menuLoading ? <Card title="FBR digital invoices"><ListSkeleton rows={4} label="Loading FBR invoices" /></Card>
      : null;

  return (
    <>
      <PageHeader title="Dashboard" subtitle={longDate(today)} actions={<span className={'e-dash-period'}><b>Reporting period</b> Month to date</span>} />

      {canSeeFbr && <FbrKpis month={month} />}

      {finance.isPending && (
        <>
          <KpiRowSkeleton />
          <section className={'e-dash-row'}>
            <ChartSkeleton />
            <Card title="FBR digital invoices"><ListSkeleton rows={4} label="Loading FBR invoices" /></Card>
          </section>
        </>
      )}
      {finance.isError && <Card flush><LoadError what="the dashboard" error={finance.error} onRetry={() => finance.refetch()} /></Card>}

      {finance.isSuccess && (finance.data ? (
        <FinanceView f={finance.data} month={month} fbrSlot={fbrSlot} />
      ) : (
        <section className={fbrSlot ? 'e-dash-row' : undefined}>
          <Card title="Sales, tax, cash and receivables" className="e-dash-ghost">
            <GhostPattern />
            <p className={'e-dash-muted'}>
              These figures aren’t connected yet: the current system has no data source the new screens can read them from.
              The full figures are still available in the classic reports.
            </p>
          </Card>
          {fbrSlot}
        </section>
      ))}
    </>
  );
}

/** Live FBR compliance figures for the month, from the same invoice list as the FBR screen (no extra calls:
   react-query shares the request with the FBR card). Void invoices are left out of value and tax. */
function FbrKpis({ month }: { month: string }) {
  const q = useFbrInvoices(month);
  if (q.isPending) return <KpiRowSkeleton />;
  if (q.isError || !q.data) return null;   // the FBR card below shows the error and a retry

  const live = q.data.filter((i) => i.status !== 'void');
  const n = (s: FbrStatus) => q.data.filter((i) => i.status === s).length;
  const posted = n('posted');
  const attention = n('notValidated') + n('suspicious');
  const ready = n('validated');
  const rate = live.length ? (posted / live.length) * 100 : 0;
  const value = live.reduce((s, i) => s + i.value, 0);
  const tax = live.reduce((s, i) => s + i.salesTax + i.furtherTax, 0);
  const mLabel = monthName(month);
  const pkr = (v: number) => (Math.abs(v) >= 1e6 ? pkrMillions(v) : `PKR ${amount(Math.round(v))}`);

  return (
    <section className={'e-dash-kpis e-dash-kpis-5'} aria-label={`FBR compliance, ${mLabel}`}>
      <KpiCard index={0} icon="fbr" label="Invoices this month" count={live.length} note={mLabel}
        pill={ready ? { tone: 'wait', text: `${amount(ready)} ready to post` } : undefined} />
      <KpiCard index={1} icon="ok" tone="ok" label="Posted to FBR" count={posted}
        meter={{ percent: rate, label: 'Share of invoices posted to FBR' }} note={`${Math.round(rate)}% of invoices`} />
      <KpiCard index={2} icon="sales" label="Value of sales" count={value} format={pkr} note="excluding void" />
      <KpiCard index={3} icon="reports" tone="wait" label="Sales + further tax" count={tax} format={pkr} note="on this month’s invoices" />
      <KpiCard index={4} icon="bad" tone={attention ? 'bad' : 'ok'} label="Needs attention" count={attention}
        note={attention ? <Link to="/fbr/invoices?status=notValidated">Not validated or suspicious</Link> : 'Nothing failed'} />
    </section>
  );
}

function FbrCard({ month }: { month: string }) {
  const q = useFbrInvoices(month);
  const navigate = useNavigate();
  const counts = (q.data ?? []).reduce<Record<string, number>>((c, i) => ({ ...c, [i.status]: (c[i.status] ?? 0) + 1 }), {});
  const failed = counts.notValidated ?? 0;

  return (
    <Card title="FBR digital invoices" note={monthName(month)}>
      {q.isPending && <ListSkeleton rows={4} label="Loading FBR invoices" />}
      {q.isError && <LoadError what="FBR invoices" error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <>
          <ul className={'e-dash-status'}>
            {FBR_ROWS.map(({ status, tone }) => (
              <li key={status}>
                <Link to={`/fbr/invoices?status=${status}`}>{STATUS_LABEL[status]}</Link>
                <b className={`e-dash-${tone}`}>{amount(counts[status] ?? 0)}</b>
              </li>
            ))}
          </ul>
          {failed > 0 && (
            <Alert action={{ label: 'Review', onClick: () => navigate('/fbr/invoices?status=notValidated') }}>
              {failed} {failed === 1 ? 'invoice failed' : 'invoices failed'} FBR validation and {failed === 1 ? 'needs' : 'need'} correction.
            </Alert>
          )}
        </>
      )}
    </Card>
  );
}

/** Headline widget (user reference "Cash position"): one large serif figure, the day's change in its state
   colour, the bank/cash breakdown under a hairline, and the guilloché rosette off the right edge. */
function CashHero({ cash }: { cash: FinanceSummary['cash'] }) {
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const down = cash.changeSinceYesterday < 0;
  return (
    <section className="e-hero" aria-labelledby="cash-hero-title">
      <Guilloche petals={20} />
      <h2 id="cash-hero-title" className="e-hero-label">Cash position</h2>
      <p className="e-hero-figure"><small>PKR</small>{grouped.format(cash.total)}</p>
      <p className={`e-hero-change ${down ? 'is-down' : 'is-up'}`}>
        {down ? 'Down' : 'Up'} {grouped.format(Math.abs(cash.changeSinceYesterday))} since yesterday{cash.note ? ` · ${cash.note}` : ''}
      </p>
      {!!cash.accounts?.length && (
        <dl className="e-hero-split">
          {cash.accounts.map((a) => (
            <div key={a.name}><dt>{a.name}</dt><dd>{grouped.format(a.amount)}</dd></div>
          ))}
        </dl>
      )}
    </section>
  );
}

function FinanceView({ f, month, fbrSlot }: { f: FinanceSummary; month: string; fbrSlot: ReactNode }) {
  const ageTotal = f.ageing.reduce((s, a) => s + a.amount, 0);
  const first = f.salesByDay[0]?.day ?? 1;
  const last = f.salesByDay[f.salesByDay.length - 1]?.day ?? 1;
  const mName = monthName(month).split(' ')[0];

  return (
    <>
      <CashHero cash={f.cash} />
      {/* Cash and bank is carried by the Cash position widget above, so it is not repeated as a card */}
      <section className={'e-dash-kpis e-dash-kpis-5'} aria-label="Key figures">
        <KpiCard index={5} icon="sales" label="Sales" count={f.sales.total} format={pkrMillions}
          pill={{ tone: f.sales.change >= 0 ? 'ok' : 'bad', text: percentChange(f.sales.change) }} note={f.sales.versus} />
        <KpiCard index={6} guilloche icon="reports" tone="wait" label="Sales tax payable" count={f.taxPayable.total} format={pkrMillions}
          pill={{ tone: 'wait', text: `Due ${shortDate(f.taxPayable.dueDate).replace(/ \d{4}$/, '')}` }} note={`${f.taxPayable.daysLeft} days`} />
        <KpiCard index={8} guilloche icon="wait" tone="bad" label="Receivables" count={f.receivables.total} format={pkrMillions}
          meter={{ percent: f.receivables.total ? (f.receivables.over90 / f.receivables.total) * 100 : 0, label: 'Share of receivables over 90 days' }}
          pill={{ tone: 'bad', text: millions(f.receivables.over90) }} note="over 90 days" />
      </section>

      <section className={fbrSlot ? 'e-dash-row' : undefined}>
        <Card title="Sales by day" note={`PKR millions, ${first}–${last} ${mName}`}>
          <BarChart
            label={`Daily sales from ${first} to ${last} ${mName}. Best day PKR ${millions(Math.max(...f.salesByDay.map((b) => b.value)))}.`}
            bars={f.salesByDay.map((b) => ({
              label: String(b.day), value: b.value, kind: b.kind,
              title: `${b.day} ${mName}: PKR ${amount(b.value)}${b.kind === 'partial' ? ' so far' : ''}`,
            }))}
          />
        </Card>
        {fbrSlot}
      </section>

      <section className={'e-dash-row3'}>
        <Card title="Receivables ageing" note="PKR m">
          <table className={'e-dash-list'}>
            <tbody>
              {f.ageing.map((a) => (
                <tr key={a.label}>
                  <td>{a.label}<ProgressTrack percent={(a.amount / ageTotal) * 100} tone={a.overdue ? 'bad' : 'accent'} /></td>
                  <td className={'e-dash-n'}>{(a.amount / 1e6).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Top buyers" note="PKR m">
          <table className={'e-dash-list'}>
            <tbody>
              {f.topBuyers.map((b) => (
                <tr key={b.name}><td>{b.name}</td><td className={'e-dash-n'}>{(b.amount / 1e6).toFixed(1)}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Needs attention">
          <table className={'e-dash-list'}>
            <tbody>
              {f.attention.map((a) => (
                <tr key={a.label}>
                  <td>{a.href ? <Link to={classicRoute(a.href) ?? a.href}>{a.label}</Link> : a.label}</td>
                  <td className={'e-dash-n'}>{a.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </>
  );
}
