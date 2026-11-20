import { useQuery } from '@tanstack/react-query';
import { useMocks } from '../http';
import { MOCK_FINANCE } from '../../mocks/dashboard';
import { sampleDelay } from '../../mocks/delay';
import type { FinanceSummary } from './types';

/* Finance figures (sales, tax payable, cash, receivables, ageing, top buyers).
   Checked 2026-11-19, read-only:
   - Dashboard/CEODashBoard.ashx PopulateDashboardInfo returns companies, projects, users, branches,
     employees and attendance; no money figures.
   - FBRIntegration/FBRDashBoard.ashx returns attendance, AEO collections and employee records.
   - Reports/*Viewer.ashx (AgedReceivable, DailySalesReport, ...) build Crystal report files, not data.
   So live mode returns null and the dashboard says the figures are not connected,
   rather than mixing sample numbers with live ones. The FBR figures on the dashboard are live
   (they come from useFbrInvoices). */
async function fetchFinance(): Promise<FinanceSummary | null> {
  if (useMocks) return sampleDelay(MOCK_FINANCE);
  return null;
}

export function useFinanceSummary(date: string) {
  return useQuery({ queryKey: ['dashboard', 'finance', date], queryFn: fetchFinance });
}
