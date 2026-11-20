import { reportRoute } from '../../lib/reportRoute';
import { handlerUrl, isRole, num, str, withGuid, type ListAction, type ListDef } from '../engine';

/* JV-module approval lists. Each is read from its classic page (page vars: ApproveURL, AddJVURL,
   HTMLReportViewerURL), its script in assets/js/JV/<Name>.js (ajax URL, DataTables columns, Action(s) render)
   and its handler. They load on open with no filters. Approving happens on the classic approval page that
   "View & approval" opens (ApproveURL?guid=…); nothing is approved from the list itself. */

const classic = (label: string, url: string | null): ListAction[] => (url ? [{ label, kind: 'classic', url }] : []);
const approve = (r: Record<string, unknown>, ctx: Parameters<NonNullable<ListDef['rowActions']>>[1]) =>
  classic('View & approval', withGuid(ctx, 'ApproveURL', str(r, 'ShortGUID')));
const html = (ctx: { vars: Record<string, string> }, guid: string, report: string): ListAction[] =>
  ctx.vars.HTMLReportViewerURL && guid ? [{ label: 'HTML view', kind: 'tab', url: reportRoute(`${ctx.vars.HTMLReportViewerURL}?guid=${encodeURIComponent(guid)}&report=${report}`) }] : [];
const report = (path: string, action: string, params: Record<string, string>): ListAction => ({ label: 'Report', kind: 'report', url: handlerUrl(path, action, params) });
/** Inter-branch: TransferTypeId 2 = single (IBT-), otherwise multi (MIBT-) */
const ibtType = (r: Record<string, unknown>) => (num(r, 'TransferTypeId') === 2 ? 77 : 95);

/** JVAdjustmentsApprovalList.js: View & Approval + HTML View */
export const JV_APPROVAL_LIST: ListDef = {
  id: 'jv-approvals',
  route: '/accounts/approvals/jv',
  legacyPage: '/JV/JVAdjustmentsApprovalList.aspx',
  title: 'Journal voucher approvals',
  listTitle: 'JV Adjustments Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/JVAdjustmentsApprovalList',
  action: 'PopulateApprovalList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code' },
    { key: 'branch', header: 'Branch', field: 'Branch' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'status', header: 'Status', field: 'VoucherStatus', kind: 'status' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => [...approve(r, ctx), ...html(ctx, str(r, 'ShortGUID'), 'JV')],
};

/** MultiFundJVApprovalList.js: code GetCode(98) as on the classic list; View & Approval + Report */
export const MULTI_FUND_JV_APPROVAL_LIST: ListDef = {
  id: 'multi-fund-jv-approvals',
  route: '/accounts/approvals/multi-fund-jv',
  legacyPage: '/JV/MultiFundJVApprovalList.aspx',
  title: 'Multi fund JV approvals',
  listTitle: 'Multi Fund JV Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/MultiFundJVApprovalList',
  action: 'PopulateApprovalList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 98 },
    { key: 'branch', header: 'Branch', field: 'Branch' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'status', header: 'Status', field: 'VoucherStatus', kind: 'status' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => [...approve(r, ctx), report('JV/JVAdjustments', 'JVAdjustmentReportById', { AdjustmentId: str(r, 'ID') })],
};

/** GratuityFundApprovalList.js: Report + View & Approval */
export const GRATUITY_FUND_APPROVAL_LIST: ListDef = {
  id: 'gratuity-fund-approvals',
  route: '/accounts/approvals/gratuity-fund',
  legacyPage: '/JV/GratuityFundApprovalList.aspx',
  title: 'Gratuity fund approvals',
  listTitle: 'Gratuity Fund Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/GratuityFundApprovalList',
  action: 'PopulateList',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code' },
    { key: 'desc', header: 'Description', field: 'Description' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'account', header: 'Account', field: 'Account' },
    { key: 'branch', header: 'Branch', field: 'Branch' },
  ],
  rowActions: (r, ctx) => [...approve(r, ctx), report('JV/GratuityFundApprovalList', 'GratuityFundReportById', { GratuityFundId: str(r, 'Id') })],
};

/** LeaveEncashmentApprovalList.js: code GetCode(103); View & Approval */
export const LEAVE_ENCASHMENT_APPROVAL_LIST: ListDef = {
  id: 'leave-encashment-approvals',
  route: '/accounts/approvals/leave-encashment',
  legacyPage: '/JV/LeaveEncashmentApprovalList.aspx',
  title: 'Leave encashment approvals',
  listTitle: 'Leave Encashment Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/LeaveEncashmentApprovalList',
  action: 'PopulateLeaveEncashmentList',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 103 },
    { key: 'desc', header: 'Description(s)', field: 'Description' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'status', header: 'Status', field: 'LeaveEncashmentStatus', kind: 'status' },
  ],
  rowActions: (r, ctx) => approve(r, ctx),
};

/** PFProfitDistributionApprovalList.js: code GetCode(78) as on the classic list; View & Approval */
export const PF_PROFIT_DISTRIBUTION_APPROVAL_LIST: ListDef = {
  id: 'pf-profit-distribution-approvals',
  route: '/accounts/approvals/pf-profit-distribution',
  legacyPage: '/JV/PFProfitDistributionApprovalList.aspx',
  title: 'PF profit distribution approvals',
  listTitle: 'PF Profit Distribution Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/PFProfitDistributionApprovalList',
  action: 'PopulatePFProfitDistributionList',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 78 },
    { key: 'desc', header: 'Description(s)', field: 'Description' },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'type', header: 'Type(s)', field: 'Type' },
    { key: 'status', header: 'Status', field: 'ProfitDistributionStatus', kind: 'status' },
  ],
  rowActions: (r, ctx) => approve(r, ctx),
};

