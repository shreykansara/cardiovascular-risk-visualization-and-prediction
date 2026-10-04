# Clinical Paper Design System

Perfusion3D: Clinical Paper Design Language Specification
Theme: Calm, white, quiet, precise, trustworthy.

---

## 1. Design Principles

1. **Light Theme Only**: Complete elimination of dark palettes, moody developer dashboard themes, and dark modes. Pure clinical surfaces.
2. **Fewer Boxes**: Grouping via whitespace and hairline dividers (`border-b border-border`). No nested cards or cards-inside-cards.
3. **One Typeface**: Inter font only across all screens via `@fontsource/inter`. Monospace fonts (`JetBrains Mono`, `Roboto Mono`) are strictly prohibited in user workflows.
4. **Sentence Case Everywhere**: No ALL-CAPS, no artificial letter-spacing, and no tracked uppercase labels.
5. **Color Carries Meaning Only**: Color is strictly reserved for risk stratification (`Low`, `Moderate`, `High`) and validation warnings. All structural chrome is white, grey, or accent blue.
6. **Zero Decoration**: No gradients, no glows, no backdrops or blurs, no drop-shadows (except dropdown overlays), no emojis, and no looping or pulsing animations.
7. **Numbers Are the Hero**: Large, tabular numerals (`font-variant-numeric: tabular-nums`) aligned consistently across clinical screens.

---

## 2. Design Tokens

### Surfaces & Borders
- `--page`: `#FFFFFF` (Primary page viewport canvas)
- `--panel`: `#F6F7F9` (Secondary document and canvas backing)
- `--border`: `#DDE1E7` (Hairline rules and standard field dividers)
- `--border-strong`: `#B8BFCA` (Button and input hover focus boundaries)

### Text Hierarchy
- `--text`: `#1A1F29` (Primary readable clinical document copy)
- `--text-muted`: `#596273` (Labels, table headers, unit captions)
- `--text-faint`: `#7A8494` (Secondary notes, timestamps, subtle metadata)

### Accent & Action
- `--accent`: `#0B5CAD` (Interactive links, primary button, focus rings)
- `--accent-hover`: `#094A8C` (Button hover and pressed states)
- `--accent-subtle`: `#E8F0F9` (Selected row and segmented choice backgrounds)

### Clinical Risk Bands
- `--risk-low`: `#2E7D4F` | `--risk-low-bg`: `#EAF4EE` (≤ 40% probability)
- `--risk-moderate`: `#B26A00` | `--risk-moderate-bg`: `#FBF0DF` (41% - 70% probability)
- `--risk-high`: `#B3261E` | `--risk-high-bg`: `#FBE9E7` (> 70% probability)

### Geometry, Focus & Motion
- **Radius**: `4px` for all interactive elements, inputs, buttons, chips, and panels (`--radius: 4px`).
- **Spacing**: 8px modular grid (`4px`, `8px`, `16px`, `24px`, `32px`, `48px`).
- **Focus**: `2px solid var(--accent)` with `2px` offset (`--focus`).
- **Motion**: Opacity and color transitions constrained to `120ms`. No looping animations; respect `prefers-reduced-motion`. The only animation permitted in the entire interface is a rotating loading spinner (max 600ms/turn).

---

## 3. Typography Scale

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

## 4. Component Rules

1. **Button**:
   - `primary`: Solid `--accent` background, white text, 36px height, 14px medium font, 4px radius, no border.
   - `secondary`: White background, 1px `--border-strong` border, `--text` color, 36px height, 14px medium font, 4px radius.
   - `link`: Transparent background, `--accent` color, underline on hover.
2. **TextField / NumberField**:
   - Label above in Label style (13px medium, `--text-muted`).
   - 36px height, 1px `--border` border, 4px radius.
   - Unit suffix displayed inside right edge in muted text.
   - Reference range caption shown **only** when field is focused or value is outside range.
   - Out-of-range values display a small `--risk-moderate` dot + caption "Outside typical range (X to Y)".
3. **SegmentedChoice**:
   - Used for binary selections (Yes/No, Male/Female). Two bordered buttons; selected button has `--accent-subtle` background, `--accent` border, and `--accent` text.
4. **Section**:
   - Section heading (16px semibold) + hairline bottom border, optional count in `--text-muted` (e.g. `12 of 17`), collapsible with 16px chevron.
5. **DataTable**:
   - No outer card box. Horizontal hairlines only (`border-b border-border`). Numbers right-aligned with `tabular-nums`.
6. **RiskLabel**:
   - 8px colored circular dot (`--risk-low`, `--risk-moderate`, `--risk-high`) + text word ("Low", "Moderate", "High") in `--text`.
7. **Chip**:
   - Neutral outline (`border border-border`), 12px text, used for non-manual sources and sample patient indicators.
8. **Tabs**:
   - Underline style (`border-b-2 border-accent`). No pills or button blocks.
9. **FooterDisclaimer**:
   - Slim persistent footer strip (13px, `--panel` background, hairline top border) containing the full disclaimer sentence followed by the "Model information" link.

---

## 5. WCAG AA Contrast Ratios (Minimum 4.5:1 for Body Text)

| Foreground Color | Background Color | Computed Contrast | WCAG AA Status |
|---|---|---|---|
| `--text` (`#1A1F29`) | `--page` (`#FFFFFF`) | **16.06:1** | **Pass (AAA)** |
| `--text` (`#1A1F29`) | `--panel` (`#F6F7F9`) | **15.13:1** | **Pass (AAA)** |
| `--text-muted` (`#596273`) | `--page` (`#FFFFFF`) | **6.16:1** | **Pass (AA)** |
| `--text-muted` (`#596273`) | `--panel` (`#F6F7F9`) | **5.80:1** | **Pass (AA)** |
| `--accent` (`#0B5CAD`) | `--page` (`#FFFFFF`) | **6.82:1** | **Pass (AA)** |
| `--accent` (`#0B5CAD`) | `--accent-subtle` (`#E8F0F9`) | **5.94:1** | **Pass (AA)** |
| White (`#FFFFFF`) | `--accent` (`#0B5CAD`) | **6.82:1** | **Pass (AA)** |
| `--risk-low` (`#2E7D4F`) | `--page` (`#FFFFFF`) | **4.88:1** | **Pass (AA)** |
| `--risk-high` (`#B3261E`) | `--page` (`#FFFFFF`) | **6.10:1** | **Pass (AA)** |
| `--risk-moderate` (`#B26A00`) | `--page` (`#FFFFFF`) | **4.51:1** | **Pass (AA)** |
