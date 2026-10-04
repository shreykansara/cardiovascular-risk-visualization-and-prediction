# Clinical Paper Design System

Perfusion3D: Clinical Paper Design Language Specification
Theme: Calm, quiet, precise, trustworthy. Supports Light and Dark modes with identical structure.

---

## 1. Design Principles

1. **Light and Dark, Identical Structure**: The application supports both Light and Dark themes via the `data-theme` attribute (`"light"` or `"dark"`). The DOM hierarchy, component layouts, and clinical data representations are 100% identical across themes.
2. **Fewer Boxes**: Grouping via whitespace and hairline dividers (`border-b border-border`). No nested cards or cards-inside-cards.
3. **One Typeface**: Inter font only across all screens via `@fontsource/inter`. Monospace fonts (`JetBrains Mono`, `Roboto Mono`) are strictly prohibited in user workflows.
4. **Sentence Case Everywhere**: No ALL-CAPS, no artificial letter-spacing, and no tracked uppercase labels.
5. **Color Carries Meaning Only**: Color is strictly reserved for risk stratification (`Low`, `Moderate`, `High`), directional impact (`raises probability` / `lowers probability`), interactive focus, and validation warnings. All structural chrome is neutral canvas or panel.
6. **Zero Decoration**: No gradients, no glows, no backdrops or blurs, no drop-shadows (except dropdown overlays via `--shadow-overlay`), no emojis, and no looping or pulsing animations.
7. **Numbers Are the Hero**: Large, tabular numerals (`font-variant-numeric: tabular-nums`) aligned consistently across clinical screens.
8. **Print & PDF Light Rule**: Regardless of active screen theme (Light or Dark), all print stylesheets and PDF export paths force light theme tokens (`#FFFFFF` page, `#1A1F29` text) to produce clean, high-contrast black-on-white physical documents.

---

## 2. Design Tokens

### Theme-Independent Tokens
- `--radius`: `4px`
- `--space-4`: `4px` | `--space-8`: `8px` | `--space-16`: `16px` | `--space-24`: `24px` | `--space-32`: `32px` | `--space-48`: `48px`
- `--focus-width`: `2px` | `--focus-offset`: `2px` | `--focus`: `2px solid var(--accent)`
- `--motion-duration`: `120ms`

### Light Theme Tokens (`:root[data-theme="light"]`)
- **Surfaces**:
  - `--page`: `#FFFFFF`
  - `--panel`: `#F6F7F9`
  - `--border`: `#DDE1E7`
  - `--border-strong`: `#B8BFCA`
- **Text**:
  - `--text`: `#1A1F29`
  - `--text-muted`: `#596273`
  - `--text-faint`: `#7A8494` (Limited strictly to non-essential captions and timestamps)
- **Accent**:
  - `--accent`: `#0B5CAD`
  - `--accent-hover`: `#094A8C`
  - `--accent-subtle`: `#E8F0F9`
  - `--on-accent`: `#FFFFFF`
- **Risk Stratification**:
  - `--risk-low`: `#2A7348` | `--risk-low-bg`: `#EAF4EE`
  - `--risk-moderate`: `#8F5300` | `--risk-moderate-bg`: `#FBF0DF`
  - `--risk-high`: `#B3261E` | `--risk-high-bg`: `#FBE9E7`
- **Shadow**:
  - `--shadow-overlay`: `0 4px 12px rgba(0, 0, 0, 0.08)`

### Dark Theme Tokens (`:root[data-theme="dark"]`)
- **Surfaces**:
  - `--page`: `#12151A`
  - `--panel`: `#1A1E25`
  - `--border`: `#656971` (Adjusted to ensure ≥ 3.0:1 contrast against panel/page)
  - `--border-strong`: `#787D87` (Adjusted to ensure ≥ 4.0:1 contrast)
- **Text**:
  - `--text`: `#E6E9EE`
  - `--text-muted`: `#A3ACB9`
  - `--text-faint`: `#8791A0`
- **Accent**:
  - `--accent`: `#5AA2E8`
  - `--accent-hover`: `#7AB5EE`
  - `--accent-subtle`: `#17283B`
  - `--on-accent`: `#0B1220`
- **Risk Stratification**:
  - `--risk-low`: `#5CB884` | `--risk-low-bg`: `#14281D`
  - `--risk-moderate`: `#E0A040` | `--risk-moderate-bg`: `#2E2411`
  - `--risk-high`: `#F07D73` | `--risk-high-bg`: `#33191A`
- **Shadow**:
  - `--shadow-overlay`: `0 4px 12px rgba(0, 0, 0, 0.40)`

---

## 3. WCAG AA Contrast Ratios

