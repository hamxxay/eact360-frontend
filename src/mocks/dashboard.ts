import type { FinanceSummary } from '../api/dashboard/types';

/* Sample finance figures from design-options/standard/dashboard.html. Made-up data. */

// Bar heights from the mock (percent of the best day), scaled so the month-to-date total is PKR 46.6m.
const HEIGHTS = [10, 88, 76, 71, 83, 93, 54, 7, 85, 80, 100, 78, 95, 63, 12, 95, 46];
const SUNDAYS = new Set([1, 8, 15]); // November 2026
const TOTAL = 46_600_000;
const sum = HEIGHTS.reduce((a, b) => a + b, 0);

export const MOCK_FINANCE: FinanceSummary = {
  sales: { total: TOTAL, change: 0.062, versus: 'vs October' },
  taxPayable: { total: 4_810_000, dueDate: '2026-12-18', daysLeft: 31 },
  cash: {
    total: 12_906_400,
    changeSinceYesterday: -1_612_000,
    note: 'salaries paid',
    accounts: [
      { name: 'HBL main', amount: 6_214_900 },
      { name: 'Meezan', amount: 4_102_500 },
      { name: 'MCB', amount: 1_889_000 },
      { name: 'Cash in hand', amount: 700_000 },
    ],
  },
  receivables: { total: 21_300_000, over90: 1_600_000 },
  salesByDay: HEIGHTS.map((h, i) => ({
    day: i + 1,
    value: Math.round((h / sum) * TOTAL),
    kind: i === HEIGHTS.length - 1 ? 'partial' : SUNDAYS.has(i + 1) ? 'soft' : 'main',
  })),
  ageing: [
    { label: '0–30 days', amount: 9_800_000 },
    { label: '31–60 days', amount: 7_300_000 },
    { label: 'Over 60 days', amount: 4_200_000, overdue: true },
  ],
  topBuyers: [
    { name: 'Al-Noor Textiles', amount: 8_400_000 },
    { name: 'Mehran Foods (Pvt) Ltd', amount: 6_100_000 },
    { name: 'Indus Pharma (Pvt) Ltd', amount: 4_900_000 },
  ],
  attention: [
    { label: 'Purchase bills to approve', value: '2', href: '/PurchaseOrders/InvoiceApprovalList.aspx' },
    { label: 'Bank reconciliation, HBL', value: 'Oct' },
    { label: 'Items below reorder level', value: '3' },
  ],
};
