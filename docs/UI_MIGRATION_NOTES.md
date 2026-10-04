# UI Migration Notes: Clinical Paper to ECG Paper Design Language

## 1. Design Tokens and Stylesheets (`apps/web/src/design/` and CSS files)

| File | Status | Notes |
| :--- | :--- | :--- |
| `apps/web/src/design/tokens.css` | **Replace** | Replace old Clinical Paper tokens with exact ECG Paper tokens (light: "Paper", dark: "Monitor", theme-independent tokens). |
| `apps/web/src/design/grid.css` | **New / Add** | ECG 40px/8px dual-grid system for `.ecg-grid` root and Predict overlay. |
| `apps/web/src/design/motion.css` | **New / Add** | One-shot keyframes (`wipe`, `grow`, `draw`), `.play` ancestor scope, reduced-motion overrides. |
| `apps/web/src/index.css` | **Replace** | Replace Inter with Sora and IBM Plex Mono fonts; remove old Clinical Paper reset/styles; integrate tokens, grid, motion, and base styles. |

---

## 2. UI Components (`apps/web/src/components/ui/`)

| Component | Status | Notes |
| :--- | :--- | :--- |
| `Panel.tsx` (`.pn`) | **New / Add** | Base panel with `--panel` background, 1px `--bd`, 3px radius, 12px 14px padding, no shadow. |
| `Button.tsx` | **Restyle** | Restyle to 36px height, 3px radius, Sora 13px/600, primary (`--acc`, hover opacity 0.88), secondary (`--panel` with `--bds` border), `--focus` outline. |
| `Field.tsx` / `NumberField.tsx` / `TextField.tsx` | **Restyle / Replace** | Label 12px `--mut` (3px gap), input wrapper 34px, 1px `--bds`, 3px radius, transparent input (mono 14px `--ink`), unit text (mono 12px `--mut`), caption with amber dot for out-of-range, focus-within ring. |
| `Section.tsx` / `CollapsibleSection.tsx` | **Restyle** | Header flex space-between baseline, 14px/600 title, count in mono 12px `--mut` ("5 of 5"), 16px chevron, 1px `--bd` bottom border. |
| `RiskLabel.tsx` | **Restyle** | 8px round dot in risk color + word in Sora 12px/600 `--ink` (risk words are always `--ink`, never tinted). |
| `Bar.tsx` | **New / Add** | 6px height probability bar with `--bd` track, risk color fill, 10% tick overlay, moderate/high marker lines. Thin variant 4px for factor contributions. |
| `Tabs.tsx` | **Restyle** | Underline style tabs: 18px gap, no button background, 13px `--mut`, active `--ink` 600 with 2px `--acc` bottom border. |
| `SegmentedChoice.tsx` | **Restyle** | 34px height, outer corners 3px radius only, 1px `--bds` border, selected state `--acc` border/text with `--hov` background. |
| `Select.tsx` | **Restyle** | Match 34px height, 1px `--bds` border, 3px radius, `--focus` outline. |
| `Checkbox.tsx` | **Restyle** | 3px radius, `--bds` border, accent color `--acc`, `--focus` outline. |
| `Skeleton.tsx` | **Restyle** | Static block, `--bd` background, 3px radius, no shimmer/animation. |
| `Trace.tsx` | **New / Add** | Inline ECG SVG heartbeat icon ("0 0 120 22", `pathLength="1"`, stroke `--acc`). |
| `Chip.tsx` | **Restyle** | Neutral outline chip, 11px, 3px radius (for source chips like "Extracted", "Unverified"). |
| `DataTable.tsx` | **Restyle** | Clean table with `--sheetmut` headers, `--sbd` borders, Sora first column, IBM Plex Mono for numeric columns. |
| `FooterDisclaimer.tsx` | **Restyle** | Normal flow footer, 11px `--mut`, `--panel` background, 1px `--bd` top border, underlined model-info link. |
| `index.ts` | **Restyle** | Update UI exports to include `Panel`, `Bar`, `Trace`, etc. |

---

## 3. Application Pages & Views (`apps/web/src/pages/` and layouts)

| Page / View | Status | Notes |
| :--- | :--- | :--- |
| `WizardLayout.tsx` | **Restyle** | Full-page shell with `.ecg-grid` on root, 1200px container, header with Brand + Trace + Theme Select + Back link + Step text, 3px 4-segment progress rule, flow footer. |
| `WelcomePage.tsx` (Step 1) | **Restyle** | Single column max-width 640px inside one Panel, 20px/600 title, product sentence, disclaimer box, checkbox, Start button. Mounts with `play`. |
| `DataEntryPage.tsx` (Step 2) | **Restyle** | Wrap entire body in ONE Panel (deliberate deviation). 3-col grid, out-of-range indicators, sticky bottom bar with count, Predict button. Predict overlay with 1500ms ECG trace transition. |
| `ResultsPage.tsx` (Step 3) | **Restyle** | Two-column grid (5fr : 6fr). Left: Panel with 3D canvas unchanged + 3-column legend. Right: CAD probability Panel, Vessel rows Panel with selection & trace, Factors panel with thin Bars, Create reports button. |
| `ReportsPage.tsx` (Step 4) | **Restyle** | Top Panel band with Tabs & action buttons (deliberate deviation). White `--sheet` document (max 720px) in both themes. Strict 7-section layout, mono numbers, clean tables. Print light token enforcement. |
| `ModelInfoPage.tsx` | **Restyle** | Single Panel container, technical evaluation metrics, feature groupings, leakage exclusions in sheet-styled tables. |
| `DesignSystemPage.tsx` (`/design-system`) | **Replace** | Dev-only side-by-side showcase of Paper (Light) and Monitor (Dark) themes with all tokens, type scale, and base components. |