### Light Theme Contrast Table
| Foreground Element | Background Element | Computed Contrast | Requirement | Status |
|---|---|---|---|---|
| Body text (`--text`: `#1A1F29`) | Canvas page (`--page`: `#FFFFFF`) | **16.51:1** | ≥ 4.5:1 | **Pass (AAA)** |
| Body text (`--text`: `#1A1F29`) | Panel surface (`--panel`: `#F6F7F9`) | **15.40:1** | ≥ 4.5:1 | **Pass (AAA)** |
| Muted text (`--text-muted`: `#596273`) | Canvas page (`--page`: `#FFFFFF`) | **6.14:1** | ≥ 4.5:1 | **Pass (AA)** |
| Muted text (`--text-muted`: `#596273`) | Panel surface (`--panel`: `#F6F7F9`) | **5.73:1** | ≥ 4.5:1 | **Pass (AA)** |
| Faint text (`--text-faint`: `#7A8494`)* | Canvas page (`--page`: `#FFFFFF`) | **3.78:1** | Non-essential* | **Pass (Restricted to non-essential captions/dates)** |
| Button text (`--on-accent`: `#FFFFFF`) | Primary button (`--accent`: `#0B5CAD`) | **6.67:1** | ≥ 4.5:1 | **Pass (AA)** |
| Focus ring (`--accent`: `#0B5CAD`) | Canvas page (`--page`: `#FFFFFF`) | **6.67:1** | ≥ 3.0:1 | **Pass (AA)** |
| Low risk word (`--risk-low`: `#2A7348`) | Low risk tint (`--risk-low-bg`: `#EAF4EE`) | **5.12:1** | ≥ 4.5:1 | **Pass (AA)** |
| Moderate risk word (`--risk-mod`: `#8F5300`) | Moderate risk tint (`--risk-mod-bg`: `#FBF0DF`) | **5.47:1** | ≥ 4.5:1 | **Pass (AA)** |
| High risk word (`--risk-high`: `#B3261E`) | High risk tint (`--risk-high-bg`: `#FBE9E7`) | **5.58:1** | ≥ 4.5:1 | **Pass (AA)** |
| Low risk dot (`--risk-low`: `#2A7348`) | Canvas page (`--page`: `#FFFFFF`) | **5.76:1** | ≥ 3.0:1 | **Pass (AA)** |
| Moderate risk dot (`--risk-mod`: `#8F5300`) | Canvas page (`--page`: `#FFFFFF`) | **6.17:1** | ≥ 3.0:1 | **Pass (AA)** |
| High risk dot (`--risk-high`: `#B3261E`) | Canvas page (`--page`: `#FFFFFF`) | **6.54:1** | ≥ 3.0:1 | **Pass (AA)** |

*\*Note on `--text-faint`: In Light Mode, `#7A8494` is strictly restricted to non-essential metadata (such as timestamps, inactive reference ranges, and separator bullets). All primary and secondary clinical text uses `--text` or `--text-muted` which both exceed 4.5:1.*

### Dark Theme Contrast Table
| Foreground Element | Background Element | Computed Contrast | Requirement | Status |
|---|---|---|---|---|
| Body text (`--text`: `#E6E9EE`) | Canvas page (`--page`: `#12151A`) | **15.03:1** | ≥ 4.5:1 | **Pass (AAA)** |
| Body text (`--text`: `#E6E9EE`) | Panel surface (`--panel`: `#1A1E25`) | **13.73:1** | ≥ 4.5:1 | **Pass (AAA)** |
| Muted text (`--text-muted`: `#A3ACB9`) | Canvas page (`--page`: `#12151A`) | **7.98:1** | ≥ 4.5:1 | **Pass (AA)** |
| Muted text (`--text-muted`: `#A3ACB9`) | Panel surface (`--panel`: `#1A1E25`) | **7.29:1** | ≥ 4.5:1 | **Pass (AA)** |
| Faint text (`--text-faint`: `#8791A0`) | Canvas page (`--page`: `#12151A`) | **5.74:1** | ≥ 4.5:1 | **Pass (AA)** |
| Faint text (`--text-faint`: `#8791A0`) | Panel surface (`--panel`: `#1A1E25`) | **5.24:1** | ≥ 4.5:1 | **Pass (AA)** |
| Button text (`--on-accent`: `#0B1220`) | Primary button (`--accent`: `#5AA2E8`) | **6.93:1** | ≥ 4.5:1 | **Pass (AA)** |
| Border hairline (`--border`: `#656971`) | Panel surface (`--panel`: `#1A1E25`) | **3.03:1** | ≥ 3.0:1 | **Pass (AA)** |
| Border hairline (`--border`: `#656971`) | Canvas page (`--page`: `#12151A`) | **3.32:1** | ≥ 3.0:1 | **Pass (AA)** |
| Strong border (`--border-strong`: `#787D87`) | Panel surface (`--panel`: `#1A1E25`) | **4.04:1** | ≥ 3.0:1 | **Pass (AA)** |
| Focus ring (`--accent`: `#5AA2E8`) | Canvas page (`--page`: `#12151A`) | **6.77:1** | ≥ 3.0:1 | **Pass (AA)** |
| Low risk word (`--risk-low`: `#5CB884`) | Low risk tint (`--risk-low-bg`: `#14281D`) | **6.40:1** | ≥ 4.5:1 | **Pass (AA)** |
| Moderate risk word (`--risk-mod`: `#E0A040`) | Moderate risk tint (`--risk-mod-bg`: `#2E2411`) | **6.74:1** | ≥ 4.5:1 | **Pass (AA)** |
| High risk word (`--risk-high`: `#F07D73`) | High risk tint (`--risk-high-bg`: `#33191A`) | **6.09:1** | ≥ 4.5:1 | **Pass (AA)** |
| Low risk dot (`--risk-low`: `#5CB884`) | Canvas page (`--page`: `#12151A`) | **7.53:1** | ≥ 3.0:1 | **Pass (AA)** |
| Moderate risk dot (`--risk-mod`: `#E0A040`) | Canvas page (`--page`: `#12151A`) | **8.08:1** | ≥ 3.0:1 | **Pass (AA)** |
| High risk dot (`--risk-high`: `#F07D73`) | Canvas page (`--page`: `#12151A`) | **6.87:1** | ≥ 3.0:1 | **Pass (AA)** |

