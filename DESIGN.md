---
name: E-ACT 360
description: Accounting, payroll and FBR compliance workspace, engraved like a bank cheque book.
colors:
  bank-green: "#0F3D2E"
  bank-green-hover: "#175C45"
  bank-green-wash: "#E3ECE5"
  cheque-cream: "#F7F3E3"
  figure-navy: "#161B2E"
  rail-gold: "#C9A227"
  guilloche-gold: "#D8C8A0"
  void-red: "#B42318"
  ok-green: "#15803D"
  wait-amber: "#B45309"
  ground-grey: "#F4F5F8"
  ground-wash: "#EEF0F5"
  card-white: "#FFFFFF"
  ink: "#13261F"
  ink-muted: "#43564E"
  ink-faint: "#56695F"
  hairline: "#E1E5EC"
  row-line: "#ECEEF3"
  control-line: "#B9C2D0"
  rail-ink: "#D5E4DB"
  dark-ground: "#0C1512"
  dark-card: "#12201A"
  dark-ink: "#E5EEE8"
  dark-accent: "#86C9A8"
  dark-rail: "#0A231A"
  dark-figure: "#E8ECF6"
typography:
  display:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "clamp(40px, 5vw, 64px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontFeature: "lnum, tnum"
  headline:
    fontFamily: "Cinzel, Times New Roman, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.04em"
  title:
    fontFamily: "Cinzel, Times New Roman, serif"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "0.06em"
  figure:
    fontFamily: "Libre Caslon Text, Georgia, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontFeature: "lnum, tnum"
  body:
    fontFamily: "Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.08em"
  stamp:
    fontFamily: "Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  hairline: "2px"
  control: "3px"
  menu: "8px"
  panel: "10px"
  pill: "999px"
spacing:
  gutter: "32px"
  gutter-phone: "16px"
  stack: "20px"
  panel-pad: "18px 20px"
  hero-pad: "28px 30px 24px"
  control-height: "38px"
  rail-width: "248px"
  topbar-height: "60px"
components:
  button-primary:
    backgroundColor: "{colors.bank-green}"
    textColor: "{colors.cheque-cream}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.bank-green-hover}"
    textColor: "{colors.cheque-cream}"
  button-default:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "38px"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "38px"
  panel:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.panel}"
    padding: "18px 20px"
  figure-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.figure-navy}"
    typography: "{typography.figure}"
    rounded: "{rounded.panel}"
    padding: "18px 20px"
  counterfoil:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.figure-navy}"
    rounded: "{rounded.panel}"
    padding: "14px 18px 14px 30px"
  stamp:
    textColor: "{colors.ok-green}"
    typography: "{typography.stamp}"
    rounded: "{rounded.hairline}"
  stamp-void:
    textColor: "{colors.void-red}"
    rounded: "{rounded.hairline}"
  rail:
    backgroundColor: "{colors.bank-green}"
    textColor: "{colors.rail-ink}"
    width: "248px"
  rail-item-active:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.bank-green}"
    rounded: "{rounded.hairline}"
---
> **Superseded 2026-11-20:** the visual direction is now **Pine Emerald** (21st.dev @serafimcloud/pine-emerald): flat border-only surfaces, emerald `#0AA347`, navy `#353957`, Inter. The tokens in `src/styles/eact.css` section 2 are the source of truth. The Intaglio description below is history until this file is re-recorded.


# Design System: E-ACT 360

## Overview

**Creative North Star: "Cheque & Counterfoil"**

Every screen is a leaf from a bank cheque book. Engraved bank-green ink carries the rail, titles, rules and primary actions; the figures that matter are printed in a bold Caslon serif in near-black navy; the screen's totals sit on a perforated counterfoil stub beside the work. The world is Intaglio read through banking paper, but the ground stays a plain cool grey: the user chose a calm, legible desk over a security-tinted sheet, and the money cues live in the ink, the lettering, the rosette and the stub, not in pattern noise.

Density is operational. Accountants, owners and FBR agents enter vouchers, filter lists and post invoices all day, so controls stay standard (fields, selects, tables, buttons) and the world sits on top of them as lettering, rules and stamps. Nothing disappears: a voided record stays in the ledger, struck through, under a rotated VOID stamp. The same world is injected into 971 legacy WebForms pages through the classic skin, so every rule here must be expressible as a reskin of Bootstrap panels, labels and DataTables as well as React components.

Confirmed rejections: the white-cards-and-one-blue-accent ERP, the earlier Executive Slate scheme and its colour/glass layer, glass, blur and gradient fills, a security-tint pattern on the ground, and labels stacked above page titles.

