import type { FbrInvoice, FbrStatus } from '../api/fbr/types';

/* Sample invoices in the shape the legacy handler returns, using the legacy statuses. Made-up data.
   The id starts with the month ("yyyy-mm") so the sample month filter works. */
type Row = [month: string, num: number, buyer: string, regNo: string, regType: string, province: string, value: number, status: FbrStatus, error?: string];

const ROWS: Row[] = [
  ['2026-11', 441, 'Mehran Foods (Pvt) Ltd', '4271093-6', 'Registered', 'Sindh', 1_284_600, 'notValidated', 'Buyer NTN is not active'],
  ['2026-11', 440, 'Indus Pharma (Pvt) Ltd', '3820117-4', 'Registered', 'Punjab', 642_300, 'validated'],
  ['2026-11', 439, 'Shaheen Traders', '1093384-2', 'Registered', 'Punjab', 98_400, 'posted'],
  ['2026-11', 438, 'Al-Noor Textiles', '2210945-8', 'Registered', 'Punjab', 2_410_000, 'posted'],
  ['2026-11', 437, 'Zubair & Sons', '0718823-1', 'Registered', 'Punjab', 56_250, 'posted'],
  ['2026-11', 436, 'Karachi Steel Works', '5521870-3', 'Registered', 'Sindh', 875_900, 'validated'],
  ['2026-11', 435, 'Al-Noor Textiles', '2210945-8', 'Registered', 'Punjab', 1_960_000, 'posted'],
  ['2026-11', 434, 'Margalla Builders', '4410382-9', 'Registered', 'Islamabad Capital Territory', 342_800, 'open'],
  ['2026-11', 433, 'Mehran Foods (Pvt) Ltd', '4271093-6', 'Registered', 'Sindh', 711_500, 'posted'],
  ['2026-11', 432, 'Peshawar Agro Mills', '3309127-5', 'Registered', 'Khyber Pakhtunkhwa', 488_000, 'inProgress'],
  ['2026-11', 431, 'Indus Pharma (Pvt) Ltd', '3820117-4', 'Registered', 'Punjab', 1_105_200, 'posted'],
  ['2026-11', 430, 'Walk-in customer', '3520212345671', 'Unregistered', 'Punjab', 64_900, 'posted'],
  ['2026-11', 429, 'Karachi Steel Works', '5521870-3', 'Registered', 'Sindh', 1_532_000, 'notValidated', 'HS code does not match the item description'],
  ['2026-11', 428, 'Zubair & Sons', '0718823-1', 'Registered', 'Punjab', 128_750, 'posted'],
  ['2026-11', 427, 'Margalla Builders', '4410382-9', 'Registered', 'Islamabad Capital Territory', 905_400, 'open'],
  ['2026-11', 426, 'Al-Noor Textiles', '2210945-8', 'Registered', 'Punjab', 2_087_500, 'posted'],
  ['2026-11', 425, 'Peshawar Agro Mills', '3309127-5', 'Registered', 'Khyber Pakhtunkhwa', 276_300, 'suspicious'],
  ['2026-11', 424, 'Mehran Foods (Pvt) Ltd', '4271093-6', 'Registered', 'Sindh', 934_000, 'validated'],
  ['2026-11', 423, 'Indus Pharma (Pvt) Ltd', '3820117-4', 'Registered', 'Punjab', 450_600, 'posted'],
  ['2026-11', 422, 'Shaheen Traders', '1093384-2', 'Registered', 'Punjab', 82_100, 'void'],
  ['2026-11', 421, 'Karachi Steel Works', '5521870-3', 'Registered', 'Sindh', 1_210_000, 'posted'],
  ['2026-11', 420, 'Zubair & Sons', '0718823-1', 'Registered', 'Punjab', 47_800, 'posted'],
  ['2026-11', 419, 'Al-Noor Textiles', '2210945-8', 'Registered', 'Punjab', 1_744_000, 'posted'],
  ['2026-11', 418, 'Margalla Builders', '4410382-9', 'Registered', 'Islamabad Capital Territory', 615_000, 'notValidated', 'Sales tax rate does not match the item schedule'],
  ['2026-10', 417, 'Al-Noor Textiles', '2210945-8', 'Registered', 'Punjab', 1_390_000, 'posted'],
  ['2026-10', 416, 'Indus Pharma (Pvt) Ltd', '3820117-4', 'Registered', 'Punjab', 720_400, 'posted'],
];

export const MOCK_INVOICES: FbrInvoice[] = ROWS.map(([month, n, buyer, regNo, regType, province, value, status, error]) => ({
  id: `${month}:inv-${n}`,
  status,
  number: `INV-2026-0${n}`,
  type: 'Sale Invoice',
  buyer, buyerRegNo: regNo, registrationType: regType,
  originProvince: 'Punjab',
  province, value,
  salesTax: Math.round(value * 0.18),
  furtherTax: regType === 'Unregistered' ? Math.round(value * 0.04) : 0,
  fbrNumber: status === 'posted' ? `7000123${month.replace('-', '')}0${n}` : undefined,
  error,
}));