### Token Adjustments Recorded
- `--border` (dark) adjusted from starting `#2A303A` to `#656971` to satisfy ≥ 3.0:1 contrast on panels and canvas.
- `--border-strong` (dark) adjusted from starting `#3D4552` to `#787D87` to ensure ≥ 4.0:1 contrast.
- `--risk-low` (light) adjusted from `#2E7D4F` to `#2A7348` to guarantee ≥ 5.0:1 contrast against `--risk-low-bg` (`#EAF4EE`).
- `--risk-moderate` (light) adjusted from `#B26A00` to `#8F5300` to guarantee ≥ 5.0:1 contrast against `--risk-moderate-bg` (`#FBF0DF`).

---

## 4. Typography Scale

| Style | Font Size / Line Height | Weight | Variant / Usage |
|---|---|---|---|
| **Page title** | 24px / 32px | Semibold (600) | Screen titles |
| **Section title** | 16px / 24px | Semibold (600) | Section headers with hairline rules |
| **Body text** | 14px / 22px | Regular (400) | Clinical copy and explanatory notes |
| **Label** | 13px / 20px | Medium (500) | Input field labels (`--text-muted`) |
| **Caption** | 12px / 16px | Regular (400) | Units, helper hints (`--text-muted`) |
| **Result number** | 32px / 40px | Semibold (600) | CAD probability summary (`tabular-nums`) |
| **Vessel number** | 24px / 32px | Semibold (600) | Vessel probabilities (`tabular-nums`) |
| **Table number** | 14px / 22px | Regular (400) | Data table numbers (`tabular-nums`) |

---

## 5. Component Specifications

1. **Button**:
   - `primary`: Background `--accent`, text `--on-accent`, 36px height, 14px medium font, 4px radius, no border.
   - `secondary`: Background `--page`, border 1px `--border-strong`, text `--text`, 36px height, 14px medium font, 4px radius.
   - `link`: Transparent background, text `--accent`, hover underline.
2. **TextField / NumberField**:
   - Label above in Label style (13px medium, `--text-muted`).
   - 36px height, 1px `--border` border, 4px radius, background `--page`, text `--text`.
   - Unit suffix displayed inside right edge in muted text.
   - Reference range caption shown when field is focused or value is outside range.
   - Out-of-range values display a small `--risk-moderate` dot + caption "Outside typical range (X to Y)".
3. **SegmentedChoice**:
   - Two bordered buttons; selected button has `--accent-subtle` background, `--accent` border, and `--accent` text.
4. **Section**:
   - Section heading (16px semibold) + hairline bottom border (`border-b border-border`), optional count in `--text-muted`, collapsible with 16px chevron.
5. **DataTable**:
   - Horizontal hairlines only (`border-b border-border`). Numbers right-aligned with `tabular-nums`.
6. **RiskLabel**:
   - 8px colored circular dot (`--risk-low`, `--risk-moderate`, `--risk-high`) + text word ("Low", "Moderate", "High") in `--text`.
7. **Chip**:
   - Neutral outline (`border border-border`), 12px text, used for non-manual sources and sample patient indicators.
8. **Tabs**:
   - Underline style (`border-b-2 border-accent`). No pills or button blocks.
9. **FooterDisclaimer**:
   - Slim persistent footer strip (13px, `--panel` background, hairline top border) containing the full disclaimer sentence followed by the "Model information" link.
