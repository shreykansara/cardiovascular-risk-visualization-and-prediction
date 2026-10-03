# Perfusion3D: Spatial Hemodynamic Ischemia & Coronary Twin
> **Real-Time Spatial Coronary Digital Twin & Multi-Vessel Ischemia Telemetry**  
> *Track A: Cardiovascular Risk Visualization & Prediction — Multimodal AI Hackathon 2026*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![SaMD Category](https://img.shields.io/badge/SaMD-Class%20IIa%20Prototype-blue?style=flat-square)](#clinical-safety--regulatory-boundary)

---

## Executive Overview

**Perfusion3D** is a state-of-the-art clinical decision-support platform uniting **high-throughput multi-target machine learning**, **sub-4ms TreeSHAP explainability**, and an **interactive 3D WebGL spatial coronary digital twin**.

Rather than presenting clinicians and patients with abstract, non-localized risk numbers, Perfusion3D projects calibrated stenosis probabilities $[0.0, 1.0]$ directly onto an anatomically continuous 3D myocardial mesh. Clinicians can interactively manipulate physiological parameters, inspect vessel-specific ischemic vulnerabilities across the **LAD**, **LCX**, and **RCA**, and understand exact local feature attributions in real time.

```
                     ┌───────────────────────────────────────────────┐
                     │          Patient Clinical Parameters          │
                     │  (Demographics, Symptoms, ECG, Labs, Echo)    │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │     Strict Leakage Guard (Cath Dropped)       │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │    Perfusion3D Multi-Head Inference Engine    │
                     │    • CAD Classifier   • LAD Stenosis Head     │
                     │    • LCX Stenosis Head • RCA Stenosis Head    │
                     │    • Sub-4ms TreeSHAP Attribution Engine      │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │          Perfusion3D Clinical DLS             │
                     │  • Continuous 3D WebGL Coronary Architecture  │
                     │  • Dynamic Risk Shaders (Emerald/Amber/Red)   │
                     │  • Real-Time TreeSHAP Waterfall Telemetry     │
                     └───────────────────────────────────────────────┘
```

---

## Architectural Highlights

### 1. Multi-Target Gradient-Boosted Classification
- **4 Dedicated Binary Heads**: Independent calibrated engines predicting **CAD** (Overall Coronary Artery Disease), **LAD** (Left Anterior Descending Stenosis), **LCX** (Left Circumflex Stenosis), and **RCA** (Right Coronary Artery Stenosis).
- **Strict Target Leakage Prevention**: Ground-truth catheterization (`Cath`) and target vessel stenosis columns are strictly isolated and removed prior to feature processing.
- **Sigmoid Probability Calibration**: Outputs are rigorously mapped to empirical probabilities $P \in [0.0, 1.0]$ to drive continuous GPU shader color uniforms.

### 2. Sub-4ms TreeSHAP Explainability
- Real-time local feature attribution vectors ($\phi_i$) for every patient prediction.
- Identifies top-k physiological drivers with directional risk impact (`INCREASES_RISK` vs `DECREASES_RISK`).

### 3. Spatial Coronary Digital Twin (Three.js / WebGL)
- High-fidelity myocardial surface and solid, continuous tubular coronary conduits generated via cubic Catmull-Rom splines conforming to the atrioventricular and interventricular sulci.
- Dynamic color-mapped shader uniforms:
  - **Low Risk** ($P \le 0.40$): Emerald Green (`#10B981`)
  - **Borderline Risk** ($0.40 < P \le 0.70$): Amber (`#F59E0B`)
  - **High Risk** ($P > 0.70$): Crimson Red (`#EF4444`)
  - **Critical Stenosis** ($P > 0.75$): Dynamic pulsating emissive ischemia warning.

### 4. Perfusion3D Clinical Design Language System (DLS)
- Responsive dark-mode glassmorphic interface with reactive parameter inputs, instant debounced re-scoring (250ms), and interactive focal camera targeting.

---

## 4-Step Clinical Assessment Workflow

The platform features a structured 4-step clinical workflow with state persistence and step locking:

1. **Step 1: Clinical Welcome & Consent (`/welcome`)**
   - Overview of the Perfusion3D decision-support platform.
   - Mandatory affirmative consent checkbox: *"I understand that predictions are for decision-support and educational purposes only..."*
   - Persistent `<DisclaimerBanner />` displayed across all application steps.

2. **Step 2: Manual Clinical Verification & Input (`/enter-data`)**
   - Complete 55-feature clinical input catalog grouped into 5 collapsible anatomical/diagnostic categories: Demographics, Clinical Examination, ECG, Laboratory, and Echocardiography.
   - Category completion counters (e.g. `5/5 filled`), validation ranges, neutral out-of-range indicators, and field-level provenance badges (`manual` | `extracted` | `unverified`).
   - "Load Sample Patient" one-click action for rapid clinical profiling and testing.
   - Disabled "Upload report (coming soon)" action in preparation for automated OCR extraction.

3. **Step 3: Interactive 3D Digital Twin & Explainability (`/results`)**
   - **3D Spatial Digital Twin**: Interactive 3D WebGL myocardial and coronary arterial mesh (LAD, LCX, RCA) with continuous color risk mapping (Emerald $\le 40\%$, Amber $40-70\%$, Crimson $> 70\%$).
   - Bidirectional vessel selection synchronization between 3D canvas and clinical dashboard cards.
   - Multi-target TreeSHAP attribution waterfall chart showing top 8 physiological drivers with directional risk indicators.
   - Physiological parameter breakdown table sortable by SHAP contribution percentage.
   - Empirical model performance validation tab displaying ROC-AUC, PR-AUC, Recall, Specificity, and F1 metrics.

4. **Step 4: Clinical & Patient AI Report Generation (`/reports`)**
   - Dual-tab report interface: **Technical Report (Clinician)** and **Patient Report (Plain Language)**.
   - LLM-powered report synthesis with strict medical boundary enforcement (SHARED RULES), anti-hallucination number verification, section order verification, and 2-attempt retry loop.
   - Built-in zero-hallucination deterministic fallback template if the LLM provider is unconfigured or unreachable.
   - One-click Print and Download PDF actions.

---

## Environment Variable Configuration

Create a `.env` file in the project root based on [.env.example](file:///.env.example):

```bash
# LLM Provider Configuration (Backend Only - Keys never sent to browser)
LLM_API_KEY=your_api_key_here
LLM_PROVIDER=openai          # Supported: openai, anthropic, gemini, groq, together, openrouter
LLM_MODEL=gpt-4o-mini        # Or claude-3-5-sonnet-20241022, gemini-1.5-pro, etc.
```

If `LLM_API_KEY` is omitted or left as the placeholder, Perfusion3D automatically activates its deterministic clinical report synthesis engine, ensuring zero downtime and fully compliant reports.

---

## Key Architectural File Locations

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Clinical Feature Schema** | [apps/web/src/config/featureSchema.ts](file:///apps/web/src/config/featureSchema.ts) | Definitive catalog of all 55 features with units, reference bounds, and clinical categories |
| **Wizard Navigation State** | [apps/web/src/store/useWizardStore.ts](file:///apps/web/src/store/useWizardStore.ts) | Session-persisted Zustand store managing patient inputs, predictions, SHAP, and report cache |
| **Clinical Disclaimer Banner** | [apps/web/src/components/common/DisclaimerBanner.tsx](file:///apps/web/src/components/common/DisclaimerBanner.tsx) | Mandatory persistent medical decision-support disclaimer banner |
| **Technical Prompt Template** | [src/prompts/technical_report.md](file:///src/prompts/technical_report.md) | Clinician-facing report prompt containing SHARED RULES and 8 mandated sections |
| **Patient Prompt Template** | [src/prompts/patient_report.md](file:///src/prompts/patient_report.md) | Plain-language patient report prompt (Grade 6-8 reading level) |
| **LLM Service & Validator** | [apps/api/app/services/llm_service.py](file:///apps/api/app/services/llm_service.py) | Provider adapter, anti-hallucination validator, and deterministic fallback templates |
| **Runtime Leakage Guard** | [apps/api/app/services/leakage_guard.py](file:///apps/api/app/services/leakage_guard.py) | Strict runtime guard blocking input injection of `Cath`, `CAD`, `LAD`, `LCX`, `RCA` |

---

## Future: Document Upload & Automated Extraction

Perfusion3D includes foundational architecture for automated multimodal document ingestion (EHR summaries, lab PDFs, echocardiogram printouts):

- **Store Hook**: `applyExtractedValues(values: Partial<PatientData>, confidences?: Record<keyof PatientData, number>)` in [useWizardStore.ts](file:///apps/web/src/store/useWizardStore.ts).
- **Field Provenance**: Each field in the form schema tracks a `source` state:
  - `manual`: Direct clinician or user manual entry.
  - `extracted`: Populated via automated OCR or NLP pipeline.
  - `unverified`: Flagged for mandatory clinical review (e.g. OCR confidence $< 0.85$).
- **UI Indicators**: Non-intrusive badges display the extraction source and confidence rating on `/enter-data`, allowing clinicians to review and verify before prediction.

---

## Test Suite & Verification

Run the full automated verification test suite:

```bash
# Run backend API, leakage guard, schema coverage, and report validator tests (37/37 passing)
python -m pytest apps/api/tests/ -v

# Run production web build verification
npm run build:web
```

---

## Clinical Safety & Regulatory Boundary

> **IMPORTANT CLINICAL NOTICE**  
> "Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation."

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