**Key Characteristics:**
- Bank-green rail (248px) with a gold double rule on its right edge and engraved Cinzel group names in gold.
- Plain cool-grey ground; white panels in one hairline outline with gently rounded corners (10px).
- Engraved roman capitals (Cinzel) for page, panel and rail titles only; Inter for everything you read or type.
- Big bold Libre Caslon figures with a lighter, smaller currency; tabular lining numerals everywhere.
- One perforated counterfoil stub per screen carries its totals.
- Status as ruled uppercase stamps, never filled pills; VOID in red, rotated, records kept visible.
- A pale-gold guilloché rosette bleeds off the right edge of the dashboard's lead widgets only.
- Ink-dark green-black dark mode with the same structure.

## Colors

Two inks on cheque paper: bank green for structure and action, navy for money; gold is engraving, red is cancellation.

### Primary
- **Intaglio Bank Green** (#0F3D2E): the rail fill, page and panel titles, the one-pixel rule under the top bar and table header band, the double rule under section heads, primary buttons, links, focus rings (as a 22% mix), the counterfoil perforation and active rail text. Hover deepens to **Engraver's Green** (#175C45). Its pale **Green Wash** (#E3ECE5) is the avatar and ghost-button hover tint.
- **Cheque Cream** (#F7F3E3): text on bank green: primary button labels, the rail brand, strong rail text.

### Secondary
- **Figure Navy** (#161B2E): every amount: figure cards, hero figure, counterfoil figures, right-aligned number cells in ledgers. Never used for prose.

### Tertiary
- **Rail Gold** (#C9A227): engraved gold on the green rail only: the double rule on the rail's edge, rail group names, the active item's indicator bar, the "new" tag, the sample-company note. It is not text-safe on white.
- **Guilloché Gold** (#D8C8A0): the rosette's stroke and nothing else; decorative, never carries information.
- **VOID Red** (#B42318): VOID stamps, struck-through void rows, invalid field borders, "down" change lines, the Difference cell when a voucher does not balance.

### Neutral
- **Cool Desk Grey** (#F4F5F8): the page ground and the table header band. **Desk Wash** (#EEF0F5) is the soft rule and empty meter track.
- **Cheque White** (#FFFFFF): panels, cards, the top bar, the active rail item.
- **Green-Black Ink** (#13261F): body and table text. **Muted Ink** (#43564E) for subtitles, labels and table headers; **Faint Ink** (#56695F) for placeholders and quiet icons.
- **Hairline Grey** (#E1E5EC): panel outlines and internal dividers. **Row Line** (#ECEEF3) between ledger rows. **Control Line** (#B9C2D0) on field and default-button borders, shifting toward green on hover.
- **Rail Ink** (#D5E4DB): resting rail link text on bank green.

### Dark mode
The ink-dark cheque: **Green-Black Paper** (#0C1512) ground, **Night Card** (#12201A) panels, **Pale Ink** (#E5EEE8) text, **Engraved Mint** (#86C9A8) replaces bank green as the accent, the rail deepens to #0A231A, figures turn to **Moon Navy** (#E8ECF6), and the rosette dims to a bronze stroke. The active rail item takes its own cream-mixed fill because white is too far from the dark rail. Status inks lighten to stay legible; structure does not change.

### Named Rules
**The Two Inks Rule.** Green is for structure and action, navy is for money. An amount is never green, and a title is never navy.

**The Gold Belongs to Engraving Rule.** Rail gold appears only on the green rail and guilloché gold only in the rosette. Neither carries text on white.

**The Cancel, Don't Delete Rule.** VOID red marks cancellation and rejection only; void records stay in the list, struck through at 70% red, with the stamp left unstruck.

**The Not-By-Colour-Alone Rule.** The accent sits close to body ink, so state never relies on it: the active rail item also gets a white fill and a gold bar, links are bold and underline on hover, and balance states carry words ("No lines yet", "Out by …") beside their colour.

## Typography

**Display Font:** Libre Caslon Text (with Georgia, serif), figures only
**Engraved Font:** Cinzel (with Times New Roman, serif), titles only
**Body Font:** Inter (with system-ui, Segoe UI, sans-serif)

All three are self-hosted from @fontsource so the app works offline.

**Character:** Cinzel's engraved capitals print the cheque's lettering; Caslon prints the amounts like a banknote's numerals; Inter does all the reading and typing, so the world never slows a form down.

### Hierarchy
- **Display** (Caslon 700, clamp 40–64px, 1.05): the one headline figure per dashboard (Cash position). Its currency prefix is Caslon 400 at 0.42em in muted ink.
- **Headline** (Cinzel 700, 26px, 22px on phones, +0.04em, bank green): page titles, with a plain Inter subtitle below in muted ink.
- **Title** (Cinzel 700, 15px, +0.06em, bank green): panel and card titles, section heads in classic pages, the sign-in heading. Rail group names use Cinzel 600 at +0.12em in rail gold.
- **Figure** (Caslon 700, 26px on figure cards, 24px on counterfoil cells, 20px in hero breakdowns; navy, lining tabular numerals).
- **Body** (Inter 400, 14px, 1.5, tabular numerals on by default): everything read or typed. Ledger cells 13px.
- **Label** (Inter 600, 12px, +0.08em, uppercase, muted ink): figure-card labels (fixed to two lines so figures share a baseline), counterfoil cell labels, the hero label (13px). Ledger header band 11px uppercase.
- **Stamp** (Inter 700, 11px, +0.06em, uppercase): status stamps. The VOID stamp alone switches to Cinzel at +0.14em.

### Named Rules
**The Engraved Titles Only Rule.** Cinzel names things (page, panel, rail group, counterfoil label, sign-in, VOID). It never sets body text, figures, buttons or field values.

**The Caslon Is Money Rule.** Libre Caslon sets amounts and counts on figure cards, the hero and the counterfoil. Ledger table numbers stay in Inter, right-aligned and tabular.

**The Bare Title Rule.** No label, kicker or eyebrow sits above a page title. The title is the first line; context goes in the subtitle or the breadcrumb.

## Layout

A fixed shell: the 248px bank-green rail on the left, a 60px white top bar (breadcrumb, search, theme, account) over one bank-green rule, and the content column with 32px side gutters (16px on phones), 28px top padding and a 20px vertical stack between blocks. Below 960px the rail becomes an overlay drawer behind a dim scrim; below 720px header actions wrap, the full-screen control hides and the counterfoil's three cells stack.

List screens open with a filter panel beside the counterfoil stub (the stub keeps 260–340px and drops below the filters under 1100px), then the ledger table. The dashboard runs a row of figure cards, the Cash position hero full-width, a second row of figure cards, then charts. Forms are a single column of panels with the counterfoil carrying totals above the entry table. Tables follow the ledger convention: pinned header and first column, numbers right-aligned, actions on row hover, a 70vh scroll area.

## Elevation & Depth

Paper on a desk: mostly flat, with one quiet card shadow so white panels lift just off the grey ground. Depth increases only in response to hover on figure cards and generic cards, and for floating layers (menus, search results, classic modals). No glass, no blur, no gradient fills.

### Shadow Vocabulary
- **Paper rest** (`box-shadow: 0 1px 0 rgba(15,61,46,.06), 0 3px 10px -6px rgba(15,61,46,.14)`): every panel, card, figure card, hero and counterfoil at rest.
- **Paper lift** (`box-shadow: 0 14px 30px -12px rgba(15,61,46,.28), 0 2px 6px rgba(15,61,46,.08)`): hover on cards and figure cards; menus, the search result list, classic modals.
- **Pinned column edge** (`box-shadow: 4px 0 12px -2px rgba(0,0,0,.06)`): the ledger's pinned first column while scrolling.

In dark mode both shadows switch to black at higher opacity.

### Named Rules
**The Green-Tinted Shadow Rule.** Shadows are tinted with bank green, never neutral grey or coloured glow, and never offset hard.

## Shapes

Gently rounded panels (10px) on a ruled world: the corners stay soft per the user's widget reference, while everything inside is drawn with one-pixel lines. Controls and buttons are nearly square (3px); stamps, rail items and the logo tile are square-cut (2px); menus 8px. Fully round shapes are reserved for the avatar and a few legacy tags.

Rules carry the engraving: one device pixel for dividers and outlines, a 3px double rule only where a section opens (under panel heads, on the rail's edge), and a 2px dotted perforation down the left of the counterfoil.

## Components

### Buttons
Standard and quiet; the world shows in colour, not in shape.
- **Shape:** nearly square (3px), 38px tall, 14px side padding, Inter 600.
- **Primary:** solid bank green with cheque-cream text, no glow; hover deepens to Engraver's Green.
- **Default:** white with a control-line border that shifts toward green on hover.
- **Ghost:** transparent with green text, green-wash fill on hover.
- **Focus:** 2px bank-green outline at 2px offset, or a 3px green focus ring on fields.

### Status stamps
- **Style:** transparent fill, 1px border in the text colour, square-cut (2px), Inter 700 11px uppercase at +0.06em. Inks come from the status pair (approved green, open amber, rejected red, processed neutral).
- **VOID:** red, 2px border, Cinzel at +0.14em, rotated −4deg; the row behind it is struck through but the stamp is not.
- **Classic pages:** Bootstrap labels and badges reskin to the same stamp.

### Cards / Panels
- **Corner Style:** 10px.
- **Background:** cheque white on the grey ground.
- **Shadow Strategy:** paper rest, paper lift on hover (see Elevation).
- **Border:** one hairline-grey pixel.
- **Internal Padding:** 18px 20px.
- **Heads:** Cinzel title in bank green over a 3px double green rule.

### Figure cards
Tracked uppercase Inter label (two lines reserved) with a quiet unboxed icon, a bold Caslon navy figure, then a state line: a ruled stamp with a muted note, or a square-ended meter in the state colour. The Sales tax payable and Receivables cards carry a small rosette entering from the right edge; the Receivables meter stops short of it.

### Inputs / Fields
- **Style:** white, 1px control-line border, 3px corners, 38px tall.
- **Focus:** border turns bank green with a 3px green focus ring; caret is bank green.
- **Error:** border turns VOID red.
- **Keyboard:** Enter moves to the next field; the last field keeps its own Enter (Credit saves the line). On classic forms Tab skips helper icons and links.

### Navigation
The bank-green rail: Cinzel brand in cream over a thin gold rule, gold Cinzel group names, rail-ink links (Inter 500) with a 10% cream hover. The active item is a white fill with green bold text plus a gold indicator bar at the rail's edge; in dark mode it takes a cream-mixed fill instead. The top bar is white over one bank-green rule, with breadcrumb, Ctrl K search and quiet square icon buttons.

### Ledger table
11px uppercase header band on the grey ground, ruled underneath in bank green; 13px cells divided by row lines; numbers right-aligned in navy tabular figures; pinned header and first column. Entry rows sit in the table foot; the row being edited carries a 3px green inset bar on its pinned cell.

### Counterfoil stub (signature)
One per screen, carrying that screen's totals: a white panel (10px, hairline, paper rest) with a 2px dotted green perforation 13px from its left edge. Inside: a Cinzel label at 11px +0.12em, a Caslon figure, and a band of uppercase counts under a hairline that wraps between items, never inside one. On the voucher form it splits into three figure cells (Total debit, Total credit, Difference) divided by hairlines; only Difference carries state colour.

### Cash position hero and guilloché rosette
One headline widget per dashboard: Display figure with a light currency, a state-coloured change line, and a breakdown grid under a hairline that stops clear of the rosette. The rosette is an SVG of rotated ellipses and concentric rings in guilloché gold, 1px non-scaling strokes, aria-hidden, bleeding off the right edge (440px on the hero, 250px on small cards).

## Do's and Don'ts

### Do:
- **Do** take every colour from the tokens in `src/styles/eact.css` section 2, and keep the dark set in step with the light one.
- **Do** set page, panel and rail titles in Cinzel and every amount on cards, hero and counterfoil in bold Libre Caslon with lining tabular numerals.
- **Do** put the screen's totals on one counterfoil stub, and only one per screen.
- **Do** keep void records visible: strike the row in red at 70% and leave the rotated VOID stamp unstruck.
- **Do** open sections with a 3px double rule and draw everything else with one-pixel hairlines.
- **Do** give state a second signal besides the accent: a fill, a bar, weight, an underline or words.
- **Do** reskin legacy pages through section 9 rules that start with `html[data-eact-shell]`, using the same tokens.

### Don't:
- **Don't** put a security-tint or pantograph pattern on the ground; it stays plain cool grey (#F4F5F8).
- **Don't** place a label, kicker or eyebrow above a page title.
- **Don't** use glass, backdrop blur or gradient fills on any surface.
- **Don't** render status as filled pastel pills; status is a ruled stamp.
- **Don't** spread the guilloché rosette beyond the Cash position hero and the Sales tax payable and Receivables cards, or let it sit under text or a meter.
- **Don't** set gold text on white; gold is for the rail and the rosette.
- **Don't** colour amounts green or titles navy.
- **Don't** delete or hide a voided or rejected record from a list.

## Colour schemes (added 2026-11-20, user request)

Five engraving inks, chosen per browser from the top-bar picker: **Bank green** (default, the palette above), **Banker's navy** `#1B2F5B`, **Oxblood** `#6B1E2C`, **Graphite** `#2B2F36`, **Indigo** `#312E81`. A scheme replaces only the accent family, the rail (`--rail-*`) and the focus ring; status colours (ok / wait / bad / void), the ground, figures and the rosette gold never change. In dark mode the non-green schemes use a neutral ink-dark ground. Tokens: `src/styles/eact.css` section 2, `html[data-eact-scheme=…]`.
