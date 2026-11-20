/* FBR digital invoice statuses, exactly as the legacy list page offers them
   (FBRIntegration/DigitalInvoiceList.aspx, DropDownListStatus). The code is the DocumentStatus sent as StatusId. */
export type FbrStatus = 'open' | 'validated' | 'notValidated' | 'posted' | 'inProgress' | 'suspicious' | 'void';

export const STATUSES: FbrStatus[] = ['open', 'validated', 'notValidated', 'posted', 'inProgress', 'suspicious', 'void'];

export const STATUS_CODE: Record<FbrStatus, number> = {
  open: 4,           // "Open"
  validated: 73,     // "Validate Invoice"
  notValidated: 74,  // "Non Validate Invoice"
  posted: 75,        // "Validated & FBR Integrated"
  void: 40,          // "Void/Delete"
  suspicious: 78,    // "Suspicious"
  inProgress: 79,    // "In Progress"
};

export const STATUS_LABEL: Record<FbrStatus, string> = {
  open: 'Open',
  validated: 'Validated',
  notValidated: 'Not validated',
  posted: 'Posted to FBR',
  inProgress: 'In progress',
  suspicious: 'Suspicious',
  void: 'Void',
};

export interface FbrInvoice {
  id: string;
  status: FbrStatus;
  number: string;            // Number
  type: string;              // Type (sale invoice, debit note…)
  buyer: string;             // Name
  buyerRegNo: string;        // RegistrationNo (NTN / CNIC)
  registrationType: string;  // RegistrationType
  originProvince: string;    // SaleOriginationProvinceofSupplier
  province: string;          // DestinationofSupply
  value: number;             // TotalValueofSales
  salesTax: number;          // TotalSalesTax
  furtherTax: number;        // TotalFurtherTax
  fbrNumber?: string;        // InvoiceReferenceNo
  error?: string;            // from PopulateErrorInvoiceList, joined on Number
  guid?: string;             // InvoiceParentGUID (legacy view / re-open links)
}
