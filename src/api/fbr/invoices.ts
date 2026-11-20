import { useQuery } from '@tanstack/react-query';
import { postHandler, useMocks } from '../http';
import { MOCK_INVOICES } from '../../mocks/fbrInvoices';
import { sampleDelay } from '../../mocks/delay';
import { STATUSES, STATUS_CODE, type FbrInvoice, type FbrStatus } from './types';

/* Legacy contract, read from the legacy code (no backend change):
   - assets/js/FBRIntegration/DigitalInvoiceList.js
   - AjaxHandlers/FBRIntegration/DigitalInvoiceList.ashx
   - App_Code/Helper/FBRIntegration/DigitalInvoiceListHelper.cs

   PopulateInvoiceList: form fields Month ("November-2026", parsed with "MMMM-yyyy"), BranchId, StatusId.
     One DocumentStatus per call, so the list loads every status in parallel.
     BranchId "0" = every branch the user may see; the server applies the role/branch rules.
     Response: { data: DigitalInvoice_GetDataForList_Result[] }, HTTP 500 with data null on failure.
   PopulateErrorInvoiceList: same fields, ignores StatusId; rows carry an Error text. */

interface RawRow {
  RegistrationNo: string | null;
  Name: string | null;
  RegistrationType: string | null;
  SaleOriginationProvinceofSupplier: string | null;
  DestinationofSupply: string | null;
  Type: string | null;
  Number: string | null;
  DocumentStatus: number | null;
  InvoiceParentGUID: string | null;
  TotalValueofSales: number;
  TotalSalesTax: number;
  TotalFurtherTax: number;
  TotalFixedNotifiedValue: number;
  LogInvoiceParentGUID: string | null;
  InvoiceReferenceNo: string | null;
  IdGuid?: string | null;
}
interface RawErrorRow extends RawRow { Error: string | null }

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-11" → "November-2026", the format the legacy month picker sends. */
export function legacyMonth(ym: string) {
  const [y, m] = ym.split('-');
  return `${MONTH_NAMES[Number(m) - 1]}-${y}`;
}

const BRANCH_ALL_ALLOWED = '0';
const HANDLER = 'FBRIntegration/DigitalInvoiceList';

function mapRow(r: RawRow, status: FbrStatus, i: number): FbrInvoice {
  const number = (r.Number ?? '').trim();
  return {
    id: `${status}:${r.IdGuid ?? r.InvoiceParentGUID ?? number}:${i}`,
    status,
    number,
    type: r.Type ?? '',
    buyer: r.Name ?? '',
    buyerRegNo: r.RegistrationNo ?? '',
    registrationType: r.RegistrationType ?? '',
    originProvince: r.SaleOriginationProvinceofSupplier ?? '',
    province: r.DestinationofSupply ?? '',
    value: Number(r.TotalValueofSales) || 0,
    salesTax: Number(r.TotalSalesTax) || 0,
    furtherTax: Number(r.TotalFurtherTax) || 0,
    fbrNumber: r.InvoiceReferenceNo?.trim() || undefined,
    guid: r.InvoiceParentGUID ?? undefined,
  };
}

async function fetchStatus(month: string, status: FbrStatus): Promise<FbrInvoice[]> {
  const res = await postHandler<{ data: RawRow[] | null }>(HANDLER, 'PopulateInvoiceList', {
    Month: legacyMonth(month), BranchId: BRANCH_ALL_ALLOWED, StatusId: STATUS_CODE[status],
  });
  return (res?.data ?? []).map((r, i) => mapRow(r, status, i));
}

/** Error text per invoice number. Several errors on one invoice are joined. */
async function fetchErrors(month: string): Promise<Map<string, string>> {
  const res = await postHandler<{ data: RawErrorRow[] | null }>(HANDLER, 'PopulateErrorInvoiceList', {
    Month: legacyMonth(month), BranchId: BRANCH_ALL_ALLOWED, StatusId: STATUS_CODE.notValidated,
  });
  const map = new Map<string, string>();
  for (const r of res?.data ?? []) {
    const n = (r.Number ?? '').trim();
    const e = (r.Error ?? '').trim();
    if (!n || !e) continue;
    const prev = map.get(n);
    if (!prev) map.set(n, e);
    else if (!prev.split('; ').includes(e)) map.set(n, `${prev}; ${e}`);
  }
  return map;
}

async function fetchInvoices(month: string): Promise<FbrInvoice[]> {
  if (useMocks) return sampleDelay(MOCK_INVOICES.filter((i) => i.id.startsWith(month)));

  const [lists, errors] = await Promise.all([
    Promise.all(STATUSES.map((s) => fetchStatus(month, s))),
    // The error list is extra detail; the invoice list still shows if it fails.
    fetchErrors(month).catch(() => new Map<string, string>()),
  ]);
  return lists.flat().map((inv) => (inv.status === 'notValidated' && errors.has(inv.number) ? { ...inv, error: errors.get(inv.number) } : inv));
}

/** All FBR invoices of one month ("yyyy-mm"), every status. Shared by the list and the dashboard. */
export function useFbrInvoices(month: string) {
  return useQuery({ queryKey: ['fbr', 'invoices', month], queryFn: () => fetchInvoices(month) });
}
