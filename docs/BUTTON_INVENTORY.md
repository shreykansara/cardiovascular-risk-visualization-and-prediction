# Button & Control Inventory (Task 4.1)

This inventory audits all existing buttons, toggles, selectors, and interactive controls across the Perfusion3D application and specifies their target component in the new unified button design system.

---

## 1. Inventory & Component Mapping

| Location / Component | Current Control | Purpose | Target Design System Component | Size |
| :--- | :--- | :--- | :--- | :--- |
| **Welcome Page** | `<Button id="start-assessment-btn">` | Begin assessment after disclaimer | `PrimaryButton` | `lg` (48px) |
| **Navbar (`AppNav.tsx`)** | `<button>` Step items (1-4) | Step navigation indicator & jump | Custom step buttons (styled with tokens) | 36px |
| **Navbar (`AppNav.tsx`)** | `<button id="theme-toggle-btn">` | Toggle Paper / Monitor mode | `IconButton` | `sm` (32px / 44px mobile) |
| **Navbar (`AppNav.tsx`)** | `<Button id="new-assessment-btn">` | Start new assessment dialog | `QuietButton` / `SecondaryButton` | `sm` (32px / 44px mobile) |
| **Navbar Dialog** | `<Button>` (Cancel) | Dismiss reset dialog | `SecondaryButton` | `sm` (32px / 44px mobile) |
| **Navbar Dialog** | `<Button>` (Confirm Reset) | Clear and restart | `PrimaryButton` | `sm` (32px / 44px mobile) |
| **Clinical Data Entry** | `<button id="fill-sample-btn">` | Quick-fill sample profile | `SecondaryButton` | `sm` (32px / 44px mobile) |
| **Clinical Data Entry** | `<button id="clear-form-btn">` | Clear all fields dialog | `QuietButton` | `sm` (32px / 44px mobile) |
| **Clinical Data Entry** | `<Button id="predict-button">` | Run model prediction | `PrimaryButton` | `lg` (48px) |
| **Clinical Data Entry** | `<Button id="btn-save-draft">` | Save draft inputs | `SecondaryButton` | `md` (40px) |
| **Clinical Data Entry** | Section Accordion headers | Expand/collapse form sections | Accordion toggle header | 40px |
| **Clinical Data Entry** | Section jump quick nav | Jump to section anchor | `QuietButton` | 28px |
| **Clinical Data Entry** | Confirmation Dialogs | Cancel / Confirm modal actions | `SecondaryButton` / `PrimaryButton` | `sm` (32px / 44px mobile) |
| **Results Page** | `<Button id="btn-create-reports">` | Proceed to report generation | `PrimaryButton` | `lg` (48px) |
| **Results Page (Vessels)** | `<VesselCard>` buttons | Select/highlight target vessel | Interactive Card Button | card height |
| **3D Viewer Container** | Clear vessel chip `<button>` | Deselect active coronary artery | `IconButton` | 24px icon button |
| **3D Viewer Container** | `<ViewerHint>` help button (`?`) | Re-open 3D navigation hint | `IconButton` | `sm` (28px) |
| **ViewerToolbar** | Preset views (Front, Left, Back, Right) | Orient camera to clinical angles | `SegmentedControl` | `sm` (32px / 44px mobile) |
| **ViewerToolbar** | Zoom in (`+`), Zoom out (`-`), Reset | Distance and orientation controls | `IconButton` | `sm` (32px / 44px mobile) |
| **Reports Page Band** | `<Button id="reports-new-assessment-btn">` | Return to welcome / reset | `SecondaryButton` | `sm` (32px / 44px mobile) |
| **Reports Page Band** | `<Button id="print-report-btn">` | Open browser print dialog | `PrimaryButton` | `sm` (32px / 44px mobile) |
| **Reports Page Band** | Clinician / Patient toggle | Switch report audience view | `SegmentedControl` | `sm` (32px / 44px mobile) |

---

## 2. Design System Component Suite

1. **`PrimaryButton`**: Solid `--acc` background, `--onacc` text, 3px border radius. Hover: `--acc-hover`, Active/Press: `--acc-press`.
2. **`SecondaryButton`**: `--panel` background, 1px solid `--bds` border, `--ink` text. Hover: `--hov`, Active/Press: opacity 0.88.
3. **`QuietButton`**: Transparent background, no border, `--acc` text. Hover: `--hov` background.
4. **`IconButton`**: Square aspect ratio (`--btn-sm` or `--btn-md`), centering a Lucide icon with explicit `aria-label`.
5. **`SegmentedControl`**: Connected segmented pill container with active item highlighted using `--acc` and `--onacc`.
6. **`InlineLink`**: Underlined link text with `--acc` color, accessible focus outline.
