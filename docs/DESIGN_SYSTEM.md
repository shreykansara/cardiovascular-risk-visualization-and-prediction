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
- `--sheet`: `#FFFFFF`
- `--sheetink`: `#241618`
- `--sheetmut`: `#6A5558`
- `--sbd`: `#E3CFCC`

### Sheet-Scoped Tokens (`.sheet`, `#print-root`)
Theme-independent tokens ensuring identical presentation in both themes:
- `--s-ink`: `#241618`
- `--s-mut`: `#5E4B4E`
- `--s-bg`: `#FFFFFF`
- `--s-bd`: `#D9C3C0`
- `--s-low`: `#1F6F45`
- `--s-mod`: `#8A5A00`
- `--s-high`: `#B3152F`
- `--s-acc`: `#1D3F8A`

---

## 3. WCAG Contrast Log (Phase 1)

Contrast computed according to WCAG 2.1 relative luminance algorithm:
- Normal text requires ≥ 4.5:1 (3.0:1 for large text ≥ 24px or ≥ 18.66px bold).
- Non-text elements (inputs, button borders, dots, bars, focus outline, current-step bar) require ≥ 3.0:1 against their surface.
- Per spec rule: Risk words are always rendered in `--ink` (or `--s-ink` on report sheets), never in risk colors; only the 8px dot and bar fill use risk colors.
- Decorative hairlines (`--bd`, `--gmin`, `--gmaj`) are exempt from contrast, with no text allowed directly on the grid.

### Token Updates (Old → New)
| Theme | Token | Old Value | New Value | Contrast on Surface | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Paper | `--bds` | `#B99A96` (2.58:1) | `#A88C89` | **3.10:1** on `--panel` | **PASS (≥ 3.0:1)** |
| Monitor | `--bds` | `#3A6350` (2.63:1) | `#406E59` | **3.06:1** on `--panel` | **PASS (≥ 3.0:1)** |

### Light Theme ("Paper") Contrast Table
| Pair / Element | Foreground | Background | Contrast Ratio | Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--ink` on `--panel` (text) | `#241618` | `#FFFFFF` | **17.46:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--panel` (text) | `#6A5558` | `#FFFFFF` | **6.88:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--ink` on `--hov` (text) | `#241618` | `#F4F7FD` | **16.48:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--hov` (text) | `#6A5558` | `#F4F7FD` | **6.50:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--acc` on `--panel` (link / focus) | `#1D3F8A` | `#FFFFFF` | **9.86:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--onacc` on `--acc` (button text) | `#FFFFFF` | `#1D3F8A` | **9.86:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--bds` against `--panel` (borders) | `#A88C89` | `#FFFFFF` | **3.10:1** | ≥ 3.0:1 | **PASS** |
| `--low` against `--panel` (dot / bar) | `#2E8B57` | `#FFFFFF` | **4.25:1** | ≥ 3.0:1 | **PASS** |
| `--mod` against `--panel` (dot / bar) | `#B87700` | `#FFFFFF` | **3.70:1** | ≥ 3.0:1 | **PASS** |
| `--high` against `--panel` (dot / bar) | `#C81D3A` | `#FFFFFF` | **5.69:1** | ≥ 3.0:1 | **PASS** |

### Dark Theme ("Monitor") Contrast Table
| Pair / Element | Foreground | Background | Contrast Ratio | Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--ink` on `--panel` (text) | `#D8F5E4` | `#0C1A13` | **15.43:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--panel` (text) | `#8FB5A0` | `#0C1A13` | **7.92:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--ink` on `--hov` (text) | `#D8F5E4` | `#12281D` | **12.72:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--mut` on `--hov` (text) | `#8FB5A0` | `#12281D` | **6.53:1** | ≥ 4.5:1 | **PASS (AA)** |
| `--acc` on `--panel` (link / focus) | `#4CFF9A` | `#0C1A13` | **13.71:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--onacc` on `--acc` (button text) | `#04120A` | `#4CFF9A` | **14.67:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--bds` against `--panel` (borders) | `#406E59` | `#0C1A13` | **3.06:1** | ≥ 3.0:1 | **PASS** |
| `--low` against `--panel` (dot / bar) | `#3FD08A` | `#0C1A13` | **9.04:1** | ≥ 3.0:1 | **PASS** |
| `--mod` against `--panel` (dot / bar) | `#FFC24D` | `#0C1A13` | **11.15:1** | ≥ 3.0:1 | **PASS** |
| `--high` against `--panel` (dot / bar) | `#FF6B7A` | `#0C1A13` | **6.51:1** | ≥ 3.0:1 | **PASS** |

### Report Sheet Contrast Table (Both Themes on `--s-bg` #FFFFFF)
| Pair / Element | Foreground | Background | Contrast Ratio | Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--s-ink` on `--s-bg` (report text) | `#241618` | `#FFFFFF` | **17.46:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--s-mut` on `--s-bg` (report muted) | `#5E4B4E` | `#FFFFFF` | **8.10:1** | ≥ 4.5:1 | **PASS (AAA)** |
| `--s-low` against `--s-bg` (dot / bar) | `#1F6F45` | `#FFFFFF` | **6.14:1** | ≥ 3.0:1 | **PASS** |
| `--s-mod` against `--s-bg` (dot / bar) | `#8A5A00` | `#FFFFFF` | **5.93:1** | ≥ 3.0:1 | **PASS** |
| `--s-high` against `--s-bg` (dot / bar) | `#B3152F` | `#FFFFFF` | **6.85:1** | ≥ 3.0:1 | **PASS** |
| `--s-acc` against `--s-bg` (links / bars) | `#1D3F8A` | `#FFFFFF` | **9.86:1** | ≥ 4.5:1 | **PASS (AAA)** |

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
