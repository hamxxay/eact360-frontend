import type { JvPageContext } from '../api/jv/types';

/* Sample data for the journal voucher screen (VITE_USE_MOCKS=true). Shapes match the legacy handlers. */

export const MOCK_JV_CONTEXT: JvPageContext = {
  allowed: true,
  projectApplicable: true,
  fundClassApplicable: true,
  donorApplicable: true,
  constructionCompany: true,
  projects: [
    { value: '11', label: 'Karachi Warehouse Expansion' },
    { value: '12', label: 'Lahore Retail Fit-out' },
    { value: '13', label: 'Solar Rooftop Phase 2' },
  ],
  fundClasses: [
    { value: '1', label: 'Unrestricted' },
    { value: '2', label: 'Restricted' },
    { value: '3', label: 'Endowment' },
  ],
  dateFormat: 'dd/MM/yyyy',
  currencySymbol: 'Rs.',
  roleId: null,
  periodStart: '2026-07-01',
  periodEnd: '2027-06-30',
  reportViewerUrl: '',
  jvListUrl: '',
  managerInboxUrl: '',
};

export const MOCK_ACCOUNTS = [
  { Id: 101, Description: 'Cash in Hand', Category: 'Assets', ShortDesc: '1-01-001', AccountNature: 'Debit' },
  { Id: 102, Description: 'Meezan Bank Current A/c', Category: 'Assets', ShortDesc: '1-02-004', AccountNature: 'Debit' },
  { Id: 140, Description: '( IBTF ) Inter Branch Transfer Account', Category: 'Assets', ShortDesc: '1-09-001', AccountNature: 'Debit' },
  { Id: 201, Description: 'Accounts Payable', Category: 'Liabilities', ShortDesc: '2-01-001', AccountNature: 'Credit' },
  { Id: 215, Description: 'Accrued Salaries', Category: 'Liabilities', ShortDesc: '2-03-002', AccountNature: 'Credit' },
  { Id: 410, Description: 'Sales Revenue', Category: 'Income', ShortDesc: '4-01-001', AccountNature: 'Credit' },
  { Id: 510, Description: 'Salaries Expense', Category: 'Expenses', ShortDesc: '5-01-001', AccountNature: 'Debit' },
  { Id: 520, Description: 'Rent Expense', Category: 'Expenses', ShortDesc: '5-02-001', AccountNature: 'Debit' },
  { Id: 530, Description: 'Utilities Expense', Category: 'Expenses', ShortDesc: '5-02-004', AccountNature: 'Debit' },
];

export const MOCK_DONORS = [
  { Id: 1, Name: 'Aga Khan Foundation', Code: 'DN-001' },
  { Id: 2, Name: 'Edhi Foundation', Code: 'DN-002' },
  { Id: 3, Name: 'Shaukat Khanum Trust', Code: 'DN-003' },
];

export const MOCK_ACTIVITIES: Record<string, { Id: number; Description: string }[]> = {
  '11': [{ Id: 1101, Description: 'Civil works' }, { Id: 1102, Description: 'Racking' }],
  '12': [{ Id: 1201, Description: 'Shop front' }, { Id: 1202, Description: 'Lighting' }],
  '13': [{ Id: 1301, Description: 'Panels' }, { Id: 1302, Description: 'Inverters' }],
};
