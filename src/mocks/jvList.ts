/* Sample rows for the journal voucher list (VITE_USE_MOCKS=true). Shape matches PopulateALLAdjustmentList. */

const row = (n: number, code: string, branch: string, day: number, status: number, amount: number, jvType = 0) => ({
  Sno: n, Code: code, Branch: branch, TransDate: `2026-11-${String(day).padStart(2, '0')}T00:00:00`,
  VoucherStatus: status, TotalAmount: amount, JVTypeId: jvType, ShortGUID: `guid-${n}`, ID: 1000 + n,
});

export const MOCK_JV_LIST = [
  row(1, 'JV-1042', 'Head Office 01', 3, 2, 1_250_000),
  row(2, 'JV-1043', 'Head Office 01', 5, 4, 84_500),
  row(3, 'JV-1044', 'Lahore Branch', 6, 3, 312_000),
  row(4, 'MJV-0211', 'Head Office 01', 9, 1, 2_480_750, 2),
  row(5, 'JV-1045', 'Head Office 01', 11, 2, 56_000),
  row(6, 'JV-1046', 'Lahore Branch', 12, 40, 19_900),
  row(7, 'JV-1047', 'Head Office 01', 14, 4, 745_300),
  row(8, 'JV-1048', 'Head Office 01', 17, 2, 1_002_000),
  row(9, 'MJV-0212', 'Lahore Branch', 18, 4, 430_250, 2),
  row(10, 'JV-1049', 'Head Office 01', 19, 2, 98_760),
  row(11, 'JV-1050', 'Head Office 01', 19, 4, 12_400),
];
