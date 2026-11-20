# E-ACT 360 frontend

New React frontend for E-ACT 360. The legacy backend lives in `E:\DigitalInvoice500`; this app consumes its existing `.ashx` handlers over the same-origin login session.

## Rule: never change the backend

Do not change any backend file or backend logic in `E:\DigitalInvoice500`. This covers:

- `.aspx` and `.aspx.cs` pages
- `.ashx` handlers
- `App_Code`
- `Web.config` and `Global.asax`
- `App_Data` config
- `Bin` and packages
- stored procedures and the database

No new server endpoints, no small fixes, no refactors, and no bug or security fixes unless the user asks. Reading backend files to learn their contracts is fine.

If a backend change seems unavoidable, **stop and ask the user in detail before touching anything**. The question must state:

1. **What and where:** the exact files, methods or stored procedures, and the intended diff.
2. **Why it is unavoidable:** the frontend-only approaches considered, and why each fails.
3. **What it affects:** pages, handlers, modules, roles, data, FBR and reports, and the risk to existing screens.
4. **Rollback and testing:** how to undo the change and how to verify it.
5. **Alternatives:** any workaround that avoids the change, even an imperfect one.

Proceed only after explicit approval of that specific change. Approval for one change does not cover others.

## Design (current: Pine Emerald, 2026-11-20. Intaglio and Executive Slate below are history)

**Current direction (user decision 2026-11-20): Pine Emerald** (https://21st.dev/@serafimcloud/themes/pine-emerald). Flat, border-only surfaces; emerald primary `#0AA347`, deep-navy secondary `#353957`, ground `#F9FAFC` (dark `#1E2036`), Inter, 6px radius. Tokens live in `src/styles/eact.css` section 2. Use `--accent-ink` for small accent text. It replaces Intaglio (no Cinzel, no cheque-book motifs).

**Category standard** direction with the **Executive Slate** colour scheme (accent `#1E293B`).
The slate accent is close to body text, so state never relies on accent colour alone
(active items also get an indicator bar, links get weight and underline on hover).

**Previous direction (superseded by Pine Emerald, 2026-11-20): Intaglio, read as a bank cheque book.** It replaced
Executive Slate and the colour layer below. Bank-green ink on a cheque-paper ground with a faint security
tint, navy figures, gold rule, VOID red; Cinzel engraved capitals for titles; one-pixel rules, double rules
open sections; void records stay visible under a VOID stamp; totals live on a perforated counterfoil stub.
Direction contract: `.impeccable/surfaces/src-styles-eact-css.md`; the shipped system is in `DESIGN.md`. The notes below are history.

**Colour layer (superseded 2026-11-20):** on top of Executive Slate, a three-hue palette
(emerald, sky, indigo only; tokens `--c-*`, `--grad-brand`, `--grad-outline`,
`--grad-wash`, `--grad-spectrum`, `--focus-ring`) gives spectrum outlines, gradient primary buttons and
multi-hue washes (section 6 "Colour layer" and the end of section 9). Status colours (ok / wait / bad)
keep their meaning; extra hues only decorate. Small text in a hue uses `--c-emerald-ink`-style dark tones.

## Styling: one file

**All styling lives in `src/styles/eact.css`** (fonts, tokens, base, splash, layout, components, pages, classic skin).
- No `.module.css` files, no `<style>` blocks, no static inline `style={{…}}`. Inline `style` only passes data as a
  CSS variable (`--h`, `--pct`, `--w`, `--r`), and the rule that uses it lives in `eact.css`.
- App classes start with `e-` (`.e-sidebar-link`, `.e-btn-primary`); add new ones in the matching section.
- Colours only from the tokens in section 2; never hard-code a colour.
- Section 9 (classic skin) rules must start with `html[data-eact-shell]`; `src/classic/skin.ts` injects
  the fonts, tokens and section 9 into classic pages from the same file.

## Running

- `npm run dev`: http://localhost:5173/app/ ; proxies every path outside `/app` to the legacy site (`LEGACY_URL`, default http://localhost:9575). Sign in at http://localhost:5173/app/login (new screen) or /Login.aspx (classic)
- `.env` belongs in this folder (`E:\DigitalInvoice500-frontend`), never in the backend folder
- Tables: follow the "ledger" design in `docs/FRONTEND_CONVERSION.md` §7c-2 (pinned header and first column, 11px uppercase header band, 13px cells, numbers right-aligned, ruled status stamps (void rows struck through under a VOID stamp), actions on hover); use `DataTable` (`align: 'right'` for numbers/money/dates, `rowActions` for the ··· menu) + `FilterBar`/`SearchField`
- Loading states: use `components/Loaders` (Skeleton shaped like the content, Button `loading`); never a bare "Loading…" text
- Switch a legacy screen to its React replacement by adding it to `MIGRATED` in `src/app/nav.ts`; remove the entry to roll back
- Every other legacy page opens inside the shell at `/app/classic/<path>` with the skin from section 9 of `src/styles/eact.css`
- `npm run build`: type-check and build to `dist/`
- `VITE_USE_MOCKS=true` (default) uses sample data from `src/mocks` until each handler mapping is verified

## Documentation

Record every change in the change log of `docs/FRONTEND_CONVERSION.md`.

## References

- `PRODUCT.md`: product context
- `design-options/standard/`: reference mocks for the chosen design
- `docs/FRONTEND_CONVERSION.md`: plan, decisions and change log
- `docs/E-ACT 360 Frontend Change Documentation.docx`: overall change documentation
