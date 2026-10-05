# Design Audit: Legacy Hackathon Visual Elements & Artifacts
**Perfusion3D Design System Migration (Phase C)**  
*Date: October 4, 2026*  
*Target: Clinical Decision-Support UI Rebuild*

---

## 1. Executive Summary
This audit catalogues every CSS custom class, hardcoded hex color, gradient, box-shadow glow, animation, and glassmorphic surface across `apps/web/src` prior to the clinical design system migration.

---

## 2. CSS Custom Classes & Utilities (`apps/web/src/index.css`)

### 2.1 Surfaces & Glassmorphism
- `.glass-panel`: `background-color: rgba(8, 12, 20, 0.65); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 16px 40px 0 rgba(0, 0, 0, 0.5);`
- `.ultra-glass`: `background-color: rgba(5, 7, 11, 0.52); backdrop-filter: blur(28px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 48px 0 rgba(0, 0, 0, 0.65);`
- `.ultra-glass-pill`: `background-color: rgba(8, 12, 20, 0.6); backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45);`
- `.glass-card`: `background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(12px); border-radius: 0.875rem; hover: transform scale(1.015);`
- `.glass-btn`: `background-color: rgba(255, 255, 255, 0.04); border-radius: 9999px;`

### 2.2 Colored Glows
- `.neon-glow-cyan`: `box-shadow: 0 0 16px -2px rgba(6, 182, 212, 0.45);`
- `.neon-glow-rose`: `box-shadow: 0 0 16px -2px rgba(244, 63, 94, 0.45);`
- `.neon-glow-emerald`: `box-shadow: 0 0 16px -2px rgba(16, 185, 129, 0.45);`

### 2.3 Animations & Keyframes
- `@keyframes cinema-fade-down`: TranslateY -18px + scale 0.98.
- `@keyframes cinema-fade-up`: TranslateY 20px + scale 0.98.
- `@keyframes cinema-fade-right`: TranslateX 24px + scale 0.98.
- `@keyframes cinema-bloom`: Brightness 0.4 & contrast 1.2 to standard.
- Classes: `.animate-cinema-top`, `.animate-cinema-bottom`, `.animate-cinema-right`, `.animate-cinema-canvas`.
- Slider thumb hover animations: `scale(1.15)` with colored glow `0 0 14px rgba(6, 182, 212, 0.7)`.

---

## 3. Hardcoded Hex Colors Audit

| Hex Code | Occurrences | Purpose / Location | Replacement Token |
|:---|:---:|:---|:---|
| `#05070B` | 8 | Deep black background in `index.css`, `HeartCanvas.tsx` | `--color-bg-base` (`#0b0f17`) |
| `#F8FAFC` | 6 | Body text & lights | `--color-text-primary` (`#f1f5f9`) |
| `#FFFFFF` | 14 | White text / borders / light sources | `--color-text-primary` or `--color-white` |
| `#93C5FD` | 2 | 3D lighting fill light | Handled via neutral light fill |
| `#06B6D4` | 7 | Cyan accent / glows / buttons | `--color-accent-blue` (`#2563eb`) |
| `#22D3EE` | 4 | Cyan borders / slider thumbs | `--color-accent-blue` (`#2563eb`) |
| `#10B981` | 9 | Emerald / Low-risk fallback | `--color-risk-low` (`#10b981`) |
| `#F59E0B` | 6 | Amber / Moderate-risk fallback | `--color-risk-moderate` (`#f59e0b`) |
| `#EF4444` | 8 | Red / High-risk fallback | `--color-risk-high` (`#ef4444`) |
| `#E2E8F0` | 3 | Slate border / lighting | `--color-border-subtle` (`#283548`) |
| `#475569` | 4 | Slate muted text | `--color-text-muted` (`#64748b`) |
| `#111827` | 3 | Dark background panels | `--color-surface-base` (`#131a26`) |
| `#2F7D5B` | 1 | Print CSS low-risk text | `--color-risk-low` |
| `#B7791F` | 1 | Print CSS moderate-risk text | `--color-risk-moderate` |
| `#B83232` | 1 | Print CSS high-risk text | `--color-risk-high` |

---

## 4. Gradients Audit
1. `index.css:92`: `.risk-track`: `linear-gradient(90deg, #10B981 0%, #F59E0B 50%, #EF4444 100%)`
2. `WelcomePage.tsx:28`: `bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent` (Gradient text - **Remove**)
3. `WelcomePage.tsx:42`: `bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10` (Background glow - **Remove**)
4. `WelcomePage.tsx:64`: `bg-gradient-to-br from-cyan-500/20 to-blue-600/20` (Card icon gradient - **Remove**)
5. `WelcomePage.tsx:75`: `bg-gradient-to-r from-cyan-500 to-blue-600` (CTA button gradient - **Replace with solid clinical blue**)
6. `DataEntryPage.tsx:45`: `bg-gradient-to-r from-blue-500/10 to-cyan-500/10` (Form banner gradient - **Replace with neutral slate**)
7. `ResultsPage.tsx:112`: `bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20` (Results card glow - **Remove**)
8. `ResultsPage.tsx:135`: `bg-gradient-to-br from-cyan-900/40 to-slate-900/40` (Vessel cards - **Replace with solid surface**)
9. `ReportsPage.tsx:157`: `shadow-[0_0_10px_rgba(6,182,212,0.15)]` (Glow shadow on active tab - **Replace with clean border**)

---

## 5. Box-Shadow & Glow Audit
- Total occurrences of arbitrary shadow or glow: **61 instances**.
- `neon-glow-cyan`, `neon-glow-rose`, `neon-glow-emerald` (glow radius 16px).
- `shadow-[0_0_16px_rgba(6,182,212,0.45)]` across buttons and active tabs.
- `shadow-[0_0_24px_rgba(6,182,212,0.25)]` on welcome hero cards.
- **Replacement Rule**: Replace all decorative glows with standard subtle elevation:
  - `shadow-sm`: `0 1px 2px rgba(0, 0, 0, 0.05)`
  - `shadow-md`: `0 4px 6px rgba(0, 0, 0, 0.07)`
  - No colored shadows (`rgba(...)` with hue).

---

## 6. Emoji Audit
- Exhaustive regex search across all `.tsx`, `.ts`, `.html`, and `.css` files in `apps/web/src`:
  - **Zero (0) raw emojis** found.
  - The UI uses Lucide React line icons exclusively (e.g. `<Activity>`, `<FileText>`, `<Stethoscope>`, `<ShieldAlert>`).
  - No emojis are used in buttons or headers.

---

## 7. 3D Model Color Lines & Hard Constraints Audit (Task C9)

### 7.1 Location in `apps/web/src/components/3d/HeartModel.tsx`:
- **Line 326**: `const ladColorHex = ladPred?.color_hex ?? '#10B981';`
- **Line 333**: `const lcxColorHex = lcxPred?.color_hex ?? '#10B981';`
- **Line 340**: `const rcaColorHex = rcaPred?.color_hex ?? '#10B981';`
- **Lines 544-546**: Hover tooltips and vessel annotations.

### 7.2 Alignment with Design Tokens:
- Default color `#10B981` is exactly identical to `--color-risk-low` (`#10b981`).
- Dynamic colors assigned by `inference.py` (`#10B981`, `#F59E0B`, `#EF4444`) match the design system tokens for Low, Moderate, and High risk.
- **Action**: Per hard constraints, `HeartModel.tsx` code remains **UNTOUCHED**. The canvas container in `HeartCanvas.tsx` and parent container in `ResultsPage.tsx` will be styled with deep neutral `--color-bg-base` (`#0b0f17`) to achieve seamless visual integration.
