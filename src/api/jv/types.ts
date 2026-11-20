export interface Option { value: string; label: string; hint?: string }

/** What the classic JV page renders server-side: feature flags, its dropdown lists, links and the session date format. */
export interface JvPageContext {
  allowed: boolean;                 // false: the role has no JV right (the page redirected to Unauthorized)
  projectApplicable: boolean;
  fundClassApplicable: boolean;
  donorApplicable: boolean;
  constructionCompany: boolean;     // shows Sub project / activity
  projects: Option[];               // DropDownListProject, without the "-" placeholder
  fundClasses: Option[];            // DropDownListFundManagementType, without "Select an Option"
  dateFormat: string;               // session DateFormats, e.g. "dd/MM/yyyy"
  currencySymbol: string;
  roleId: number | null;
  periodStart?: string;             // ISO yyyy-mm-dd
  periodEnd?: string;
  reportViewerUrl: string;          // HTMLReportViewerURL
  jvListUrl: string;                // JVAdjustmentListURL
  managerInboxUrl: string;          // ManagerDashboardURL
}

export interface JvLine {
  id: string;
  accountId: string;
  accountName: string;              // "Description (Category )", what the classic page posts as ShortDesc
  accountCode?: string;
  description: string;
  projectId: string;                // "" = none
  projectName: string;
  activityId: string;               // sub project / activity
  activityName: string;
  fundClassId: string;
  fundClassName: string;
  donorId: string;
  donorName: string;
  debit: number;
  credit: number;
}

export type SaveOutcome =
  | { ok: true; code: string; shortGuid: string; voucherId: number | null }
  | { ok: false; message: string };
