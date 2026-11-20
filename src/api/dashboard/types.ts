/* Finance figures for the dashboard. No existing legacy handler returns these as data
   (see docs/FRONTEND_CONVERSION.md, "Dashboard data sources"), so they exist only as sample data for now. */
export interface FinanceSummary {
  sales: { total: number; change: number; versus: string };          // change as ratio, e.g. 0.062
  taxPayable: { total: number; dueDate: string; daysLeft: number };
  cash: { total: number; changeSinceYesterday: number; note?: string; accounts?: { name: string; amount: number }[] };
  receivables: { total: number; over90: number };
  salesByDay: { day: number; value: number; kind: 'main' | 'soft' | 'partial' }[];
  ageing: { label: string; amount: number; overdue?: boolean }[];
  topBuyers: { name: string; amount: number }[];
  attention: { label: string; value: string; href?: string }[];
}
