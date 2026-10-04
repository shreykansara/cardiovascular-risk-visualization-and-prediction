# Perfusion3D Clinical Design System Documentation
**Clinical Software Design System (Phase C)**  
*Author: Engineering Team*  
*Standard: WCAG 2.1 AA Compliant Clinical Decision-Support Environment*

---

## 1. Design Philosophy & Principles

Perfusion3D is medical decision-support software. It adheres strictly to clinical user interface standards (modeled on modern clinical EHR and diagnostic workstation interfaces like Epic Systems, Philips IntelliSpace, and GE Centricity):

1. **Calm Clinical Environment**: Eliminates neon glowing borders, arbitrary backdrop blur, sci-fi cyber elements, floating animations, and saturated purple/cyan palettes. Uses a deep neutral slate palette (`#0b0f17` base, `#131a26` surface, `#1c2637` raised).
2. **Restrained Color Semantics**: 
   - **Action & Focus**: Institutional Clinical Blue (`#2563eb`).
   - **Low Risk / Normal**: Calm Green (`#16a34a`).
   - **Moderate Risk / Borderline**: Muted Amber (`#d97706`).
   - **High Risk / Stenosis Suspected**: Muted Red / Crimson (`#dc2626`).
3. **High-Contrast & Vertical Rhythm**: High legibility typography with Inter for body, labels, and headings; JetBrains Mono with tabular numerals (`font-feature-settings: 'tnum'`) for all numeric vitals, lab values, and calibrated probabilities.
4. **Permanent Safety Guardrails**: Every screen features the mandatory clinical decision-support boundary disclaimer.

---

## 2. Design Tokens

### 2.1 Color Tokens (`apps/web/src/design/tokens.css` & `tokens.ts`)
| Token Name | CSS Variable | Hex / Value | Usage |
|:---|:---|:---|:---|
| Background Base | `--color-bg-base` | `#0b0f17` | Canvas background, document background |
| Surface Base | `--color-surface-base` | `#131a26` | Card background, table header |
| Surface Raised | `--color-surface-raised` | `#1c2637` | Modals, active tabs, buttons |
| Border Subtle | `--color-border-subtle` | `#283548` | Container borders, dividers |
| Border Strong | `--color-border-strong` | `#384961` | Focused and raised borders |
| Text Primary | `--color-text-primary` | `#f1f5f9` | Headings, vital values |
| Text Secondary | `--color-text-secondary` | `#94a3b8` | Subheadings, table labels |
| Text Muted | `--color-text-muted` | `#64748b` | Units, reference ranges |
| Accent Blue | `--color-accent-blue` | `#2563eb` | Primary CTA, focus rings |
| Risk Low | `--color-risk-low` | `#16a34a` | Risk $\le 40\%$, normal labs |
| Risk Moderate | `--color-risk-moderate` | `#d97706` | Risk $41\% - 70\%$, out-of-range flag |
| Risk High | `--color-risk-high` | `#dc2626` | Risk $> 70\%$, severe stenosis |

### 2.2 Typography Scale
- Body: **Inter** (weights 400 normal, 500 medium, 600 semibold). Ultra-bold 800/900 strictly avoided.
- Numerics: **JetBrains Mono** with `.font-mono-numbers` (`font-variant-numeric: tabular-nums`).
- Scale: `xs: 11px`, `sm: 13px`, `base: 14px`, `md: 16px`, `lg: 18px`, `xl: 20px`, `2xl: 24px`.

### 2.3 Spacing & Radii
- 4px Base Grid: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px.
- Radii: `sm: 6px`, `md: 8px`, `lg: 12px`, `full: 9999px` (circular pills only).
- Elevation: `shadow-sm: 0 1px 2px rgba(0,0,0,0.05)`, `shadow-md: 0 4px 6px rgba(0,0,0,0.07)`. Colored glow shadows prohibited.

---

## 3. Component Library API (`apps/web/src/components/ui/`)

### 3.1 Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" leftIcon={<Activity className="w-4 h-4" />}>
  Analyze Patient
</Button>
```
- **Variants**: `'primary'`, `'secondary'`, `'danger'`, `'ghost'`.
- **Sizes**: `'sm'`, `'md'`.
- **States**: `isLoading`, `disabled`, `:focus-visible` (2px solid `#2563eb` with 2px offset).

### 3.2 NumberInput
```tsx
import { NumberInput } from '@/components/ui';

<NumberInput
  label="Systolic BP"
  value={bp}
  onChange={setBp}
  unitSuffix="mmHg"
  refRangeMin={90}
  refRangeMax={120}
/>
```
- Displays unit suffix and normal physiological reference range.
- Flags out-of-range values with a subtle amber indicator dot.

### 3.3 Card
```tsx
import { Card } from '@/components/ui';

<Card variant="base" header={<SectionHeader title="ECG Findings" />}>
  {content}
</Card>
```
- Eliminates glassmorphism and backdrop filter blurs.

### 3.4 Badge
```tsx
import { Badge } from '@/components/ui';

<Badge riskLevel="High">High Risk (84.5%)</Badge>
```
- Maps to calibrated risk bands (Low: green, Moderate: amber, High: red).

### 3.5 Table
```tsx
import { Table } from '@/components/ui';

<Table
  columns={[
    { key: 'vessel', header: 'Vessel' },
    { key: 'prob', header: 'Probability', align: 'right', isNumeric: true }
  ]}
  data={vessels}
  keyExtractor={(row) => row.vessel}
/>
```

---

## 4. Development Showcase
The interactive living design system showcase is mounted at route `/design-system` within the development application.
