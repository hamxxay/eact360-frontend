# E-ACT 360 Frontend Conversion: Category Standard · Executive Slate

Living record of the React frontend build. Update the **Change log** at the bottom with every change.
Backend rule: nothing in `E:\DigitalInvoice500` is edited (see `CLAUDE.md`).

Status: **Phases A–E done.** FBR invoice list, dashboard FBR counts, company/user/period and the per-role menu come from the legacy session. Tested end to end against a stand-in legacy server; **not yet run against the real site with a real login** (it was not running). Last updated 2026-11-19.

---

## 1. Design decision

| Item | Value |
|---|---|
| Design direction | **Category standard** (`design-options/standard/`): clean SaaS admin, white cards, one accent |
| Colour scheme | **Executive Slate** (palette 4 in `design-options/palette-switcher.js`) |
| Palette switcher | **Not included.** Executive Slate only; changing the scheme means editing `src/styles/tokens.css` |
| Typeface | Inter 400/500/600/700, bundled through `@fontsource/inter` (works without internet), tabular numerals |
| Resolves | Open decision "Choose the visual design by 11 Dec 2026" in the `.docx` change documentation |

> **Since 2026-11-19 all styling is in one file: `src/styles/eact.css`** (see §7d). File paths for CSS in the
> sections below (`tokens.css`, `classicSkin.css`, `*.module.css`) describe where the rules were when that work was
> done; those rules now live in the matching section of `eact.css`.

### Colour tokens (section 2 of `src/styles/eact.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F8FAFC` | Page background, table header |
| `--bg-wash` | `#F5F7FB` | React shell content canvas |
| `--bg-soft` | `#F1F5F9` | Quiet controls and secondary surfaces |
| `--canvas-start` / `--canvas-end` | `#F8FAFC` / `#EEF3F9` | Subtle shell and login page gradient |
| `--bright` / `--bright-bg` / `--bright-line` | `#0EA5E9` / `#E0F2FE` / `#BAE6FD` | Unique cool accent for the bright canvas wash and subtle reporting highlights |
| `--card` | `#FFFFFF` | Cards, sidebar, top bar |
| `--ink` | `#0F172A` | Primary text |
| `--ink-2` | `#556274` | Secondary text, labels |
| `--ink-3` | `#64748B` | Icons, menu group labels |
| `--line` | `#E2E8F0` | Borders |
| `--line-soft` | `#F1F5F9` | Row dividers, chart gridlines, tracks |
| `--accent` | `#1E293B` | **Executive Slate**: primary buttons, active nav, logo, chart bars |
| `--accent-bg` | `#F1F5F9` | Active nav fill, selected rows, selection bar |
| `--accent-soft` / `--accent-mid` | slate mixed 27% / 45% with white | Sunday bars / today-so-far bar |
| `--ok` / `--ok-bg` | `#15803D` / `#F0FDF4` | Posted, positive change |
| `--wait` / `--wait-bg` | `#B45309` / `#FFFBEB` | Waiting, due dates |
| `--bad` / `--bad-bg` | `#B91C1C` / `#FEF2F2` | Rejected, negative change, alerts |

The mocks named the accent `--blue`; it is `--accent` here so the name stays true for slate.

**Slate-specific adjustments** (the accent is close to `--ink`, so colour alone cannot signal state):
- Active menu item: slate text, tinted fill **and** a 3px indicator bar on the left edge.
- Active tab: slate text, bottom bar, and a filled slate count badge.
- Links: weight 600, underline on hover.
- Focus ring: 2px slate outline on every interactive element.

## 2. Stack

- React 18.3 + TypeScript 5.6 + Vite 5.4, served under `/app/`
- `react-router-dom` 6 (routes; filters live in the URL so a filtered list can be bookmarked or shared)
- `@tanstack/react-query` 5 (handler calls, caching, retry)
- Plain CSS: global tokens + CSS Modules per component. No Tailwind, no Bootstrap.

### Running

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once) |
| `npm run dev` | Dev server at `http://localhost:5173/app/`. Proxies every path outside `/app` to the legacy site (handlers, pages, rewritten URLs, assets). Sign in at `http://localhost:5173/Login.aspx` so the session cookie is shared |
| `npm run build` | Type-check and build static files into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

Settings (copy `.env.example` to `.env`):

| Variable | Default | Meaning |
|---|---|---|
| `LEGACY_URL` | `http://localhost:9575` | Legacy site (IIS Express port from `ASOL.sln`) |
| `VITE_USE_MOCKS` | `true` | `true` = sample data; `false` = call the legacy handlers |

## 3. Files created

