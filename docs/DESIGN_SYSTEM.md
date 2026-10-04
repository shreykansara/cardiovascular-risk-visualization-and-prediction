# ECG Paper Design System

Perfusion3D: ECG Paper Design Language Specification
Theme: Precise, clinical, tactile ECG paper aesthetic. Dual-theme: "Paper" (Light) and "Monitor" (Dark).

---

## 1. Design Principles

1. **ECG Paper Surface**: The page background is a pink grid (light: "Paper") or dark green grid (dark: "Monitor") with 40px major / 8px minor grid lines.
2. **Solid Panels**: All readable text and controls sit on solid `--panel` surfaces on top of the grid. No readable text ever sits directly on the grid lines.
3. **Typography**: Dual-font system:
   - **Sora** (weights 400 and 600) for all prose, headings, labels, and buttons.
   - **IBM Plex Mono** (weights 400 and 500, `font-variant-numeric: tabular-nums`) strictly for numbers, readings, units, counts, captions of numbers, and table figures.
   - Sentence case everywhere. No uppercase, no letter-spacing.
4. **Sharp Geometry**: Radius is strictly 3px (`--radius: 3px`) for panels, inputs, buttons, and report sheets. Only dots use 50% circle geometry.
5. **Zero Decoration**: No shadows, no blur, and no glows.
6. **One-Shot Motion**: One-shot animations (`wipe`, `grow`, `draw`). Panels wipe in left to right, probability bars sweep in, and heartbeat traces draw once. Nothing loops.
7. **Semantic Color**: Color is strictly reserved for risk stratification (`Low`, `Moderate`, `High`), directional impact, interactive focus, and out-of-range indicators.
8. **Risk Word Contrast Rule**: Risk category words ("Low", "Moderate", "High") are always rendered in `--ink` (never in the risk color). Only the 8px dot and the bar fill use the risk color.
9. **White Report Sheet**: The report document sheet is `#FFFFFF` with dark ink in BOTH themes.

---

## 2. Design Tokens

### Theme-Independent Tokens (`:root`)
- `--fs`: `'Sora', system-ui, sans-serif`
- `--fm`: `'IBM Plex Mono', ui-monospace, monospace`
- `--radius`: `3px`
- `--focus`: `2px solid var(--acc)`
- `--focus-offset`: `1px`
- Motion:
  - `--ease-wipe`: `cubic-bezier(.3,0,.2,1)`
  - `--ease-draw`: `cubic-bezier(.4,0,.2,1)`
  - `--stagger`: `110ms`

### Light Theme Tokens ("Paper", `:root[data-theme="light"]`)
- `--page`: `#FFF6F4`
- `--gmin`: `#F8E3DF`
- `--gmaj`: `#EFC2BA`
- `--panel`: `#FFFFFF`
- `--ink`: `#241618`
- `--mut`: `#6A5558`
- `--acc`: `#1D3F8A`
- `--onacc`: `#FFFFFF`
- `--bd`: `#E3CFCC`
- `--bds`: `#B99A96`
- `--hov`: `#F4F7FD`
- `--low`: `#2E8B57`
- `--mod`: `#B87700`
- `--high`: `#C81D3A`
- `--sheet`: `#FFFFFF`
- `--sheetink`: `#241618`
- `--sheetmut`: `#6A5558`
- `--sbd`: `#E3CFCC`

### Dark Theme Tokens ("Monitor", `:root[data-theme="dark"]`)
- `--page`: `#06100C`
- `--gmin`: `#0B1C14`
- `--gmaj`: `#153024`
- `--panel`: `#0C1A13`
- `--ink`: `#D8F5E4`
- `--mut`: `#8FB5A0`
- `--acc`: `#4CFF9A`
- `--onacc`: `#04120A`
- `--bd`: `#1D3A2A`
- `--bds`: `#3A6350`
- `--hov`: `#12281D`
- `--low`: `#3FD08A`
- `--mod`: `#FFC24D`
- `--high`: `#FF6B7A`
- `--sheet`: `#FFFFFF`
- `--sheetink`: `#241618`
- `--sheetmut`: `#6A5558`
- `--sbd`: `#E3CFCC`

---

## 3. WCAG Contrast Log (Task 1.5)

Contrast computed according to WCAG 2.1 relative luminance algorithm:
- Normal text requires ≥ 4.5:1.
- Non-text elements (graphical objects and user interface components) require ≥ 3.0:1.
- Per spec rule: Risk words are always rendered in `--ink` (never tinted with risk color); only the dot and bar use the risk color.