/** InterBranchTransferApprovalList.js. Single transfers (type 2): role 12 gets Edit/Delete (AddJVURL) + Report,
    others Report + View & Approval; multi transfers: role 12 Report, others Report + View & Approval. */
export const INTER_BRANCH_TRANSFER_APPROVAL_LIST: ListDef = {
  id: 'inter-branch-transfer-approvals',
  route: '/accounts/approvals/inter-branch-transfer',
  legacyPage: '/JV/InterBranchTransferApprovalList.aspx',
  title: 'Inter branch transfer approvals',
  listTitle: 'List for Inter Branch Transfer Approval',
  printTitle: 'Inter Branch Transfer Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/InterBranchTransferApprovalList',
  action: 'PopulateIBTList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'ffrom', header: 'Fund Transfer From', field: 'FundManagementTypeFrm' },
    { key: 'fto', header: 'Fund Transfer To', field: 'FundManagementTypeTo' },
    { key: 'bfrom', header: 'Branch Transfer From', field: 'BranchFrm' },
    { key: 'bto', header: 'Branch Transfer To', field: 'BranchTo' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeTypeOf: ibtType },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'ttype', header: 'Transfer Type', field: 'TransferType' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => {
    const single = num(r, 'TransferTypeId') === 2;
    const rep = single
      ? report('JV/InterBranchTransferList', 'InterBranchReport', { InterBranchId: str(r, 'Id') })
      : report('JV/MultiInterBranchTransfer', 'InterBranchReport', { InterBranchId: str(r, 'Id') });
    if (isRole(ctx, 12)) return single ? [...classic('Edit / Delete', withGuid(ctx, 'AddJVURL', str(r, 'ShortGUID'))), rep] : [rep];
    return [...approve(r, ctx), rep];
  },
};

/** InterBranchTransferAccountApprovalList.js. Type 2: role 12 Edit/Delete (AddJVURL) + HTML view, others
    View & Approval + HTML view; other types: role 12 HTML view, others View & Approval + HTML view. */
export const INTER_BRANCH_ACCOUNT_APPROVAL_LIST: ListDef = {
  id: 'inter-branch-account-approvals',
  route: '/accounts/approvals/inter-branch-account',
  legacyPage: '/JV/InterBranchTransferAccountApprovalList.aspx',
  title: 'Inter branch account approvals',
  listTitle: 'Inter Branch Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/InterBranchTransferAccountApprovalList',
  action: 'PopulateIBTList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'bfrom', header: 'Branch Transfer From', field: 'BranchFrm' },
    { key: 'bto', header: 'Branch Transfer To', field: 'BranchTo' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeTypeOf: ibtType },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'ttype', header: 'Transfer Type', field: 'TransferType' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => {
    const guid = str(r, 'ShortGUID');
    const single = num(r, 'TransferTypeId') === 2;
    if (isRole(ctx, 12)) return single ? [...classic('Edit / Delete', withGuid(ctx, 'AddJVURL', guid)), ...html(ctx, guid, 'IBT')] : html(ctx, guid, 'IBT');
    return [...approve(r, ctx), ...html(ctx, guid, 'IBT')];
  },
};

/** InterFundTransferApprovalList.js: role 12 Edit/Delete (AddJVURL) + Report, others Report + View & Approval.
    The classic role-12 Report button calls JVReport(), which that page never defines (the button does nothing);
    here it opens the same inter-fund transfer report every other role gets. */
export const INTER_FUND_TRANSFER_APPROVAL_LIST: ListDef = {
  id: 'inter-fund-transfer-approvals',
  route: '/accounts/approvals/inter-fund-transfer',
  legacyPage: '/JV/InterFundTransferApprovalList.aspx',
  title: 'Inter fund transfer approvals',
  listTitle: 'List for Inter Fund Transfer Approval',
  printTitle: 'Inter Fund Transfer Approval List',
  loadOnOpen: true,
  filters: [],
  emptyText: 'Nothing is waiting for approval.',
  handler: 'JV/InterFundTransferApprovalList',
  action: 'PopulateIFTList',
  totalField: 'TotalAmount',
  columns: [
    { key: 'n', header: '#', kind: 'index' },
    { key: 'from', header: 'Fund Transfer From', field: 'FundManagementTypeFrm' },
    { key: 'to', header: 'Fund Transfer To', field: 'FundManagementTypeTo' },
    { key: 'code', header: 'Code', field: 'Code', kind: 'code', codeType: 78 },
    { key: 'date', header: 'Date', field: 'TransDate', kind: 'date' },
    { key: 'amount', header: 'Amount', field: 'TotalAmount', kind: 'money', currency: true },
  ],
  rowActions: (r, ctx) => {
    const rep = report('JV/InterFundTransfer', 'InterTransferReport', { InterTransferId: str(r, 'Id') });
    if (isRole(ctx, 12)) return [...classic('Edit / Delete', withGuid(ctx, 'AddJVURL', str(r, 'ShortGUID'))), rep];
    return [...approve(r, ctx), rep];
  },
};

export const JV_APPROVAL_LISTS: ListDef[] = [
  JV_APPROVAL_LIST, MULTI_FUND_JV_APPROVAL_LIST, GRATUITY_FUND_APPROVAL_LIST, LEAVE_ENCASHMENT_APPROVAL_LIST,
  PF_PROFIT_DISTRIBUTION_APPROVAL_LIST, INTER_BRANCH_TRANSFER_APPROVAL_LIST, INTER_BRANCH_ACCOUNT_APPROVAL_LIST,
  INTER_FUND_TRANSFER_APPROVAL_LIST,
];
