import { reportRoute } from '../../lib/reportRoute';
import { MOCK_JV_LIST } from '../../mocks/jvList';
import { handlerUrl, isRole, num, str, withGuid, type FilterDef, type ListAction, type ListDef } from '../engine';

/* JV module lists. Each definition is read from the classic page (controls, page vars), its script in
   assets/js/JV/<Name>.js (ajax URL and parameters, DataTables columns and the Action(s) render function)
   and the handler action. Comments name the classic source of every rule. */

const BRANCH: FilterDef = { key: 'branch', label: 'Branch', kind: 'select', control: 'DropDownListBranch', param: 'BranchId', required: true };
const STATUS: FilterDef = { key: 'status', label: 'Status', kind: 'select', control: 'DropDownListStatus', param: 'StatusId', required: true };
const START: FilterDef = { key: 'start', label: 'Start date', kind: 'date', control: 'TextBoxStartDate', param: 'StartDate' };
const END: FilterDef = { key: 'end', label: 'End date', kind: 'date', control: 'TextBoxEndDate', param: 'EndDate' };

const html = (ctx: { vars: Record<string, string> }, guid: string, report: string): ListAction[] =>
  ctx.vars.HTMLReportViewerURL && guid ? [{ label: 'HTML view', kind: 'tab', url: reportRoute(`${ctx.vars.HTMLReportViewerURL}?guid=${encodeURIComponent(guid)}&report=${report}`) }] : [];
const classic = (label: string, url: string | null): ListAction[] => (url ? [{ label, kind: 'classic', url }] : []);

/** JVAdjustmentsList.aspx / JVAdjustmentsList.js */
export const JV_ADJUSTMENTS_LIST: ListDef = {
  id: 'jv-adjustments',
  route: '/accounts/jv',
  legacyPage: '/JV/JVAdjustmentsList.aspx',
  title: 'Journal vouchers',
  listTitle: 'Journal Voucher List',
  newScreen: { label: 'New journal voucher', to: '/accounts/jv/new' },
  loadOnOpen: true,                       // DataTables "ajax" at start, with the selected status (-1 = all)
  filters: [
    { ...BRANCH, required: true },
    { ...STATUS, required: false, hideValues: ['-1'], roleLimit: { roles: [21, 22], values: ['2', '40'] } },
    START, END,
  ],
  handler: 'JV/JVAdjustmentsList',
  action: 'PopulateALLAdjustmentList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'sno', header: 'Serial no', field: 'Sno', width: '96px' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'text' },
    { key: 'branch', header: 'Branch', field: 'Branch' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'status', header: 'Status', field: 'VoucherStatus', kind: 'status' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
    { key: 'branches', header: 'Branch(s)', field: 'Branch' },
  ],
  // Edit/Delete for Open (4) and Rejected (3); also Approved (2) for roles 12, 21, 22. JVTypeId > 0 → multi JV edit.
  rowActions: (r, ctx) => {
    const s = num(r, 'VoucherStatus');
    const guid = str(r, 'ShortGUID');
    const editable = s === 4 || s === 3 || (isRole(ctx, 12, 21, 22) && s === 2);
    const edit = editable ? withGuid(ctx, num(r, 'JVTypeId') > 0 ? 'MultiJVAdjustmentsEdit' : 'JVAdjustmentsEdit', guid) : null;
    return [
      ...classic('Edit / Delete', edit),
      ...html(ctx, guid, 'JV'),
      { label: 'Report', kind: 'report', url: handlerUrl('JV/JVAdjustments', 'JVAdjustmentReportById', { AdjustmentId: str(r, 'ID') }) },
    ];
  },
  mockRows: MOCK_JV_LIST,
};

