# Copy Word Count Baseline (1440px Viewport)

Measured on branch `refactor/plain-language-ui` at commit baseline prior to plain language refactor.

Measurement environment: Headless Google Chrome, 1440x900 viewport, measured via `scripts/word_count.mjs`.

## Rules & Exclusions
- Viewport: 1440px desktop width.
- Excluded from count:
  - Top navigation bar (`nav`, `header`)
  - Global footer and footer disclaimer (`footer`, `[role="contentinfo"]`)
  - Text inside WebGL / 3D canvas
  - Form field labels (`label`)
  - Form field unit markers (`[data-unit]`, e.g. `mmHg`, `mg/dL`)
  - Range captions (`[data-caption]`, e.g. "Usual range: 90 to 120 mmHg")
  - Table cells (`th`, `td`)
  - Full clinician / patient report body content on `/reports` (only reports chrome / navigation / action controls are counted)

---

## Baseline Measurements

| Screen | Route | Baseline Words | Word Budget | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Landing** | `/` | **1985** | <= 70 | ❌ Over budget (+1915 words) |
| **Welcome** | `/welcome` | **140** | <= 45 | ❌ Over budget (+95 words) |
| **Patient data** | `/enter-data` | **253** | <= 80 | ❌ Over budget (+173 words) |
| **Results** | `/results` | **58** | <= 60 |  Under budget (will refine copy) |
| **Reports chrome** | `/reports` | **3** | <= 25 |  Under budget |

---

## Screen Summaries at Baseline

### 1. Landing (`/`) — 1985 words (Budget: 70)
Contains extensive marketing bands, dense clinical copy, "How it works" 3-step breakdown, "What you get" feature list, "About the results" disclaimers and methodology explanations, repetitive CTAs, and duplicate sample previews.
- **Goal in Phase 3**: Strip all bands except Hero + compact Steps row + 4-button Sample block + interactive Readout card. Target <= 70 words.

### 2. Welcome (`/welcome`) — 140 words (Budget: 45)
Contains dense preamble ("HEART HEALTH ASSESSMENT · STEP 1 OF 4", "Welcome to Perfusion3D", "A visual way to explore how health measurements..."), repetitive bullet points, lengthy legal notice.
- **Goal in Phase 4**: Exactly H1 "Before you start", 1 lead sentence, "Not a diagnosis" disclaimer box with mandatory preserved sentence, "I understand" checkbox, "Start" button. Target <= 45 words.

### 3. Patient data (`/enter-data`) — 253 words (Budget: 80)
Contains lengthy subtitle ("Enter measurements below or choose a sample to explore"), upload panel copy ("Drag and drop PDF or text reports..."), detailed status blocks, duplicate button explanations, verbose helper texts under fields.
- **Goal in Phase 5**: Header "Patient data", 1-sentence subtitle, compact sample selector pill bar, upload dropzone with 1-line prompt, field helpers moved to `?` `HelpTip` popovers. Target <= 80 words.

### 4. Results (`/results`) — 58 words (Budget: 60)
Artery risk cards, factor lists, 3D viewport controls.
- **Goal in Phase 6**: Refine vocabulary according to guide ("Chance of narrowing by artery", plain artery names with full names in `HelpTip`, factors list with plain names, "Show all" progressive disclosure). Maintain <= 60 words.

### 5. Reports Chrome (`/reports`) — 3 words (Budget: 25)
Tabs for "Patient report" / "Clinician report", action buttons "Print", "Save PDF", status line.
- **Goal in Phase 7**: Verify tab and action button copy conforms to plain English guidelines while keeping full report contents intact. Maintain <= 25 words.
