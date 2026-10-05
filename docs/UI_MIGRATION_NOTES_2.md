# UI Migration Notes (Round 2: ECG Paper Steps 1 & 2, Navbar, Contrast, Print)

Branch: `feature/ecg-paper-steps-1-2`
Base Branch: `feature/ecg-paper-ui`

---

## 1. Inventory of Target Files

### Header & Progress Rule
- `apps/web/src/components/layout/WizardLayout.tsx`:
  - Contains the current header (`<header>` with brand, `<Trace />`, theme select, "Back" link, and mono step text) and the 4-segment progress rule directly under the header.
  - Action in Round 2: Replace header and progress rule with the new unified `AppNav` component (sticky 56px navbar with 3-column CSS grid, `<ol>` progress items with bottom 3px animated bars, "New assessment" confirmation dialog, and mobile `<StepSummary>` bar).

### Welcome Page (Step 1)
- `apps/web/src/pages/WelcomePage.tsx`:
  - Current single-column 640px card with basic disclaimer and start checkbox.
  - Action in Round 2: Complete redesign with top 64px `.ecg-grid` SVG heartbeat strip band (`pathLength="1"`, one-shot 1200ms draw animation), "Perfusion3D" 28px/600 heading, lead sentence, "What happens next" 3-step numbered block, in-progress resume block (`K of 55 values entered`), "Decision support only" callout, and 18px checkbox row with "Start assessment" button.

### Clinical Data Page (Step 2)
- `apps/web/src/pages/DataEntryPage.tsx`:
  - Current single panel wrapper around all sections.
  - Action in Round 2: Complete structural redesign with top Header Panel (with "Sample patient" chip and "Collapse all / Expand all" toggle), sticky 240px Sidebar (demographics, clinical examination, ECG, laboratory, echocardiography with mod/high status dots and animated 4px progress bar), mobile horizontal scroll strip (`<900px`), 5 distinct section Panels (`scroll-margin-top: 80px`), and sticky bottom action bar with `position: sticky; bottom: 0; z-index: 5` showing entered counts, out-of-range counts, and "{M} need attention" scroll trigger.

### Section and Field Components
- `apps/web/src/components/ui/Section.tsx`: Collapsible section wrapper with count and chevron.
- `apps/web/src/components/ui/Field.tsx`: Base field container with label, unit, and caption.
- `apps/web/src/components/ui/TextField.tsx`: Text input variant.
- `apps/web/src/components/ui/NumberField.tsx`: Numeric input with embedded mono unit and focus-within outline.
- `apps/web/src/components/ui/Select.tsx`: Dropdown select matching field height and radius.
- `apps/web/src/components/ui/Checkbox.tsx`: 18px accessible checkbox.
- `apps/web/src/components/ui/SegmentedChoice.tsx`: Binary choice buttons (Male/Female, Yes/No) with 3px outer radius.
- `apps/web/src/components/ui/RiskLabel.tsx`: 8px dot + text in `--ink` (never tinted).
- `apps/web/src/components/ui/Chip.tsx`: Neutral source chips ("Extracted", "Unverified", "Sample patient").
- `apps/web/src/config/featureSchema.ts`: Clinical schema for all 55 features, reference ranges, and validation bounds.

### Report Sheet
- `apps/web/src/pages/ReportsPage.tsx`: Top panel band with tabs and status line, followed by the white sheet container.
- `apps/web/src/components/reports/TechnicalReportView.tsx`: Clinician report layout (`#printable-report-sheet`).
- `apps/web/src/components/reports/PatientReportView.tsx`: Plain-language patient report layout (`#printable-report-sheet`).
- Action in Round 2: Enforce sheet-scoped `--s-*` tokens everywhere inside `#print-root` so all text, lines, dots, and bars are strictly theme-independent and dark-mode safe on the `#FFFFFF` sheet background.

### Print Stylesheet
- `apps/web/src/index.css`: Contains `@media print` rules.
- `apps/web/src/design/print.css` (to be created): Dedicated `@page { size: A4; margin: 16mm; }` stylesheet hiding `.app-chrome`, `.no-print`, resetting `#print-root`, stripping the `.ecg-grid` background, and enforcing exact color print fidelity.

### Download PDF Implementation Analysis
- **Current Location**: `apps/web/src/pages/ReportsPage.tsx`, lines 122–124:
  ```typescript
  const handleDownloadPdf = () => {
    window.print();
  };
  ```
- **How It Works Today**:
  - The "Download PDF" button directly invokes the browser's native `window.print()` API.
  - It does NOT use any client-side canvas-rasterization or DOM-rendering libraries (such as `html2canvas`, `jspdf`, or `pdfmake`).
  - The browser's native print engine handles PDF rendering and hardware printing via CSS `@media print` rules.
- **Round 2 Enhancement**:
  - Both "Download PDF" and "Print" will share the exact same print execution flow via `window.print()`.
  - Before calling `window.print()`, `document.title` is dynamically set to `"Perfusion3D clinician report YYYY-MM-DD"` or `"Perfusion3D patient report YYYY-MM-DD"`, and reverted immediately in `afterprint` (or finally block), ensuring default saved PDF filenames are semantic and clean.