All under `E:\DigitalInvoice500-frontend\`.

| File | Purpose |
|---|---|
| `package.json`, `package-lock.json` | Dependencies and scripts (exact versions) |
| `vite.config.ts` | `/app/` base path; dev proxy to the legacy site |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Strict TypeScript |
| `index.html` | Page shell |
| `.gitignore`, `.env.example` | Ignore rules; settings template |
| `src/main.tsx` | Entry: fonts, styles, router (`basename /app`), query client, toasts |
| `src/App.tsx` | Routes: `/` Dashboard, `/fbr/invoices`, `*` not found |
| `src/styles/tokens.css` | **All colours**, type sizes, radii, spacing (Executive Slate) |
| `src/styles/base.css` | Reset, Inter, tabular numerals, links, focus ring, reduced motion |
| `src/app/nav.ts` | Menu: static in sample mode, the user's legacy menu in live mode; `MIGRATED` switch-over map; `useHasRoute()` |
| `src/api/http.ts` | `postHandler()`: form-encoded POST to `/AjaxHandlers/<Module>/<Name>.ashx?action=…`, same-origin cookie; detects expired session |
| `src/api/fbr/types.ts`, `src/api/fbr/invoices.ts` | Legacy statuses and codes; `useFbrInvoices(month)` over `PopulateInvoiceList` + `PopulateErrorInvoiceList` |
| `src/api/dashboard/types.ts`, `src/api/dashboard/dashboard.ts` | `useFinanceSummary()`: sample data only; `null` in live mode (no source) |
| `src/lib/dates.ts` | Working date (sample date or today), month helpers, 12-month picker options |
| `src/legacy/session.ts` | Redirect to `Login.aspx` on expiry; form-draft save/restore helpers |
| `src/legacy/contextBridge.ts` | Reads company, user, financial period, session values and the per-role menu from `/Error.aspx` (sample values in sample mode) |
| `src/app/RequireMenuRight.tsx` | Shows a migrated screen only if the user's legacy menu offers it |
| `src/lib/format.ts` | PKR amounts, millions, percent change, dates |
| `src/lib/csv.ts` | Client-side CSV export |
| `src/mocks/*` | Sample data from the mocks (made-up figures) |
| `src/components/AppShell` | Sidebar + top bar + page; sidebar becomes a drawer below 960px; skip link |
| `src/components/Sidebar` | Brand, grouped menu, company card |
| `src/components/TopBar` | Breadcrumb, search (opens the invoice list filtered), user initials |
| `src/components/PageHeader` | Title, subtitle, actions |
| `src/components/Button` | default / primary / ghost; renders as button, route link or classic-page link |
| `src/components/Card`, `KpiCard`, `Badge` | Cards, figure cards, status chips |
| `src/components/Tabs` | Status tabs with counts, arrow-key navigation |
| `src/components/FilterBar` | Filter row; native `<select>` styled as the mock's chips |
| `src/components/DataTable` | Table with right-aligned numbers, select-all/indeterminate, empty state |
| `src/components/Alert` | Error band (panel-wide or inside a card) with an action |
| `src/components/BarChart`, `ProgressTrack` | Daily sales bars with legend; ageing bars |
| `src/components/Toast` | Notifications (ok / wait / bad / info), pause on hover, max 3 |
| `src/components/QueryState` | Loading skeleton and load-error with retry |
| `src/components/Icon` | Stroke icons from the mocks |
| `src/pages/Dashboard` | Converted from `design-options/standard/dashboard.html` |
| `src/pages/FbrInvoices` | Converted from `design-options/standard/invoices.html` |
| `src/pages/NotFound` | Unknown route, with a link to the classic site |
| `src/pages/Login` | New sign-in screen (sign in, forgot password, sign-up links) |
| `src/api/auth.ts` | Sign-in / forgot password through the legacy Login.aspx postback |
| `src/components/Loaders` | Spinner, Skeleton set, TopProgress |

## 4. Files changed

| File | Change |
|---|---|
| `CLAUDE.md` | Records the chosen design, how to run, and that this doc keeps the change log |

**Not touched:** `E:\DigitalInvoice500\**` (checked: no backend file modified), `design-options/**`, `PRODUCT.md`, the `.docx`.

## 5. Screens

### Dashboard (`/app/`)
- **FBR digital invoices card (live):** Posted to FBR / Validated / Open / Not validated counts for the current month, each opening the invoice list on that tab; an alert with **Review** when invoices failed validation. Counts come from the same calls as the invoice list, so both always agree.
- **Finance figures (sample only):** Sales, Sales tax payable, Cash and bank, Receivables, Sales by day, Receivables ageing, Top buyers, Needs attention. In live mode these are replaced by a card saying they are not connected yet; sample numbers are never mixed with live ones.

### FBR digital invoices (`/app/fbr/invoices`)
- Tabs: All plus the seven legacy statuses (Open, Validated, Not validated, Posted to FBR, In progress, Suspicious, Void) with counts.
- Band "N invoices failed FBR validation" with **Review**; each Not-validated row shows the FBR error text.
- Columns: Invoice (+ FBR invoice no. or type), Buyer (+ registration no. · type), Destination, Value, Sales tax, Further tax, Status.
- Filters: Month (last 12 months), Buyer, Destination, plus the top-bar search (invoice no., buyer, registration no., FBR no.). All filters live in the URL.
- Row selection → **Export to CSV** (all fields, opens in Excel).
- Footer totals of value, sales tax and further tax for the visible rows.
- **Import**, **New invoice** and **Post N to FBR** (N = Validated) open the classic screens (`ClientInvoiceImport.aspx`, `DigitalInvoiceAdd.aspx`, `DigitalInvoicePosting.aspx`) until those are migrated.

### Deliberate differences from the mock
| Mock | Built | Why |
|---|---|---|
| "Monday 17 November 2026" | "Tuesday 17 November 2026" | 17 Nov 2026 is a Tuesday |
| "Month to date" looked like a dropdown | Plain label | Only one period exists until the handler is connected; no fake controls |
| Inventory, Payroll, Reports menu items | Sales, Purchases, Accounts, Provincial invoices, Employees | Only items with a confirmed classic page are linked; the real per-role menu arrives in phase E |
| Invoice numbers in accent colour | Slate, weight 600 | Same intent; slate is the accent |
| Fixed 1440×900 canvas | Responsive down to phone width; tables scroll sideways inside their panel | Real use |
| Dashboard FBR counts 128/14/3 | Counted from the invoice list | Dashboard and list must agree |
| Statuses Posted / Waiting / Rejected / Drafts | The 7 legacy statuses | The mock's statuses don't exist in the system; parity with the classic list |
| Date column | Removed; Destination and Further tax columns added | The legacy list result has no invoice date; further tax is in the data and on the classic list |

## 6. Phases

| # | Work | Status |
|---|---|---|
| A | Scaffold, tokens, base styles | **Done** 2026-11-19 |
| B | Shared components + AppShell | **Done** 2026-11-19 |
| C | Dashboard and FBR invoices on sample data | **Done** 2026-11-19 |
| D | Handler contracts read (read-only); FBR list and FBR counts wired | **Done** 2026-11-19 (code); live parity check pending: needs a running legacy site and a login |
| E | Context bridge (company, user, period, per-role menu), menu switch-over, rights guard, session expiry | **Done** 2026-11-19 (stand-in server); real-site check pending |

### Phase E: context bridge (read from the legacy code, no changes)

Source: `GET /Error.aspx`, the lightest page built on `BasePage` (it only renders header, footer and side menu). With no session, `BasePage.Page_Init` redirects to the login URL.

| What | Where it comes from | Used for |
|---|---|---|
| Session values | Inline `<head>` scripts written by `BasePage`: `var PeriodStartDate`, `PeriodEndsDate`, `CurrencySymbol`, `CompanyDecimalPlaces`, `DateFormats`, `UserRoleId`, … | Financial period ("FY 2026-27") in the sidebar; kept for later screens |
| Company name | Header (`CommonMarkup.GetHeader`): `glyphicon-home` + `span.hidden-xs` | Sidebar company card |
| User name | Header: `glyphicon-user` + `span.hidden-xs` (fallback: `.user-panel .info p`) | Avatar initials |
| Menu | `aside.main-sidebar ul.sidebar-menu` (`CommonMarkup.GetSideMenu`), built from the user's role rights; groups → links, with one optional sub-level | Sidebar; rights parity |
| Role dashboards | Top-level menu links (`GetGeneralDashBoardHTML`, `GetCEODashBoardHTML`, `GetFBRDashBoardHTML`, …) | Shown as "… dashboard (classic)" |

Behaviour:
- **Switch-over:** a legacy menu link whose page name is in `MIGRATED` (`src/app/nav.ts`) opens the React route and is tagged **New**. Today: `DigitalInvoiceList` → `/fbr/invoices`. **Rollback = delete the entry**; the link opens the classic page again. Works with and without URL rewriting (matches the last path segment, `.aspx` optional).
- **Rights:** React screens are shown only if the user's legacy menu offers them (`RequireMenuRight`, `useHasRoute`). Without the FBR list right, the FBR card, the invoice search and the route are hidden and no FBR handler is called. This mirrors the legacy menu; it is not security (handlers still don't check rights).
- **Session ended:** any redirect, 401, or HTML-instead-of-JSON answer sends the user to `/Login.aspx`. Redirects are not followed (`redirect: 'manual'`), so a login URL on another host can't cause a CORS error.
- **No keep-alive:** the bridge loads once per page load and is never polled, so an idle tab still times out after 120 minutes as today.
- **Find a screen:** the sidebar has a filter over all legacy menu links, because a full menu can hold hundreds of entries.
- **Sign out** opens the classic `Logout.aspx`.
- Branch is not shown: the legacy header does not render it.

### End-to-end test (2026-11-19)
Stand-in legacy server (scratchpad only, not part of the project) that serves `Error.aspx` markup and `DigitalInvoiceList.ashx` JSON in the shapes the backend code produces, with `VITE_USE_MOCKS=false` through the dev proxy:

| Case | Result |
|---|---|
| Signed in | Requests sent: `Month=November-2026&BranchId=0&StatusId=4/73/74/75/79/78/40` + `PopulateErrorInvoiceList`. Company, user, period and menu shown; "Digital Invoice List" opens the React list (tag **New**); two FBR errors joined on one invoice; dashboard counts match the list |
| Session ended (302 to Login) | App goes to the legacy login page; no invoice handler called |
| Role without the FBR list | "No access" on `/app/fbr/invoices`; no FBR card or search; only `Error.aspx` requested |
| Legacy page scripts | Not executed (DOMParser) |

### Phase D: handler contracts (read from the legacy code, no changes)

**FBR invoice list**: `AjaxHandlers/FBRIntegration/DigitalInvoiceList.ashx`, used by `assets/js/FBRIntegration/DigitalInvoiceList.js`, logic in `App_Code/Helper/FBRIntegration/DigitalInvoiceListHelper.cs`.

| Item | Contract |
|---|---|
| Call | `POST ?action=PopulateInvoiceList`, form fields `Month`, `BranchId`, `StatusId` |
| `Month` | `"November-2026"`: the helper splits on `-` and parses the month with `"MMMM"` |
| `BranchId` | `"0"` = all branches the user may see; the helper applies role 2/12 and allowed-branch rules server-side |
| `StatusId` | One DocumentStatus per call, passed to `DigitalInvoice_GetDataForList`. No "all" value is known, so the React app calls once per status (7 calls in parallel) |
| Statuses | 4 Open · 73 Validate Invoice · 74 Non Validate Invoice · 75 Validated & FBR Integrated · 40 Void/Delete · 78 Suspicious · 79 In Progress |
| Response | `{ data: [...] }`, HTTP 500 with `data: null` on error |
| Row fields | `RegistrationNo, Name, RegistrationType, SaleOriginationProvinceofSupplier, DestinationofSupply, Type, Number, DocumentStatus, InvoiceParentGUID, TotalValueofSales, TotalSalesTax, TotalFurtherTax, TotalFixedNotifiedValue, LogInvoiceParentGUID, InvoiceReferenceNo, IdGuid`. **No invoice date.** |
| Errors | `?action=PopulateErrorInvoiceList`, same fields, ignores `StatusId`; rows add `Error`. Joined to Not-validated rows by `Number`. If it fails, the list still shows without error texts |

Mapping: `src/api/fbr/invoices.ts`. Expired session (401, redirect to Login/Unauthorized, or an HTML answer) sends the user to `Login.aspx`.

**Dashboard FBR counts**: counted from the same list calls (the agreed `FBRDashBoard.ashx` turned out not to hold invoice counts; see below).

### Dashboard data sources: findings

| Handler | What it actually returns | Usable for |
|---|---|---|
| `Dashboard/CEODashBoard.ashx` `PopulateDashboardInfo` | Total companies, projects, users, branches, employees; present/absent/leave | Nothing on the current dashboard design |
| `FBRIntegration/FBRDashBoard.ashx` | Attendance, AEO daily collections, RP business summary, employee records | Nothing on the current dashboard design |
| `FBRIntegration/FBRAgentDashBoard.ashx` `PopulateClientDetail` | Invoice count per status per client company (`ParentStatus`, `CountData`) | FBR counts for agents (multi-company); not needed for a single company |
| `MasterDashBoard/MasterDashBoardNew.ashx` | Orders awaiting action, leaves, bugs | Possibly "Needs attention" |
| `Reports/CustVendViewer.ashx` `AgedReceivable`, `Reports/SOViewer.ashx` `DailySalesReport`, etc. | Build Crystal report files on the server; no data returned | Nothing |

No existing handler returns sales totals, sales tax payable, cash and bank, receivables, receivables ageing or top buyers as data.

## 7. Decisions

| Date | Question | Answer |
|---|---|---|
| 2026-11-19 | Design and colour scheme | Category standard · Executive Slate |
| 2026-11-19 | Legacy dev site | `http://localhost:9575` |
| 2026-11-19 | Dashboard data source | Both: `CEODashBoard.ashx` for business figures, `FBRDashBoard.ashx` for FBR counts. **Superseded by findings:** neither returns these figures; FBR counts now come from the invoice list; finance is an open decision (section 8) |
| 2026-11-19 | In-app colour switcher | No; Executive Slate only (superseded 2026-11-20: five colour schemes, user request) |
| 2026-11-19 | Invoice statuses in the new list | The 7 legacy statuses, same codes, plainer labels (parity with the classic list) |
| 2026-11-19 | Dashboard finance figures | **Option 1**: left out of the live dashboard; live mode shows the FBR card and a "not connected" note; finance stays in the classic reports. No backend change |

## 7a. Sign-in screen and loaders (2026-11-19)

### New sign-in screen: `/app/login`
Signs in **through the legacy `Login.aspx`**: no backend change, same rules (password hashing, single-login check, login log, role landing all stay on the server).

| Legacy behaviour (Login.aspx / .cs) | New screen |
|---|---|
| WebForms postback: `inputUser`, `inputPassword`, `ButtonSignIn` + `__VIEWSTATE` / `__EVENTVALIDATION` | Reads the hidden fields from a GET of `Login.aspx`, posts exactly what the browser posts (`src/api/auth.ts`) |
| Success → `Response.Redirect` to the role dashboard | Redirect not followed; session confirmed via `/Error.aspx`; user goes to `returnTo` or the new Dashboard |
| Failure → `alert-danger` ("Invalid Username or Password", "This Username already logged in") | Same message, new design; "already logged in" adds a hint |
| "Forget Password ?" → `ButtonForgetPassword` postback (server sends details by SMS + email) | "Forgot password?" view doing the same postback |
| Sign Up / Sign Up Agent (server-click → `PortalSettings.aspx` / `PortalSettingsForAgent.aspx`) | Direct links; help video link kept |
| `?FBRAgent=1&GUID=…` auto sign-in | Handed to the classic `Login.aspx` unchanged |
| `?FBR=1` registration message | Shown on the new screen |
| Already signed in → Unauthorized | Goes straight into the app |
| `sessionState cookieless="AutoDetect"` | GET follows the cookie-probe redirect; POST does not follow redirects |

Also: show/hide password, Caps Lock warning, inline field errors, `autocomplete` for password managers, open-redirect guard on `returnTo`, **Use the classic sign-in page** link always available.
**Sign out** calls `Logout.aspx` in the background (session cleared, logout log written) and lands on `/app/login?signedOut=1`.
**Sample mode:** any username with any password signs in.

Where users meet it: every session expiry inside the new app goes to `/app/login?returnTo=…`. Classic pages still send users to the classic `Login.aspx` (that redirect is in `BasePage`). Making them land here too needs an IIS rewrite of top-level visits to `/Login.aspx` → `/app/login` that skips requests carrying `X-Requested-With` (the new screen's own calls send it). That is a server setting, so it is proposed, not done.

### Loaders
| Loader | Where | Notes |
|---|---|---|
| Startup splash | `index.html` (inside `#root`) | Visible before any JS/CSS loads; "Still loading…" hint after 4 s. Colours written inline (tokens not loaded yet), matching `tokens.css` |
| Top progress bar | `components/Loaders/TopProgress` in the shell | Any data load or save; appears after 200 ms so quick answers don't flash |
| Skeletons | `components/Loaders/Skeleton` | Shaped like the content: KPI row, chart, status list, invoice table, page block, sidebar menu, company card. One screen-reader announcement per block |
| Button spinner | `Button loading loadingText` | Sign in ("Signing in…"), Forgot ("Sending…"), Sign out ("Signing out…") |
| Opening state | Sign-in screen after success | "Signed in. Opening E-ACT 360…" |

All loaders respect reduced motion (static skeletons, no sweeping bar).

### Tests (stand-in legacy server on a separate port; the real site was not touched)
Browser tests with the installed Edge: 20/20 sign-in checks pass (redirect when signed out, empty fields, wrong password, already logged in, forgot password unknown/known user, show password, success with real company and user, `/app/login` while signed in, sign out, deep link return, open-redirect blocked, mobile without horizontal scroll, no page errors). Loader checks: splash, button spinner, top bar, skeletons, reduced motion.

## 7b. All 971 classic pages in the new design (Track 1, 2026-11-19)

Decision (2026-11-19): **both tracks**. Track 1 puts every classic page inside the new app now; Track 2 rebuilds pages as native React screens module by module (FBR first), each checked against the real system.

### Page inventory (`E:\DigitalInvoice500`, excluding Archive/Developer/packages/Bin)
| Kind | Pages |
|---|---|
| Forms and actions (add, edit, setup, import, posting, approval) | 322 |
| Lists | 274 |
| Other (details, popups, settings…) | 314 |
| Reports | 50 |
| Dashboards | 11 |
| **Total** | **971** |
| Of which use server-side postback controls | 50 |

### How Track 1 works
- **Route** `/app/classic/<legacy path>` shows the legacy page inside the new shell (sidebar, top bar, sign-in, loaders) in a same-origin frame. The page runs unchanged: its own scripts, postbacks, handlers and session.
- **Skin** (`src/classic/classicSkin.css`) is injected into the page on load, together with `tokens.css` and Inter, so classic pages use the same Executive Slate tokens as React screens. It hides the AdminLTE header, sidebar and footer and restyles Bootstrap 3 panels, forms, buttons, tables, DataTables, labels, alerts, tabs, modals, dropdowns, Select2 (v3 and v4), Chosen, datepicker, NProgress, blockUI and notify. Every rule is scoped under `html[data-eact-shell]` (`src/classic/skin.ts`) so it outranks the pages' own CSS and inline styles, and applies only inside the shell. Transitions are off while the skin applies, so colours don't fade from the old theme.
- **Menu:** every link in the user's legacy menu opens as `/app/classic/…`; links with a native screen open that screen (tag **New**).
- **Navigation:** links inside a classic page update the app URL; Back/Forward work (including pages restored from the browser's page cache); a classic link to a page that has a native screen opens the native screen; deep links to `/app/classic/…` work.
- **Session end** inside a classic page → new sign-in screen with `returnTo`.
- **Fallback:** every classic page has **Open in classic view** (the raw page, full window). Links to another host (e.g. sub-domain URLs) open in a new tab.
- No backend change. `Web.config` sends no `X-Frame-Options`, so framing on the same origin is allowed.

### Development proxy (dev only)
Legacy pages write absolute URLs from `SiteURL` (redirects, links, `var baseURL` used by all AJAX). In development that is the legacy port, a different origin from the dev server, so the proxy now strips the legacy origin from HTML/JS/JSON responses and `Location` headers, and sends the Host header IIS Express expects (`changeOrigin`). In production both apps share one public origin; **`SiteURL` must equal the public address** (as it does today).

### Known limits of Track 1
- Layouts stay as each classic page lays them out (Bootstrap grid); only the look changes.
- Pages that open popups or new windows (`window.open`, some reports and prints) open those outside the shell, in the classic look with the skin not applied.
- Ctrl+P prints the whole app window; use **Open in classic view** to print a classic page alone.
- Pages with unusual inline styling may need small additions to the skin; add them to `classicSkin.css` (one file for all pages).

### Tests (stand-in server serving the backend's real `assets` read-only; ports 9576/5174)
23/23 classic checks pass: menu opens classic page in shell; skin injected; old header/sidebar hidden; no left offset; Inter font; 12px card panels; table header, pagination, labels, alerts, primary button and inputs in Executive Slate tokens; legacy Select2 and DataTables still run; breadcrumb from the menu; in-page navigation updates URL; Back; classic link to migrated page opens the new screen; deep link; session end → sign-in; mobile without horizontal scroll; no page errors. Sign-in regression 20/20 still passes.

## 7c-2. Table design: "ledger" (2026-11-19, replaces the header/pill/hover rules of §7c)

Requested by the user. Applies to React tables (`DataTable`) and every classic DataTable / Bootstrap `.table`.

| Element | Rule |
|---|---|
| Container | Scrolls both ways (`max-height: --tbl-max-h` 70vh) so header and first column can pin; no outer border, no vertical lines |
| Rows | 1px `#F3F4F6` dividers; cells `14px 16px`; 13px Inter; primary text `#111827`, secondary `#6B7280` |
| Header | Pinned to the top (`sticky; top: 0; z-index: 20`), `#F9FAFB`; 11px, 500, uppercase, `.04em`, `#6B7280` |
| First column | Pinned left (`sticky; left: 0; z-index: 10`) on white with `4px 0 12px -2px rgba(0,0,0,.06)`; with row selection the checkbox and first data column both pin |
| Alignment | Text and status left; numbers, money and dates right, headers included, `tabular-nums`. Classic tables: `skin.ts` detects those columns (≥80% of sampled cells are amounts/percentages/dates) and re-checks on redraw |
| Status | Pastel pills, radius 9999px, 12px: ok `#ECFDF5/#065F46`, pending `#FEF3C7/#92400E`, negative `#FEE2E2/#991B1B`, neutral `#F3F4F6/#374151` (tokens `--pill-*`) |
| Hover | `#F9FAFB` |
| Row actions | Hidden until row hover or keyboard focus (always visible on touch screens). React: `···` menu (`rowActions` prop) in a fixed layer, Esc/arrow keys/outside click. Classic: the row's own buttons |

FBR list `···` actions (same as the classic list's per-row buttons): Copy invoice number; Copy FBR invoice number (posted); Re-open invoice (Not validated / Suspicious) → classic `DigitalInvoiceReOpenEntry.aspx?ShortGUID=…`; Update FBR invoice number (Suspicious) → classic `DigitalInvoiceUpdateRefNo.aspx?ShortGUID=…`. View (needs a template choice) and Delete (destructive) are not offered here.

Tokens (section 2 of `eact.css`): `--row-line`, `--row-hover`, `--row-selected`, `--tbl-head-bg`, `--tbl-head-ink`, `--tbl-ink`, `--tbl-ink-2`, `--tbl-pin-shadow`, `--tbl-max-h`, `--pill-*`.
Tests: ledger 22/22 (each spec rule, header pinned after scrolling down, first column pinned after scrolling right, menu open/Escape), classic 23/23, forms 14/14, tables 13/13.

## 7c. Table convention (2026-11-19)

Every table, React and classic (all DataTables and Bootstrap `.table` in the 971 pages), follows one convention:

| Element | Rule |
|---|---|
| Lines | No outer border, no vertical lines; hairline divider between rows (`--row-line` `#EEF1F5`), header underline `--line` |
| Header | Unfilled; 13px, weight 500, `--ink-2`, sentence case as written; sort arrows quiet (30%), active sort in accent |
| Rows | 14px text, vertically centred, 14px/16px cell padding (≈48px+ rows); no zebra stripes |
| Hover | `--row-hover` (accent 2.5% on white) |
| Selected | Full-row `--row-selected` (accent 8%); checkbox filled in accent; header checkbox shows indeterminate |
| Row actions | Quiet text buttons (no fill/border) that gain a border on hover; danger in red text |
| Toolbar | Filter chips (pill, 32px) on the left; search box with icon on the right (36px); "Show n entries" as a chip |
| Footer | Info and pagination separated by a hairline; current page filled in accent, others ghost |

Where: React `src/components/DataTable/DataTable.module.css`, `src/components/FilterBar/*` (new `SearchField`); classic `src/classic/classicSkin.css` (Tables section) plus `skin.ts` adds a placeholder and accessible name to DataTables search boxes, including tables built later by AJAX. Shared tokens in `tokens.css`: `--row-hover`, `--row-selected`, `--row-line`.

Checks (stand-in, 13/13): unfilled 500-weight header, no outer/vertical lines, rows ≥ 48px, selected tint, toolbar search filters the FBR list, quiet classic row buttons, search placeholder + name. Classic regression 23/23.

## 7d. All styling in one file (2026-11-19)

Decision (user, 2026-11-19): one single stylesheet. **`src/styles/eact.css`** (≈2,400 lines, 60 KB, 10.6 KB gzipped) holds everything:

| Section | Contents |
|---|---|
| 1. Fonts | Inter 400/500/600/700 `@font-face` (bundled from `@fontsource/inter`) |
| 2. Tokens | Colours, type, spacing, row tints (between `@eact:tokens` markers) |
| 3. Base | Reset, typography, links, focus ring, `.visually-hidden`, reduced motion |
| 4. Startup splash | `.boot*` (markup stays in `index.html`) |
| 5. Layout | App shell, sidebar, top bar, page header |
| 6. Components | Button, card, figure card, badge, tabs, table toolbar, data table, alert, chart, progress track, toast, load error, loaders |
| 7. Pages | Sign in, dashboard, FBR invoices, classic frame |
| 8. Page helpers | `.e-note`, `.e-row-actions` |
| 9. Classic skin | The 971 classic pages; every rule starts with `html[data-eact-shell]` (between `@eact:classic` markers) |

How it fits together:
- `main.tsx` imports `eact.css` once. Components use plain class names with an `e-` prefix (`.e-sidebar-link`, `.e-btn-primary`), so they never collide with Bootstrap/AdminLTE classes.
- `classic/skin.ts` imports the same file compiled (`?inline`) and injects only `@font-face`, `:root` tokens and `html[data-eact-*]` rules into classic pages, so the app's reset and components never reach them. Section 9 is inert in the React app (its `<html>` never has the attribute).
- No `.module.css`, no `<style>` in `index.html`, no static inline styles. Inline `style` remains only to pass data values as CSS variables: bar heights `--h`, progress share `--pct`, column width `--w`, skeleton size `--w/--h/--r`.
- Keyframes renamed per section (`e-ld-spin`, `e-ld-shimmer`, `e-toast-nt-in`, …) because two modules had different `shimmer` animations.

Removed: 21 `.module.css` files, `styles/tokens.css`, `styles/base.css`, `classic/classicSkin.css`, the `<style>` block in `index.html`, the four `@fontsource/inter/*.css` imports.
Regression: classic 23/23, tables 13/13, sign-in 20/20; dashboard and sign-in screenshots unchanged (desktop and mobile); no page errors.

## 7f. Classic forms and fields: nothing carried forward (2026-11-19)

All in section 9 of `eact.css` ("Forms: modern fields"), so it applies to every classic page:

| Legacy | Now |
|---|---|
| `form-horizontal`: right-aligned labels in a `col-sm-2` column | Label above the field, left-aligned, fields up to 760px wide (groups with one label; multi-pair groups keep their grid with left labels) |
| `.input-group.iconaddon` blue icon boxes | Icon inside the field on the left (muted; turns slate on focus); multi-line fields keep it on the first line |
| Icon + text prefix (phone icon + `+92`) | Duplicate icon dropped, `+92` kept as a quiet flat prefix |
| Attached dark `btn-info` ("+ Add COA") | Light secondary button joined to the field, slate text |
| `span.tooltip-top` blue "?" circles | 16px muted info icon (45% → 100% on hover); dark one-line tooltip |
| `material-switch` black track | 36×20 pill switch, slate when on, focus ring |
| Native selects / Select2 arrows | Same chevron as the app; disabled Select2 greyed |
| "Please Type Here! Branch Name" placeholders | `skin.ts` strips "Please … Here!" and drops placeholders that only repeat the label (attribute only) |
| Checkboxes / radios | 16px, slate (`accent-color`), labels aligned |

Fixes found while testing: `CSS` name clash in `skin.ts` (renamed `SKIN_CSS`); `:has(a, b)` selectors were dropped by the skin filter (now splits on top-level commas only); page enhancements and skin injection can no longer leave a classic page hidden if they fail.
Tests (stand-in built from the real `Branch/BranchAddEdit.aspx` markup with the real `material-switch.css`): forms 14/14, classic 23/23, tables 13/13.

## 7e. Roadmap: retire the classic pages and separate frontend and backend (proposed 2026-11-19)

**End state:** users only ever see the React app; the backend serves only JSON (handlers / API), no `.aspx` pages.

### Where the 971 classic pages stand (measured 2026-11-19, read-only)
| Group | Pages | What it needs | Backend change? |
|---|---|---|---|
| Handler + JS, no server-filled controls | **328** | Rebuild in React against the existing handlers | **No** |
| Handler + JS, but dropdowns filled in `Page_Load` (`DataSource`/`DataBind`) | **368** | Rebuild + a source for the lookup lists (branches, accounts, customers, items…) | Option A no / Option B yes (one read-only lookup handler) |
| JS calls a handler with a different name | 151 | Map JS → handler, then as above | No (some may need lookups) |
| Server postback pages (logic in `.aspx.cs`) | 48 | New JSON endpoints for that logic | **Yes** |
| Crystal reports built in code-behind | 24 | Report endpoints (or reuse `Reports/*Viewer.ashx` where one exists) | Mostly yes |
| No matching handler or JS | 46 | Audit: static, popup, obsolete or merged | Varies |
| Handler, no JS file | 6 | Read handler; rebuild | No |

Cross-cutting backend needs for a *full* separation: a context/menu endpoint (today read from `/Error.aspx` HTML), a JSON sign-in/sign-out endpoint (today the `Login.aspx` postback), rights checks in handlers (only 6 of 811 check rights today), and, only if frontend and backend get different domains, CORS with credentials or token auth.

Largest modules: Employee/HRM 224, AeoSetup 182, JV 78, SalesOrder 54, Payments 52, Company 48, PurchaseOrders 47, ReportsViewer 31, Inventory 28, Manufacturing 24, Customers 20, FBRIntegration 17.

### Stages
| Stage | Work | Backend change | Exit criterion |
|---|---|---|---|
| **1. Rebuild what the handlers already support** | The 328 (+ mapped share of the 151), module by module: FBR → Sales/Receipts/Returns → Purchases → Payments → JV/COA → Inventory → Company/Branch/Customers → Manufacturing → HRM → AEO. Each screen switched via `MIGRATED`, classic page kept as fallback until accepted (parity, saving, validation, FBR results, two roles) | None | Module's API-ready pages accepted |
| **2. Lookup data** for the 368 | **A:** read the `<select>` options from the rendered classic page (like the context bridge): no backend change, but fragile and slower. **B:** one read-only `Lookup.ashx` exposing the existing helper lists (e.g. `GernalReportsHelper.GetBranchesByCompanyId`): small, but a backend change → needs the written request in `CLAUDE.md` | A none / B one handler | Decision taken; lookups available |
| **3. Backend API layer** | Endpoints for the 48 postback pages, 24 reports, context/menu, JSON sign-in, rights checks in handlers | Yes, each change requested and approved separately | Every remaining page has an API |
| **4. Retire classic pages** | Per module, after a quiet period: remove its classic fallback; finally remove `/app/classic`, the classic skin (§9 of `eact.css`), the `/Error.aspx` bridge and the `Login.aspx` emulation; IIS redirects `*.aspx` → `/app` | IIS rule; deleting `.aspx` files is a last, separately approved step | No user-facing `.aspx` left |
| **5. Deployment split** | Recommended: keep one public origin (reverse proxy), frontend as static files, backend as API: no CORS, same cookie. Separate domains only if needed (then CORS/auth work) | Only for separate domains | Separate build/deploy pipelines |

Stage 1 needs no permission and can start now; Stages 2B, 3 and 4 depend on lifting the no-backend rule change by change. Timing follows the existing change documentation (23 Nov 2026 – 30 Jul 2027 with 3–5 developers for ~950 screens); with one developer it is proportionally longer.

### Decisions needed
1. Lookup data: **A** (no backend change, fragile) or **B** (one read-only lookup handler, needs approval).
2. Whether the no-backend rule is relaxed for Stage 3, change by change with the written request.
3. One public origin (recommended) or separate frontend/backend domains.
4. Who audits the 46 pages with no handler/JS (keep, merge or drop).

## 8. Decided 2026-11-19: dashboard finance figures → option 1 (leave out of the live dashboard)

Sales, tax payable, cash, receivables, ageing and top buyers have no data source the frontend can read (section 6). Options:

1. **Leave them out of the live dashboard** (current behaviour): live mode shows the FBR card and a "not connected" note; finance stays in the classic reports.
2. **Replace them with figures the system already exposes**, e.g. "Needs attention" from `MasterDashBoardNew.ashx` (orders awaiting approval).
3. **Add one read-only dashboard handler to the backend.** This breaks the no-backend rule, so it needs the full written request from `CLAUDE.md` (files, why unavoidable, impact, rollback, alternatives) and explicit approval first.

---

## Change log

| Date | Change | Files |
| 2026-11-20 | QuickBooks theme (user decision, replaces Intaglio as the visual direction): tokens re-set in §2 (charcoal rail #393A3D, grey canvas, white cards, QuickBooks green accent #2B8C1B, blue links, neutral dark mode) and a new "QuickBooks layer" before §8 that flattens the Intaglio layer (plain Inter titles, no guilloché, flat green buttons, grey table header, soft status chips). Journal entry form rebuilt in the QuickBooks layout: "Journal entry" title, journal date row, lines grid ordered Account / Debits / Credits / Description, totals + difference under the grid, dark action bar pinned to the bottom (Clear, Save and new, Save and close; F9/F10 kept; Enter on Description saves the line). No backend change | `src/styles/eact.css`, `src/pages/JournalVoucher/JournalVoucherPage.tsx` | Follow-up (user screenshot of QuickBooks Online): journal entry is now a grid of always-editable rows (8 blank rows, Add lines, Clear all lines, per-row duplicate and delete) with Account, Debits, Credits, Description, Project, Sub project, Fund/Class and Name (donor) cells, a Total row with the difference, and a bottom bar of Cancel, Clear, Save, Save and new. Blank rows are ignored on save; memo and attachments are omitted because the legacy save has no field for them. Files: `JournalVoucherPage.tsx`, `eact.css` (journal entry grid). Then: Project, Sub project, Fund/Class and Name (donor) moved out of the grid into a "Line details" band under it that edits the line the cursor is on (that row is highlighted); the cursor reaching the last grid line adds a new line. Side bar restyled as the QuickBooks light navigation (white, grey active pill, uppercase section labels; dark theme keeps the charcoal rail). Top-bar screen search: up to 30 results, keyboard moves scroll the highlighted result into view, and pressing the list or its scrollbar no longer closes it.
|---|---|---|
| 2026-11-19 | Plan written: Category standard + Executive Slate chosen | `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Open questions answered (port 9575, both dashboard handlers, no switcher) | `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Phase A: Vite + React + TS scaffold, Executive Slate tokens, base styles, dev proxy | `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/App.tsx`, `src/styles/*` |
| 2026-11-19 | Phase B: shell and 17 shared components; API wrapper; session helpers; menu | `src/components/*`, `src/api/http.ts`, `src/legacy/*`, `src/app/nav.ts`, `src/lib/*` |
| 2026-11-19 | Phase C: Dashboard and FBR invoices screens on sample data; build passes; screenshots checked at 1440, 600 and 520px | `src/pages/*`, `src/api/fbr/*`, `src/api/dashboard/*`, `src/mocks/*` |
| 2026-11-19 | Fix: NTN and FBR numbers no longer break at hyphens on narrow screens | `src/pages/FbrInvoices/FbrInvoicesPage.module.css` |
| 2026-11-19 | `CLAUDE.md` updated with design, run commands and doc rule | `CLAUDE.md` |
| 2026-11-19 | Phase D: read the list, error-list, dashboard and report handler contracts (read-only) | (none) |
| 2026-11-19 | FBR list wired to `PopulateInvoiceList` (7 statuses in parallel) and `PopulateErrorInvoiceList`; legacy statuses, Destination and Further tax columns; date column removed; 12-month picker | `src/api/fbr/*`, `src/pages/FbrInvoices/*`, `src/mocks/fbrInvoices.ts`, `src/lib/dates.ts` (new) |
| 2026-11-19 | Dashboard: FBR card live from the list calls; finance figures sample-only, "not connected" in live mode | `src/api/dashboard/*`, `src/pages/Dashboard/*`, `src/mocks/dashboard.ts` |
| 2026-11-19 | Build passes; sample mode checked by screenshot. Live mode not run: legacy site on 9575 was not running | (none) |
| 2026-11-19 | Decision recorded: dashboard finance figures, option 1 | `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Phase E: context bridge from `/Error.aspx` (company, user, period, session values, per-role menu) | `src/legacy/contextBridge.ts` |
| 2026-11-19 | Live menu: legacy groups (collapsible, "Find a screen" filter), `MIGRATED` switch-over with **New** tag, classic role dashboards relabelled | `src/app/nav.ts`, `src/components/Sidebar/*` |
| 2026-11-19 | Rights parity: `RequireMenuRight` on `/fbr/invoices`; FBR card and invoice search hidden without the right | `src/app/RequireMenuRight.tsx` (new), `src/App.tsx`, `src/pages/Dashboard/DashboardPage.tsx`, `src/components/TopBar/*` |
| 2026-11-19 | Session: redirects not followed; any redirect/401/HTML answer → `Login.aspx`. Sign out link | `src/api/http.ts`, `src/components/TopBar/*` |
| 2026-11-19 | Dev proxy forwards everything outside `/app` (rewritten URLs have no `.aspx`) | `vite.config.ts` |
| 2026-11-19 | End-to-end test against a stand-in legacy server: signed in, session ended, no FBR right; all pass. Backend check: no file modified | (none) |
| 2026-11-19 | New sign-in screen `/app/login` over the legacy Login.aspx postback; forgot password; sign-up links; sign out via Logout.aspx | `src/api/auth.ts` (new), `src/pages/Login/*` (new), `src/App.tsx`, `src/legacy/session.ts`, `src/components/TopBar/*` |
| 2026-11-19 | Loaders: startup splash, top progress bar, skeletons, button spinner | `index.html`, `src/components/Loaders/*` (new), `src/components/Button/*`, `src/components/AppShell/AppShell.tsx`, `src/components/Sidebar/*`, `src/pages/*`, `src/app/RequireMenuRight.tsx` |
| 2026-11-19 | Browser tests (stand-in server, ports 9576/5174): 20/20 sign-in checks, loader checks pass | (none) |
| 2026-11-19 | Noted: `E:\DigitalInvoice500\.env` appeared in the backend folder (not created by this work); the frontend reads `.env` only from its own folder | (none) |
| 2026-11-19 | Decision: both tracks. Track 1: all 971 classic pages inside the shell with the Executive Slate skin | `src/pages/Classic/*` (new), `src/classic/*` (new), `src/app/nav.ts`, `src/App.tsx`, `src/components/Sidebar/*`, `src/components/TopBar/*`, `src/pages/*` (classic links) |
| 2026-11-19 | Dev proxy rewrites the legacy origin out of responses; `changeOrigin` for IIS Express | `vite.config.ts` |
| 2026-11-19 | Fixes found by tests: Back from page cache, AdminLTE content offset, legacy `.btn-primary.custom`, colour fade on load, gradient panel bars, Select2 sizing, mobile Sign out overflow (icon button), mobile gutter | `src/pages/Classic/ClassicPage.tsx`, `src/classic/*`, `src/components/TopBar/*`, `src/components/Icon/Icon.tsx` |
| 2026-11-19 | React Router v7 future flags enabled (removes console warnings) | `src/main.tsx` |
| 2026-11-19 | Tests: classic 23/23, sign-in 20/20. Backend check: no backend file changed (only the user-created `.env`) | (none) |
| 2026-11-19 | Ran against the real legacy site: created frontend `.env` (live mode); session check now follows the cookieless AutoDetect redirect | `.env` (new, not committed), `src/legacy/contextBridge.ts`, `src/api/auth.ts` |
| 2026-11-19 | "Ledger" table design for all tables: pinned header and first column, uppercase 11px header band, 13px cells, pastel pills, actions on hover; numeric-column detection for classic tables; `···` row menu on the FBR list | `src/styles/eact.css` (tokens, data table, badge, FBR page, §9 ledger block), `src/components/DataTable/DataTable.tsx`, `src/components/Icon/Icon.tsx`, `src/pages/FbrInvoices/FbrInvoicesPage.tsx`, `src/classic/skin.ts` |
| 2026-11-19 | Classic forms modernised (labels above, icons inside fields, quiet help icons, switches, attached buttons, placeholder tidy) | `src/styles/eact.css` (§9), `src/classic/skin.ts`, `src/pages/Classic/ClassicPage.tsx` |
| 2026-11-19 | Roadmap saved to memory for next session | (memory) |
| 2026-11-19 | Roadmap to retire classic pages and separate frontend/backend (§7e), based on a read-only scan of the 971 pages | `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Removed a design-tool settings file this work had created by mistake in the backend folder (`E:\DigitalInvoice500\.impeccable\config.json`); exception now kept in the frontend `.impeccable/config.json` | (backend folder restored) |
| 2026-11-19 | All styling consolidated into `src/styles/eact.css`; components use `e-` global classes; skin injected from the same file; inline styles only pass data as CSS variables | `src/styles/eact.css` (new), 21 `*.module.css` + `tokens.css` + `base.css` + `classicSkin.css` (removed), `index.html`, `src/main.tsx`, `src/classic/skin.ts`, all components and pages |
| 2026-11-19 | Table convention applied to all tables (React + classic DataTables); toolbar search on the FBR list; selection count shows visible rows only | `src/styles/tokens.css`, `src/components/DataTable/*`, `src/components/FilterBar/*`, `src/pages/FbrInvoices/*`, `src/classic/classicSkin.css`, `src/classic/skin.ts` |
| 2026-11-19 | Fixed the top-bar class mismatch that stacked mobile controls; added subtle page and period background tokens for clearer surface separation | `src/components/TopBar/TopBar.tsx`, `src/styles/eact.css` |
| 2026-11-19 | Polished shared surfaces: subtle page gradients, softer card elevation, clearer toolbar/table separation, and more consistent status and login surfaces | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Replaced coral accents with an icy sky-blue canvas wash and restored translucent frosted widgets | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Added subtle frosted-glass top-bar/cards and a slow ambient canvas glow, with reduced-motion support | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Added restrained executive-reporting details: eyebrow, reporting-period metadata, fine canvas grid and tighter card/status hierarchy | `src/components/PageHeader/PageHeader.tsx`, `src/pages/Dashboard/DashboardPage.tsx`, `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Full-width classic table panels: table and DataTables wrappers now expand across the content row | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Added system-aware dark mode with persisted manual override and top-bar theme control; React and classic frames share the resolved theme | `src/theme.ts`, `src/components/TopBar/TopBar.tsx`, `src/classic/skin.ts`, `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Muted dark mode from neon blue to a graphite/slate palette with restrained blue-gray highlights and softer semantic colors | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Stretched classic table panels to fill the available viewport height while preserving natural row sizing | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Isolated classic sticky table headers with opaque layering so scrolled rows cannot show through them | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Removed vertical sticky behavior from classic DataTable headers; headers remain as one opaque table band to prevent rows from bleeding through while scrolling | `src/styles/eact.css`, `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Classic table headers pinned again (`thead` and `th` sticky at top, opaque band, `z-index` above rows); `tbody` gets its own low layer so row content with a z-index can't paint over the header | `src/styles/eact.css` (§9), `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Fix: rows showed above the pinned header (e.g. Branch list) through the 12px top padding of the `.table-responsive` panel body; classic scroll areas now have no top padding | `src/styles/eact.css` (§9), `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Fix to the above: the no-top-padding rule lost to `.erp-table > .panel-body` (higher specificity, both `!important`); selectors raised to match | `src/styles/eact.css` (§9), `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Classic radios/checkboxes: loose input + label pairs centred, 6px to the label, 20px before the next option (unclassed labels only, so custom switches are untouched) | `src/styles/eact.css` (§9), `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Dark mode: dropdown panels and options (Select2, Chosen, Bootstrap dropdown, jQuery UI autocomplete, native `<option>`) get the card surface and ink colour; text no longer disappears on white panels | `src/styles/eact.css` (§9), `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Fix: wide DataTables (e.g. JV Detail on `JV/JVAdjustments.aspx`) spilled out of their panel because the flex column grew to the table width; the column now shrinks to the panel and scrolls (both axes, pinned header kept); panel bodies holding only a table do the same | `src/styles/eact.css` (§9), `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Classic entry forms with a "Transaction Summary" card (e.g. JV): summary moved above the detail table as a full-width 3-up strip; detail table full width (CSS `order`, no markup change) | `src/styles/eact.css` (§9) |
| 2026-11-19 | Classic pages: date pickers no longer pop open on load. Legacy scripts focus the date box in their ready handler (e.g. `JVAdjustments.js`); until the user first clicks or types, a programmatic focus on a date field is undone and its picker hidden | `src/classic/skin.ts` |
| 2026-11-19 | Classic date fields: field and calendar addon share one 38px height (legacy `.iconaddon` inline-table); `div.datelbl` caption styled and left-aligned like other labels | `src/styles/eact.css` (§9) |
| 2026-11-19 | Decision: per-line POST/PATCH for JV needs new backend endpoints; user declined the backend change. JV lines are saved locally and the voucher posts once to the existing `InsertIntoDB` | `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | New React screen: New journal voucher `/accounts/jv/new` (replaces `JV/JVAdjustments.aspx` via `MIGRATED`). Lines table with an entry row pinned to the bottom (custom `<tfoot>` row in `DataTable`), inline errors, Enter saves the line, inline row edit (save/cancel), duplicate/remove with undo; summary strip above the full-width table; voucher save with loading/error states, same payload, checks and messages as the classic page, ShortGUID reused on retry; F9/F10; unsaved lines kept as a browser draft. Project and fund/class lists, feature flags, period and links are read from the classic page HTML (its Unauthorized redirect is the rights check) | `src/pages/JournalVoucher/JournalVoucherPage.tsx` (new), `src/api/jv/*` (new), `src/mocks/jv.ts` (new), `src/components/Combobox/Combobox.tsx` (new), `src/components/DataTable/DataTable.tsx` (`editRow`, `entryRow`), `src/legacy/contextBridge.ts` (`scriptVars` exported), `src/app/nav.ts`, `src/App.tsx`, `src/styles/eact.css` (§6 data table entry row, §6 combobox, §7 journal voucher) |
| 2026-11-19 | JV screen layout: lines table holds only account (narrow), description (wide), debit and credit (narrow); project, sub project / activity, fund/class and donor moved to a separate "Line details" band above the table that applies to the new line (values kept between lines) or to the line being edited; saved lines show those values under the description | `src/pages/JournalVoucher/JournalVoucherPage.tsx`, `src/styles/eact.css` (§7 journal voucher) |
| 2026-11-19 | Fix (classic skin): layout rules with `display … !important` overrode inline `display: none`, revealing fields a page hides (e.g. JV Project, Fund/Class, Donor when the company has them switched off). Inline-hidden elements now stay hidden; jQuery `.show()` still reveals them | `src/styles/eact.css` (§9) |
| 2026-11-19 | JV screen: Project, Sub project / activity, Fund/Class and Donor always shown in "Line details" (user decision), whatever the company flags; a chosen value is posted even when the flag is off; Fund/Class and Donor are required only when their flag is on. Account column narrower (18%), description wider, debit/credit 12% | `src/pages/JournalVoucher/JournalVoucherPage.tsx`, `src/api/jv/jv.ts` |
| 2026-11-19 | JV lines table: fixed table layout so widths hold; account 17%, debit/credit 11% at the right edge, actions 128px, description takes the rest | `src/styles/eact.css` (§7), `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-19 | Fix: the JV account suggestions list (opening upward from the pinned entry row) was painted under the pinned header, so the "ACCOUNT" header showed on top of a half-hidden white popup. Combobox lists now render in a portal on `<body>`. "New" tag no longer wraps | `src/components/Combobox/Combobox.tsx`, `src/styles/eact.css` |
| 2026-11-19 | Shell: sidebar and top bar get soft token-based gradients (card surface into the canvas tint; both themes) | `src/styles/eact.css` (§5) |
| 2026-11-19 | Shell: collapsible sidebar on desktop (toggle in the brand row, Ctrl+B, remembered per browser): 72px icon rail, two-letter badges for menu groups and items without icons, tooltips; clicking a group in the rail expands the menu with that group open. Mobile drawer unchanged | `src/components/AppShell/AppShell.tsx`, `src/components/Sidebar/Sidebar.tsx`, `src/components/Icon/Icon.tsx` (`collapse`, `expand`), `src/styles/eact.css` (§5) |
| 2026-11-19 | Top bar: full-screen toggle beside the theme button (Fullscreen API on the whole app; icon follows Esc/browser exit; hidden where unsupported). Sidebar gradient made clearly visible (card → sky tint, both themes) | `src/components/TopBar/TopBar.tsx`, `src/components/Icon/Icon.tsx` (`fullscreen`, `fullscreenExit`), `src/styles/eact.css` (§5) |
| 2026-11-19 | Dashboard KPIs: new live "FBR compliance" row (invoices this month + ready to post, posted to FBR with posting-rate meter, value of sales, sales + further tax, needs attention linking to the failed list), computed from the existing FBR invoice list (shared request, no new calls; void excluded). KpiCard animates: count-up numbers, staggered fade-in, meter fill (top accent strip removed after design review: tone is carried by the icon chip); icons and tones; screen readers get final values; all motion off with reduced-motion. Sample finance KPIs use the same animation (+ over-90 share meter) | `src/components/KpiCard/KpiCard.tsx`, `src/pages/Dashboard/DashboardPage.tsx`, `src/styles/eact.css` (§6 figure card, §7 dashboard) |
| 2026-11-19 | Fix (JV save): the session `DateFormats` is three formats joined with `@` (`dd/mm/yyyy@dd/MM/yyyy@DD/MM/YYYY`); the voucher date was written with the whole string. Now the .NET-style part is used everywhere (shared `src/lib/legacyDate.ts`: `legacyDateFormat`, `toLegacyDate`, `fromLegacyDate`, `isoFromHandler`) | `src/lib/legacyDate.ts` (new), `src/api/jv/jv.ts`, `src/legacy/contextBridge.ts` |
| 2026-11-19 | Classic skin, dark mode and headers: legacy search-filter panels (`.erp-search-panel`, hard-coded white/#f8fbff, grey labels) themed; standalone Search button (`a.input-group-addon.btn-search`) is a full 38px accent button with its label inside; DataTables buttons and the column-visibility menu themed; header labels (incl. the coloured "(Rs.)" span) take the header colour with no background; empty-table and info text transparent | `src/styles/eact.css` (§9) |
| 2026-11-19 | New React screen: Journal vouchers `/accounts/jv` (replaces `JV/JVAdjustmentsList.aspx` via `MIGRATED`). Keeps every classic detail: Branch/Status/Start/End filters with Search (role 21/22 status limits), rows per page 10/25/50/100/all, column visibility (min. three), Copy, CSV, Print with company/title/time frame, table search, columns Serial no, Code, Branch, Date, Status, Amount, Branch(s), row actions by role and status (Edit/Delete → classic edit or multi-JV edit, HTML view, Report) plus copy code; add/update/delete success message from `?action=&code=`; total amount in the footer. Ledger table design for the headers. Classic frame now passes the query string when it redirects to a migrated screen | `src/pages/JournalVoucherList/JournalVoucherListPage.tsx` (new), `src/api/jv/list.ts` (new), `src/mocks/jvList.ts` (new), `src/app/nav.ts`, `src/App.tsx`, `src/pages/Classic/ClassicPage.tsx`, `src/styles/eact.css` (§7 journal voucher list, print) |
| 2026-11-19 | Decision: "do the same for the other lists" = classic-skin polish for all 290 list pages + React rebuild of the JV-module lists one by one (user choice) | `docs/FRONTEND_CONVERSION.md` |
| 2026-11-19 | Config-driven list engine: a list is a `ListDef` (classic page, filters read from its server-rendered controls, handler/action with parameters sent in the query string as the classic ajax URL does, columns with legacy kinds index/code/date/money/status, row actions classic/tab/report by role and status). `ListScreen` gives every list the JV-list design and tools (rows per page, column visibility min. 3, Copy, CSV, Print with company/title/time frame, search, paging, total, ?action=&code= message, required filters, load-on-open as classic). Legacy `GetCode` prefixes and `GetStatusM` labels generated from `Uttility.js`. `postHandler` gains `inQuery`. Registry `LIST_DEFS` feeds routes and `MIGRATED` | `src/lists/engine.ts`, `src/lists/ListScreen.tsx`, `src/lists/legacyLabels.ts` (generated), `src/lists/index.ts`, `src/lists/defs/jv.ts` (all new), `src/api/http.ts`, `src/app/nav.ts`, `src/App.tsx` |
| 2026-11-19 | JV lists on the engine (batch 1, 8 of 28): Journal vouchers (`/accounts/jv`, replaces the hand-written page), Charges, Gratuity fund, Leave encashment, PF profit distribution, Inter fund transfers, Multi fund JVs, JV list. Removed `src/pages/JournalVoucherList/*` and `src/api/jv/list.ts` (now a definition) | `src/lists/defs/jv.ts`, `src/mocks/jvList.ts` |
| 2026-11-19 | Classic skin (all lists): `.erp-table` panel headings match the new panel header | `src/styles/eact.css` (§9) |
| 2026-11-19 | JV screen: "Line details" band moved below the lines table (under the entry row it applies to), above the save bar | `src/pages/JournalVoucher/JournalVoucherPage.tsx`, `src/styles/eact.css` (§7) |
| 2026-11-19 | Decision (user): more colour. Colour layer on top of Executive Slate: spectrum tokens (emerald, teal, sky, indigo, violet, rose, amber; dark-mode variants), `--grad-brand` (emerald → sky → indigo, white text ≥ 4.5:1), `--grad-outline`, `--grad-wash`, `--grad-spectrum`, emerald focus ring, `--c-emerald-ink` for small text. Applied: spectrum outlines on cards, KPI cards, panels, filters and summary cards; gradient primary buttons; multi-hue panel-header washes; tinted table header band; per-card hues for neutral KPI cards (ok/wait/bad stay semantic); debit/credit hues; gradient logo, active sidebar item and "New" tag; hued group badges; spectrum line under the top bar; mint/lavender canvas (reference: the user's AEO sign-in screen). Classic skin gets the same (panels, panel headings, buttons, focus, table header, pagination, DataTables buttons). Then +10% concentration on outlines (55 → 65%, dark 45 → 55%) and ~10% on tints | `src/styles/eact.css` (§2 tokens, §6 colour layer, §9), `CLAUDE.md` |
| 2026-11-19 | Colour layer reduced (user): three hues only, emerald, sky and indigo (as the reference). Violet, rose, amber and teal tokens removed; outlines, washes and the top-bar line are emerald → sky → indigo; per-card, sidebar-badge and chip-hover cycles go through the three; violet canvas glow removed; sidebar badge letters deepened for contrast. Status colours unchanged | `src/styles/eact.css` (§2, §6, §9), `CLAUDE.md` |
| 2026-11-19 | Root canvas + elevated frosted glass (user): one gradient (`--canvas-gradient`: emerald top-left, sky top-right, indigo bottom-right) on the shell, fixed, behind the sidebar, top bar and content; sidebar, top bar, classic strip and widgets (cards, KPI cards, panels, filters, summary cards) are frosted glass (`--frost-bg`, blur + saturate, light top edge, floating indigo-tinted shadow); colour outline drawn as a 1px masked ring so the glass stays see-through; reduced-transparency fallback to solid cards. Classic pages: wrapper/content transparent so the shell canvas shows through the (transparent) frame; panels translucent with outline and shadow, no blur (would trap fixed modals inside panels). DataTable row menu portalled to `<body>` (backdrop-filter makes panels the containing block of fixed elements) | `src/styles/eact.css` (§2 tokens, §6 colour layer, §9), `src/components/DataTable/DataTable.tsx` |
| 2026-11-19 | Consistent outlines: one outline geometry everywhere (`--grad-outline` left → right, emerald → indigo, same strength for every size; was 120° through sky, so small and wide boxes looked different); status summary cards get a 1px ring in their status colour; all controls (fields, selects, combobox, chips, filter chips, plain buttons, top-bar tools; classic form controls, Select2, addons, DataTables buttons/search) share `--control-line` / `--control-line-hover`; inner dividers neutral; per-chip hover hues removed. Classic: wrapper panels that only hold panels are frameless (no double frames); nested panels use the outer 12px radius | `src/styles/eact.css` (§2, §6, §9) |
| 2026-11-20 | Redesign (user): **Intaglio**, read as a bank cheque book ("Cheque & Counterfoil", chosen on the decision page; scope whole app, dark mode kept). Replaces the colour/glass/gradient layer. Tokens: cheque-paper ground with a faint two-direction security tint, bank-green ink accent (`#0F3D2E`), navy figures, gold rule, VOID red; ink-dark variant for dark mode; radii 2–4px; paper shadows. Cinzel (self-hosted, `@fontsource/cinzel`) for page/panel/rail titles. Bank-green side rail with gold double rule; white top bar over one green rule; panels in one engraved outline with double-rule section heads; ruled status stamps; void records kept visible, struck through under a VOID stamp; counterfoil stub (perforated, totals and status counts) on list screens, JV summary and KPI cards. Label above page titles removed. Classic skin: same layer (panels, heads, buttons, controls, table header, stamps). Count-up "-0" bug fixed. Direction contract in `.impeccable/surfaces/src-styles-eact-css.md` | `src/styles/eact.css` (§1 fonts, §2 tokens, §6 Intaglio layer, §9), `src/lists/ListScreen.tsx`, `src/components/{DataTable,Badge,KpiCard,PageHeader,TopBar}`, `src/lists/legacyLabels.ts`, `src/lists/engine.ts`, `src/lists/defs/jv.ts`, `src/pages/{Dashboard,JournalVoucher}`, `package.json`, `CLAUDE.md` |
| 2026-11-20 | Intaglio, user reference applied: plain cool-grey ground (security tint removed), white cards with hairline grey borders and 10px radius, bold serif figures (Libre Caslon Text, self-hosted) for headline amounts, KPI labels in small tracked capitals with a fixed two-line cell (figures share a baseline); dashboard **Cash position** hero (sample data: total, day change with reason, bank/cash breakdown) with an authored SVG guilloché rosette bleeding off the right edge; small rosette on the lead FBR KPI card | `src/styles/eact.css`, `src/components/Guilloche/Guilloche.tsx` (new), `src/components/KpiCard/KpiCard.tsx`, `src/pages/Dashboard/DashboardPage.tsx`, `src/api/dashboard/types.ts`, `src/mocks/dashboard.ts`, `package.json` |
| 2026-11-20 | Keyboard flow (user): **Enter moves to the next field** in the same form / table row (last field keeps its normal Enter: filter forms search, JV entry row saves from Credit); left alone in textareas, open dropdown lists, IME, and on classic fields that already have legacy key handlers. **Tab skips helpers** on classic forms (calendar/addon buttons, help and tooltip links, select2 clear) via tabindex -1; main buttons stay reachable | `src/lib/enterToNext.ts` (new), `src/components/AppShell/AppShell.tsx`, `src/classic/skin.ts`, `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Finish-review fixes: breadcrumb and single active rail item on migrated screens (sample nav entries, NavLink `end`); sign-in and period pill lose gradients/blur at source; avatar token colours (dark-mode contrast); "List total"/"Records" copy; VOID stamp text with full label for screen readers; counterfoil band wraps between items; JV totals merged into one counterfoil; perforation and tinted icon squares removed from KPI cards; dark-mode active rail fill | `src/styles/eact.css`, `src/lists/ListScreen.tsx`, `src/app/nav.ts`, `src/components/Sidebar/Sidebar.tsx`, `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Classic skin fixes (seen on `JV/MultiJVAdjustments.aspx`, apply to every page built the same way): form groups that hold a row of field columns are no longer stacked and capped at 760px (fields were squeezed: "Sear…", tiny Donor); rows of `col-sm-2`/`col-md-2` fields lay out as one wrapping row of equal fields; an `.input-group` that is also `.form-group` stays one row (Credit addon/field/+ were stacked); labels classed `icon-…` holding totals were caught by an icon-font prefix rule and rendered digits as boxes, now set in the figure face; Total debit / Total credit / Difference box tidied (uppercase labels, right-aligned figures, hairlines) | `src/styles/eact.css` (§9) |
| 2026-11-20 | Intaglio documented: `DESIGN.md` (tokens frontmatter + 8 sections, named rules: Two Inks; Gold Belongs to Engraving; Cancel, Don't Delete; Not-By-Colour-Alone; Engraved Titles Only; Caslon Is Money; Bare Title; Green-Tinted Shadow) and `.impeccable/design.json`. Stale stylesheet comments (Executive Slate, security tint) and the CLAUDE.md table rule ("pastel pills" → ruled stamps) updated. Finish review: all scored fixes resolved over two verdict rounds; three small follow-ups fixed after the last round, not re-scored | `DESIGN.md` (new), `.impeccable/design.json` (new), `src/styles/eact.css`, `CLAUDE.md` |
| 2026-11-20 | Classic skin: form groups that contain a panel or table are layout containers (no 760px single-column cap); detail-table panels (e.g. Multi JV Detail, through `.tblalign` and nested col-sm-12 wrappers) span the full content width; the Total debit / credit / difference box is compact and right-aligned | `src/styles/eact.css` (§9) |
| 2026-11-20 | JV approval lists on the list engine (batch 2, 8 more; 16 of 28 JV lists done): JV, Multi fund JV, Gratuity fund, Leave encashment, PF profit distribution, Inter branch transfer, Inter branch account, Inter fund transfer approvals (`/accounts/approvals/...`). Read-only lists: approving happens on the classic page opened by "View & approval" (`ApproveURL?guid=`); role 12 Edit/Delete, Report and HTML view as on the classic action columns. Engine: per-row voucher code type (`codeTypeOf`, inter-branch IBT/MIBT) and per-list `emptyText`. Inter fund transfer approval: role 12's classic Report button called an undefined `JVReport()`; it now opens the same inter-fund transfer report as other roles | `src/lists/defs/jvApprovals.ts` (new), `src/lists/index.ts`, `src/lists/engine.ts`, `src/lists/ListScreen.tsx` |
| 2026-11-20 | Side rail: the brand row (logo + E-ACT 360 + collapse button) is pinned at the top while the menu scrolls | `src/styles/eact.css` (§6) |
| 2026-11-20 | Fix: side menu "refreshed" when opening a form. A group's open state was "opened by hand" XOR "holds the current page", so opening a form from a group you had expanded snapped it shut (and the previous group closed), jumping the menu. Now one set of open groups: navigation only adds the current page's group; only the user's clicks close a group; the current item scrolls into view only when off-screen | `src/components/Sidebar/Sidebar.tsx` |
| 2026-11-20 | Colour scheme picker (user): five engraving inks, Bank green (default), Banker's navy, Oxblood, Graphite, Indigo, chosen from a swatch button in the top bar (menu of radio items, keyboard and Esc). Each scheme sets accent, rail, rail rule and focus colours in light and dark (non-green schemes get a neutral ink-dark ground); status colours never change. Stored per browser (`eact-scheme`), applied as `data-eact-scheme` on the shell and every classic frame | `src/theme.ts`, `src/components/TopBar/TopBar.tsx`, `src/classic/skin.ts`, `src/styles/eact.css` (§2 colour schemes, §6 picker) |
| 2026-11-20 | Dashboard (live mode): the "Sales, tax, cash and receivables" not-connected card carries an ambient, ghosted guilloché wave band (interlaced phase-shifted sine waves, the engraved border pattern of banknotes and cheques) along its lower right, fading toward the text; decorative only, no data, scheme accent colour, light and dark (first try, a ghosted line chart, replaced at the user's request) | `src/components/GhostPattern/GhostPattern.tsx` (new), `src/pages/Dashboard/DashboardPage.tsx`, `src/styles/eact.css` |
| 2026-11-20 | Ghosted guilloché band behind every form (user): new screens (voucher date card, list search filters, JV Line details, sign-in form side) and classic form panels (panels with fields and no nested panel, dialog, dropdown menu or data table, so a dialog or menu is never trapped). One `--ghost-wave` SVG mask token tinted with the scheme accent (`--ghost-opacity` .10 light / .16 dark), layered under the fields with `isolation`, fading toward the left | `src/styles/eact.css` (§2, §6, §9) |
| 2026-11-20 | QuickBooks visual pilot approved for the React journal voucher: scoped green brand tokens, white bordered surfaces, 40px controls, green focus ring, restrained table header/hover treatment, and outlined panel sections. Revert by removing the `theme-2026` body class added by `public/Scripts/ux-2026.js`; no markup, handlers, payloads, validation, or navigation changed | `src/styles/eact.css`, `public/Scripts/ux-2026.js`, `index.html` |
| 2026-11-20 | Fix: on tall classic forms (e.g. COA/COAAddEdit.aspx) the form pattern was sized as a share of the panel, so it stretched into large waves over half the form; it is now a capped band (≤ 640 × 170px) and quieter (opacity .08 light / .10 dark). Side-rail title "E-ACT 360" no longer wraps at 125% zoom (nowrap, tighter tracking and padding) | `src/styles/eact.css` (§2, §6, §9) |
| 2026-11-20 | Fix: top-bar screen search results did not scroll. Pressing the list (e.g. its scrollbar) blurred the field, whose blur closed the list; and the list lived inside the top bar, where page content / the classic frame could paint over it and take the wheel. The list now renders at page level (portal, fixed under the field, z-index above everything, overscroll contained) and pressing it keeps focus in the field. Verified: wheel scrolls the list | `src/components/TopBar/TopBar.tsx`, `src/styles/eact.css` (§5) |
| 2026-11-19 | Classic frame: `?eactClassic=1` keeps a migrated page in its classic view (used by "Open classic screen" on the JV screen); the legacy page ignores the extra query value | `src/pages/Classic/ClassicPage.tsx` |
| 2026-11-20 | Pine Emerald replaces Intaglio and the QuickBooks pilot colours (user decision, 21st.dev @serafimcloud/pine-emerald). Tokens in §2 now carry the theme: background #F9FAFC, card #FFFFFF, ink #1A1C2E, muted #626784, border #E2E4ED, primary #0AA347, secondary navy #353957, destructive #FC6D77; dark: #1E2036 ground, #2B2E4A card, #353957 border. Flat, border-only surfaces (no card shadows), 6px radius, Inter with -0.01em tracking. New tokens `--accent-ink` (AA green for small text and links, since #0AA347 on white is about 3.2:1) and `--destructive`; the journal action bar is a white bar with a hairline top rule (not navy). Removed Cinzel and Libre Caslon @font-face, guilloche wave and the neutral-ground dark overrides for the non-green schemes; hard-coded greys and greens in the flat layer now use tokens. Scheme picker kept, default renamed "Pine emerald". Intaglio-era rules in §6 and §9 remain but take colour and type from the tokens; a full rule-level clean-up is still open | `src/styles/eact.css`, `src/theme.ts`, `CLAUDE.md`, `DESIGN.md` |
| 2026-11-20 | Journal entry: "Add columns" checkboxes above the line grid (Project, Sub project / activity, Fund/Class, Name (donor)). A ticked box adds that field as a column on every line and removes it from the Line details band (the band hides when all four are columns). Fund/Class and Name (donor) start ticked when the voucher requires them; the choice is remembered in the browser (`eact-jv-cols`). Saved data is unchanged | `src/pages/JournalVoucher/JournalVoucherPage.tsx`, `src/styles/eact.css` |
| 2026-11-20 | Journal entry: the "Line details" panel is removed (user). Project, Sub project / activity, Fund/Class and Name (donor) are entered only as grid columns, switched on from "Add columns". Required fields (Fund/Class, Name (donor) when the voucher needs them) are always on and their checkboxes are disabled | `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Gradient icon rail replaces the full-width side menu (user paste of a "gradient sidebar", ported to plain React + `eact.css` §7b; no Tailwind, shadcn, react-icons or lucide-react added). Fixed 92px rail of round icon buttons; hover or keyboard focus widens a button to a 180px pill with its label, overlaying the page. Top-level links go straight to their route; each module (menu group) opens a fly-out list of its pages (Esc, outside click and navigation close it). Below 640px the rail becomes a bottom bar of icons only (no hover). Single emerald gradient from new tokens `--rail-g1/--rail-g2`, `--rail-w`, `--rail-bar-h`. Removed from the shell: the collapse button and Ctrl+B, the mobile drawer and top-bar menu button, the company/period footer. `src/components/Sidebar` and its CSS are kept unused for rollback (swap `GradientRail` back to `Sidebar` in AppShell) | `src/components/GradientRail/GradientRail.tsx`, `src/components/AppShell/AppShell.tsx`, `src/components/TopBar/TopBar.tsx`, `src/styles/eact.css` |
| 2026-11-20 | Journal entry columns: required fields (Fund/Class, Name (donor)) are always columns with no checkbox; Sub project / activity has no checkbox and appears next to Project when Project is ticked (its cell stays disabled until a project is chosen on that line). The "Add columns" row is hidden if no optional column remains | `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Rail polish (user: "more aesthetically pleasing"): icons replace the two-letter badges (new `building`, `settings`, `shield`, `wallet`, `folder`, `grid` icons; modules matched by name, neutral grid otherwise); items take six gradient hues (Dashboard keeps emerald; blue, amber, navy, coral, teal as `--rail-h*` tokens, darkened for white text); resting icons carry their hue; current page gets an edge bar (bottom bar on mobile) plus the filled gradient; gradient logo tile; fly-out header with hue chip, name and page count; labels sentence case with ellipsis | `src/components/GradientRail/GradientRail.tsx`, `src/components/Icon/Icon.tsx`, `src/styles/eact.css` |
| 2026-11-20 | Rail pill no longer covers the page: a hovered pill is 140px (`--rail-pill`) and page content on screens 640px and wider starts clear of it. Journal entry: all four "Add columns" checkboxes are back (user); Fund/Class and Name (donor) stay ticked and locked when the voucher requires them, and Sub project is its own checkbox again | `src/styles/eact.css`, `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Journal entry: the Name (donor) checkbox is unlocked (user). It starts ticked when the voucher requires a donor but can be unticked; Save then turns the column back on and marks the lines that still need a donor. Fund/Class stays locked on when required | `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Journal entry grid: the duplicate and delete line buttons are skipped by Tab (still clickable with the mouse) | `src/pages/JournalVoucher/JournalVoucherPage.tsx` |
| 2026-11-20 | Journal entry: the optional column fields (project, sub project, fund/class, donor) are smaller (30px high, 12px text). Rail: the hovered pill now sits above the open fly-out menu instead of behind it, and the fly-out text starts clear of the pill | `src/styles/eact.css` |
| 2026-11-20 | Rail: the item list scrolls on its own (logo stays fixed, wheel scrolling with no visible scrollbar). The scroll box is as wide as a hovered pill so the pill is not clipped; item size now shrinks only down to 48px before scrolling | `src/styles/eact.css` |
| 2026-11-20 | Journal voucher list: the "All statuses" choice is removed from the Status filter (user). New `hideValues` option on list filters drops option values; the JV list hides "-1". The list opens on the first remaining status (Open) | `src/lists/engine.ts`, `src/lists/defs/jv.ts` |
| 2026-11-20 | HTML report viewer (JV and the other `HTMLReportViewer.aspx` reports) restyled for screen: letterhead band, left-aligned title with accent bar, key-facts box, ledger tables (header band, hairline rows, right-aligned figures, no zebra), tidy action row. Print layout is untouched. The JV lists (JV adjustments and JV approvals) now open "HTML view" inside the shell (`/app/classic/ReportsViewer/...`) so the skin applies, instead of a bare new tab. Backend unchanged | `src/styles/eact.css` (§9), `src/lists/defs/jv.ts`, `src/lists/defs/jvApprovals.ts` |
| 2026-11-20 | Reports keep opening in a new tab, now skinned: new chromeless route `/app/report/<legacy path>` (`src/pages/Report/ReportPage.tsx`) frames the legacy report with the screen skin and no menu or top bar. The JV list, JV approvals list and the journal entry screen (report after Save) open it through `reportRoute()` (`src/lib/reportRoute.ts`). This replaces the earlier in-shell "HTML view" change, which did not apply to the after-Save tab. Print and Excel export unchanged | `src/App.tsx`, `src/pages/Report/ReportPage.tsx`, `src/lib/reportRoute.ts`, `src/lists/defs/jv.ts`, `src/lists/defs/jvApprovals.ts`, `src/pages/JournalVoucher/JournalVoucherPage.tsx`, `src/styles/eact.css` |
