# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Several roles carry equal weight. No single persona outranks the others, so shared surfaces must work for every role that uses them:

- **Company users and accountants** enter sales and purchase invoices, post them to FBR or provincial authorities, fix rejected invoices, and run accounting and inventory work.
- **Business owners and CEOs** read the dashboards (`CEODashBoard*.aspx`, `GeneralDashBoardNew.aspx`) for totals, status and compliance.
- **FBR agents** are tax practitioners who manage invoicing and compliance for several client companies (`FBRAgentDashBoard.aspx`, `PortalSettingsForAgent.aspx`, `AgentCompanyProfile.aspx`).
- **Referral partners** bring in and track customers (`ReferralPartnerDashBoard.aspx`).
- **New customers and agents** sign up themselves (`CustomerSignUp.aspx`, Sign Up / Sign Up Agent on `Login.aspx`).

## Product Purpose

E-ACT 360 (also called "EAccounting" in older copy) is a web-based business suite. It does accounting and ERP work, and it handles digital invoicing for Pakistan's Federal Board of Revenue (FBR) and provincial revenue authorities. A business should be able to run its books and operations in one place and stay compliant with mandatory digital invoicing without a separate tool.

## Positioning

E-ACT 360 is an all-in-one ERP. Accounting, inventory, POS, purchasing, sales, payroll/HR, manufacturing, construction, fixed assets, budgeting and NGO accounting sit in one system next to FBR and provincial digital-invoice integration. Compliance comes out of the same records the business already keeps; it is not a bolt-on.

## Operating Context

- Daily work is data entry and lists: add/edit forms, posting, reopening entries, list filters, DataTables, bulk import of client invoices and purchases, and error lists for rejected invoices.
- FBR workflows include registration (including a sandbox), posting, reference-number updates, Annexure-C comparison, and error resolution.
- Reports are opened through `Reports/` and `ReportsViewer/`, and are printed or exported.
- Role-specific dashboards act as the landing pages after login.
- The system also has an AEO module (`AeoSetup/`) for registrations, mock exams, fees, refunds, commissions and reconciliation. Its exact audience has not been confirmed.

## Capabilities and Constraints

- **Stack (binding):** ASP.NET WebForms on .NET Framework 4.7.2, Bootstrap 3, AdminLTE, jQuery, DataTables, Select2/Chosen, NProgress and Font Awesome 4 / Glyphicons. Do not migrate to another framework. Design work must fit this stack.
- `App_Code/GUI/BasePage.cs` injects stylesheets and scripts globally. There are no master pages, and many pages carry inline `<style>` blocks.
- The codebase holds hundreds of `.aspx` pages across modules, so changes to shared CSS reach everything.
- Undecided: the primary device mix, Urdu/RTL needs, and connection or hardware constraints. Do not assume any of these.

## Brand Commitments

- The product name is **E-ACT 360**. The login page reads "LOGIN TO E-ACT 360". Logos are in `assets/PortalAssets/` (`logo.png`, `logo1.png`, `footer-logo.png`).
- No binding voice or visual identity has been confirmed beyond the existing name and logos.

## Evidence on Hand

- Real product surfaces: the dashboards, FBR integration pages and module pages in this repo.
- A help video for sign-up is linked from the login page.
- There are no confirmed testimonials, customer counts, pricing or certifications. Do not invent any.

## Product Principles

1. **Compliance is part of everyday work.** FBR and provincial invoicing status, errors and next actions should be visible where users already work, not hidden in a separate module.
2. **Serve every role on shared surfaces.** Accountants, owners, agents and partners all rely on the same system, so lists, forms and dashboards must read clearly to each.
3. **Consistency across hundreds of pages.** One ERP means one way of doing filters, tables, forms and posting. A pattern used once is a cost multiplied by every module.
4. **Work within the incumbent stack.** Improvements land as WebForms + Bootstrap 3 changes that can roll out page by page without breaking the rest.