/** AddChargesList.aspx / AddChargesList.js: type, branch, SDate, EDate; Edit/Delete for every row */
export const ADD_CHARGES_LIST: ListDef = {
  id: 'charges',
  route: '/accounts/charges',
  legacyPage: '/JV/AddChargesList.aspx',
  title: 'Charges',
  listTitle: 'Charges List',
  loadOnOpen: true,
  filters: [
    { key: 'type', label: 'Type', kind: 'select', control: 'DropDownListType', param: 'TypeId', relabel: { '-1': 'All types' } },
    { ...BRANCH, required: false },
    { key: 'start', label: 'Start date', kind: 'date', control: 'TextBoxStartDate', param: 'SDate' },
    { key: 'end', label: 'End date', kind: 'date', control: 'TextBoxEndDate', param: 'EDate' },
  ],
  handler: 'JV/AddChargesList',
  action: 'AddChargesList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 61 },
    { key: 'ref', header: 'RefNo.', field: 'RefNo' },
    { key: 'date', header: 'TransDate', field: 'TransDate', kind: 'date' },
    { key: 'branch', header: 'Branch(s)', field: 'BranchName' },
    { key: 'amount', header: 'Total Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => classic('Edit / Delete', withGuid(ctx, 'EditChargesURLS', str(r, 'ShortGUID'))),
};

/** GratuityFundList.aspx / GratuityFundList.js: waits for Search; the classic Action(s) column is empty ("N/A") */
export const GRATUITY_FUND_LIST: ListDef = {
  id: 'gratuity-fund',
  route: '/accounts/gratuity-fund',
  legacyPage: '/JV/GratuityFundList.aspx',
  title: 'Gratuity fund',
  listTitle: 'Gratuity Fund List',
  loadOnOpen: false,
  filters: [BRANCH, STATUS, START, END],
  handler: 'JV/GratuityFundList',
  action: 'PopulateGratuityFundList',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code' },
    { key: 'desc', header: 'Description(s)', field: 'Description' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'account', header: 'Account(s)', field: 'Account' },
    { key: 'status', header: 'Status', field: 'GratuityStatus', kind: 'status' },
  ],
};

/** LeaveEncashmentList.aspx / LeaveEncashmentList.js: code GetCode(103); no row actions */
export const LEAVE_ENCASHMENT_LIST: ListDef = {
  id: 'leave-encashment',
  route: '/accounts/leave-encashment',
  legacyPage: '/JV/LeaveEncashmentList.aspx',
  title: 'Leave encashment',
  listTitle: 'Leave Encashment List',
  loadOnOpen: false,
  filters: [BRANCH, STATUS, START, END],
  handler: 'JV/LeaveEncashmentList',
  action: 'PopulateLeaveEncashmentList',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 103 },
    { key: 'desc', header: 'Description(s)', field: 'Description' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'status', header: 'Status', field: 'LeaveEncashmentStatus', kind: 'status' },
  ],
};

/** PFProfitDistributionList.aspx / PFProfitDistributionList.js: code GetCode(78) as on the classic list; no row actions.
    (The classic page title reads "Inter Branch Transfer List", a copy leftover; the real name is used here.) */
export const PF_PROFIT_DISTRIBUTION_LIST: ListDef = {
  id: 'pf-profit-distribution',
  route: '/accounts/pf-profit-distribution',
  legacyPage: '/JV/PFProfitDistributionList.aspx',
  title: 'PF profit distribution',
  listTitle: 'PF Profit Distribution List',
  loadOnOpen: false,
  filters: [BRANCH, STATUS, START, END],
  handler: 'JV/PFProfitDistributionList',
  action: 'PopulateProfitDistributionList',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 78 },
    { key: 'desc', header: 'Description(s)', field: 'Description' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'type', header: 'Type(s)', field: 'Type' },
    { key: 'status', header: 'Status', field: 'ProfitDistributionStatus', kind: 'status' },
  ],
};

