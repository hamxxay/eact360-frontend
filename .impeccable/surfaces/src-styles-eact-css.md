---
version: 1
slug: "src-styles-eact-css"
primary_target: "src/styles/eact.css"
related_targets: ["src/App.tsx","src/classic/skin.ts"]
---

Scope: the whole E-ACT 360 app shell and every screen (React screens and the classic-page skin). Visitor mode: Operate. Users: accountants, owners/CEOs, FBR agents, partners doing daily entry, lists and posting. Constraints: tokens in src/styles/eact.css only; classic skin rules start with html[data-eact-shell]; keep dark mode and the theme switch; no backend change.

## Direction contract

THESIS: Intaglio read as a bank cheque book: every screen is a cheque leaf, engraved bank-green ink on a faint security-tinted ground, with the figures that matter carried on a perforated counterfoil. It refuses the category's white-cards-and-one-blue-accent ERP and the previous glass-and-gradient layer.

OWN-WORLD: Ground: pale security tint (fine two-direction pantograph line work at a whisper) on cheque white. Ink: intaglio bank green carries the rail, headings, rules and primary actions; navy for figures; a thin gold double rule marks the rail edge and section starts; VOID red only for void/rejected. Type: engraved roman capitals (Cinzel, self-hosted) for page titles, panel titles and rail groups; Inter for UI text; tabular figures everywhere. Rules are one device pixel; a double rule opens a section. Corners nearly square (3–4px). No glass, no blur, no gradient fills on surfaces.

STORY: The user recognises the paper of money and cheques, reads totals and states at a glance, and does the task with standard controls: filters, tables, forms, buttons.

FIRST VIEWPORT: Bank-green side rail (brand in engraved capitals, gold double rule on its edge, active item on cheque white); white top bar with breadcrumb and search over a single green rule; page title in engraved capitals with a plain subtitle; filter panel beside a perforated counterfoil stub carrying the list total and counts; ledger table under a double rule, status as ruled stamps, void rows struck through under a VOID stamp.

FORM: Cheque & Counterfoil, position 3 of my ordered list (assigned by the roll); seed:05578362452a205b. Raises: nothing disappears, it cancels (VOID stamps, from the ticket wallet); destructive actions isolated, outline until focused (from the developer console); one-device-pixel rules, doubles only for section starts (from the centre rail); figures in fixed cells (from the split-flap board). Signature move: the counterfoil stub, a perforated panel that carries the screen's totals (JV summary, list totals, dashboard figures).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