### Light Theme ("Paper") Contrast Table
| Pair / Element | Foreground | Background | Contrast Ratio | Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--ink` on `--panel` (text) | `#241618` | `#FFFFFF` | **17.46:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--panel` (text) | `#6A5558` | `#FFFFFF` | **6.88:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--ink` on `--page` (text) | `#241618` | `#FFF6F4` | **16.41:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--page` (text) | `#6A5558` | `#FFF6F4` | **6.47:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--onacc` on `--acc` (button text) | `#FFFFFF` | `#1D3F8A` | **9.86:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--acc` on `--panel` (link / focus) | `#1D3F8A` | `#FFFFFF` | **9.86:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--low` against `--panel` (non-text) | `#2E8B57` | `#FFFFFF` | **4.25:1** | ≥ 3.0:1 | **PASS** |
| `--mod` against `--panel` (non-text) | `#B87700` | `#FFFFFF` | **3.70:1** | ≥ 3.0:1 | **PASS** |
| `--high` against `--panel` (non-text) | `#C81D3A` | `#FFFFFF` | **5.69:1** | ≥ 3.0:1 | **PASS** |
| `--bd` against `--panel` (non-text border) | `#E3CFCC` | `#FFFFFF` | **1.49:1** | ≥ 3.0:1 | **FAIL (Sub-threshold border)** |
| `--sheetink` on `--sheet` (report text) | `#241618` | `#FFFFFF` | **17.46:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--sheetmut` on `--sheet` (report muted) | `#6A5558` | `#FFFFFF` | **6.88:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--sbd` against `--sheet` (sheet border) | `#E3CFCC` | `#FFFFFF` | **1.49:1** | ≥ 3.0:1 | **FAIL (Sub-threshold border)** |

### Dark Theme ("Monitor") Contrast Table
| Pair / Element | Foreground | Background | Contrast Ratio | Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--ink` on `--panel` (text) | `#D8F5E4` | `#0C1A13` | **15.43:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--panel` (text) | `#8FB5A0` | `#0C1A13` | **7.92:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--ink` on `--page` (text) | `#D8F5E4` | `#06100C` | **16.65:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--page` (text) | `#8FB5A0` | `#06100C` | **8.54:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--onacc` on `--acc` (button text) | `#04120A` | `#4CFF9A` | **14.67:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--acc` on `--panel` (link / focus) | `#4CFF9A` | `#0C1A13` | **13.71:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--low` against `--panel` (non-text) | `#3FD08A` | `#0C1A13` | **9.04:1** | ≥ 3.0:1 | **PASS** |
| `--mod` against `--panel` (non-text) | `#FFC24D` | `#0C1A13` | **11.15:1** | ≥ 3.0:1 | **PASS** |
| `--high` against `--panel` (non-text) | `#FF6B7A` | `#0C1A13` | **6.51:1** | ≥ 3.0:1 | **PASS** |
| `--bd` against `--panel` (non-text border) | `#1D3A2A` | `#0C1A13` | **1.44:1** | ≥ 3.0:1 | **FAIL (Sub-threshold border)** |
| `--sheetink` on `--sheet` (report text) | `#241618` | `#FFFFFF` | **17.46:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--sheetmut` on `--sheet` (report muted) | `#6A5558` | `#FFFFFF` | **6.88:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--sbd` against `--sheet` (sheet border) | `#E3CFCC` | `#FFFFFF` | **1.49:1** | ≥ 3.0:1 | **FAIL (Sub-threshold border)** |

> [!NOTE]
> Per specification instructions, token values are not modified silently. Sub-threshold non-text border pairs (`--bd` on `--panel` at 1.49:1 light / 1.44:1 dark and `--sbd` on `--sheet` at 1.49:1) are documented here and reported in the final summary.

---

## 4. Typography Scale

| Token / Class | Font Family | Size / Line-Height | Weight | Color / Variant |
| :--- | :--- | :--- | :--- | :--- |
| `type-body` | Sora (`--fs`) | 13px / 1.45 | 400 | `--ink` |
| `type-page-title` | Sora (`--fs`) | 20px | 600 | `--ink` |
| `type-report-title` | Sora (`--fs`) | 18px | 600 | `--sheetink` |
| `type-section-heading` | Sora (`--fs`) | 14px | 600 | `--ink` |
| `type-report-subheading`| Sora (`--fs`) | 15px | 600 | `--sheetink` |
| `type-label` | Sora (`--fs`) | 12px | 400 | `--mut` |
| `type-caption` | Sora (`--fs`) | 11px | 400 | `--mut` |
| `type-button` | Sora (`--fs`) | 13px | 600 | `--onacc` / `--ink` |
| `type-brand` | Sora (`--fs`) | 15px | 600 | `--ink` |
| `type-result-num` | IBM Plex Mono (`--fm`)| 40px / 1.05 | 500 | `tabular-nums`, `--ink` |
| `type-vessel-num` | IBM Plex Mono (`--fm`)| 20px | 500 | `tabular-nums`, `--ink` |
| `type-input-val` | IBM Plex Mono (`--fm`)| 14px | 400 | `tabular-nums`, `--ink` |
| `type-unit-count` | IBM Plex Mono (`--fm`)| 12px | 400 | `tabular-nums`, `--mut` |
| `type-table-num` | IBM Plex Mono (`--fm`)| 12px | 400 | `tabular-nums` |

---

## 5. Motion System

- One-shot keyframes only:
  - `wipe`: left-to-right clip-path expansion.
  - `grow`: horizontal scale from 0 to 1 for probability bars.
  - `draw`: stroke dashoffset 1 to 0 for heartbeat traces.
- Ancestor scope `.play`: runs once on page mount and new prediction render.
- No looping animations, no infinite spins, no glows, no shadows.