/** InterFundTransferList.aspx / InterFundTransferList.js */
export const INTER_FUND_TRANSFER_LIST: ListDef = {
  id: 'inter-fund-transfer',
  route: '/accounts/inter-fund-transfer',
  legacyPage: '/JV/InterFundTransferList.aspx',
  title: 'Inter fund transfers',
  listTitle: 'List for Inter Fund Transfer',
  printTitle: 'Inter Fund Transfer List',
  loadOnOpen: false,
  filters: [BRANCH, STATUS, START, END],
  handler: 'JV/InterFundTransferList',
  action: 'PopulateIFTList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 78 },
    { key: 'from', header: 'Fund Transfer From', field: 'FundManagementTypeFrm' },
    { key: 'to', header: 'Fund Transfer To', field: 'FundManagementTypeTo' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
    { key: 'status', header: 'Status', field: 'NGOTransferStatus', kind: 'status' },
    { key: 'branches', header: 'Branch(s)', field: 'Branch' },
  ],
  // Edit (Edit/Delete for role 12) on Open (4) / Rejected (3), and on Approved (2) for role 12; Report and HTML view always.
  rowActions: (r, ctx) => {
    const s = num(r, 'NGOTransferStatus');
    const guid = str(r, 'ShortGUID');
    const r12 = isRole(ctx, 12);
    const editable = s === 4 || s === 3 || (r12 && s === 2);
    return [
      ...classic(r12 ? 'Edit / Delete' : 'Edit', editable ? withGuid(ctx, 'IFTEdit', guid) : null),
      { label: 'Report', kind: 'report', url: handlerUrl('JV/InterFundTransfer', 'InterTransferReport', { InterTransferId: str(r, 'Id') }) },
      ...html(ctx, guid, 'IFT'),
    ];
  },
};

/** MultiFundJVList.aspx / MultiFundJVList.js: status filter (VoucherStatus), loads on open; Report only */
export const MULTI_FUND_JV_LIST: ListDef = {
  id: 'multi-fund-jv',
  route: '/accounts/multi-fund-jv',
  legacyPage: '/JV/MultiFundJVList.aspx',
  title: 'Multi fund journal vouchers',
  listTitle: 'MultiFund JV List',
  loadOnOpen: true,
  filters: [{ key: 'status', label: 'Status', kind: 'select', control: 'DropDownListStatus', param: 'VoucherStatus' }],
  handler: 'JV/MultiFundJVList',
  action: 'PopulateAdjustmentList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 100 },
    { key: 'branch', header: 'Branch', field: 'Branch' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'status', header: 'Status', field: 'VoucherStatus', kind: 'status' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r) => [{ label: 'Report', kind: 'report', url: handlerUrl('JV/MultiFundJV', 'JVAdjustmentReportById', { AdjustmentId: str(r, 'ID') }) }],
};

/** JVList.aspx / JVList.js: no filters, loads on open; Edit (Edit/Delete for role 12) and Report */
export const JV_LIST: ListDef = {
  id: 'jv-list',
  route: '/accounts/jv-list',
  legacyPage: '/JV/JVList.aspx',
  title: 'JV list',
  listTitle: 'JV List',
  loadOnOpen: true,
  filters: [],
  handler: 'JV/JVList',
  action: 'PopulateJVList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 1 },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => [
    ...classic(isRole(ctx, 12) ? 'Edit / Delete' : 'Edit', withGuid(ctx, 'AddJVURL', str(r, 'ShortGUID'))),
    { label: 'Report', kind: 'report', url: handlerUrl('JV/AddJVHandler', 'JVReportById', { JvId: str(r, 'Id') }) },
  ],
};

export const JV_LISTS: ListDef[] = [
  JV_ADJUSTMENTS_LIST, ADD_CHARGES_LIST, GRATUITY_FUND_LIST, LEAVE_ENCASHMENT_LIST, PF_PROFIT_DISTRIBUTION_LIST,
  INTER_FUND_TRANSFER_LIST, MULTI_FUND_JV_LIST, JV_LIST,
];
