# Landing Page Audit & Notes

## Task 0.2: Existing Landing Page Inventory
- **File**: `apps/web/src/pages/LandingPage.tsx`
- **Route**: Mounted at `/` in `apps/web/src/App.tsx`.
- **Components Used**:
  - `Panel` (`apps/web/src/components/ui/Panel.tsx`)
  - `PrimaryButton`, `SecondaryButton` (`apps/web/src/components/ui/PrimaryButton.tsx`, `SecondaryButton.tsx`)
  - `HeartCanvas` (`apps/web/src/components/3d/HeartCanvas.tsx`) lazy-loaded via `React.lazy`.
  - SVG rhythm strip drawn with `animation: draw`.
- **How it loads the heart**:
  - It mounted `<HeartCanvas />` directly inside `.landing-heart-stage`.
  - This is the exact same component mounted on `ResultsPage` (`apps/web/src/pages/ResultsPage.tsx`), but `ResultsPage` also pairs it with `useWizardStore`, `usePatientStore`, and `ColorScaleLegend`.

## Task 0.3: Cause of Dead "Inspect vessel" Buttons & Reset View
- **Cause**: The inspect buttons passed string keys `'lad'`, `'lcx'`, `'rca'` (whereas `CameraRig.tsx` and `HeartModel.tsx` expect `'vessel_LAD'`, `'vessel_LCX'`, `'vessel_RCA'`) to `usePatientStore`, but `HeartModel.tsx` fell back to `wizardFocus` from `useWizardStore` which was permanently set to `'default'`, meaning vessel selection was never applied to 3D meshes or camera focus; additionally, Reset View called `controlsRef.current.reset()` without syncing the camera position or selection state across stores.

## Task 0.4: Fact Verification
- **a) Total number of input features**: Exactly **55** features.
  - *Proving file*: `apps/web/src/config/featureSchema.ts` (`FEATURE_SCHEMA.length === 55`), confirmed by backend `apps/api/app/schemas/patient.py` (55 clinical parameters excluding leakage targets).
- **b) Four predictions made**: Overall CAD, LAD, LCX, RCA.
  - *Proving file*: `apps/web/src/types/clinical.ts` and `apps/api/app/schemas/prediction.py`.
- **c) Risk band thresholds**:
  - Low: under 40% (`0.0` to `0.40`)
  - Moderate: 40 to 70% (`0.40` to `0.70`)
  - High: over 70% (`0.70` to `1.0`)
  - *Proving file*: `apps/web/src/config/riskBands.ts` (`RISK_BANDS`).
- **d) Existing sample patients**:
  - `normal`: ID `PT-HEALTHY-01`, "Healthy Normal"
  - `rca_ischemia`: ID `PT-INFERIOR-RCA-04`, "Inferior Wall Ischemia (RCA)"
  - `high_risk_lad`: ID `PT-HIGH-RISK-LAD-02`, "High-Risk LAD Ischemia"
  - `triple_vessel`: ID `PT-SEVERE-CAD-03`, "Triple Vessel Disease"
  - *Proving file*: `apps/web/src/store/usePatientStore.ts` (`PATIENT_PROFILES`) and `apps/api/app/routes.py` (`get_sample_patient`).
- **e) Data handling verification**:
  - Browser storage: values stored only in `sessionStorage` under the key `perfusion3d-wizard-v2` (`apps/web/src/store/useWizardStore.ts` line 361) during an active browser session.
  - Server handling: `apps/api/app/routes.py` receives `PatientInputSchema` via HTTP POST, computes predictions in memory, and writes zero data to database, disk, or logs (`apps/api/app/utils/logger.py`).
  - *Conclusion*: "Your data" sentence in Task 6.2 #4 is VERIFIED.

## Task 0.5: Claim & Jargon Audit (All Marked Deleted)
- "under 45ms" — **DELETED**
- "0.88 - 0.92 Calibrated AUC" — **DELETED**
- "< 45 ms Inference Latency" — **DELETED**
- "100% Deterministic" — **DELETED**
- "Offline EHR Privacy" — **DELETED**
- "sub-100ms" — **DELETED**
- "zero-hallucination" — **DELETED**
- "Multimodal Clinical Risk Architecture" — **DELETED**
- "4-HEAD CALIBRATION" — **DELETED**
- "TREESHAP EXPLAINABILITY" — **DELETED**
- "DUAL REPORTING" — **DELETED**
- "Platt scaling" — **DELETED**
- "isotonic calibration" — **DELETED**
- "gradient boosted" — **DELETED**
- "dual-persona" — **DELETED**
- "transparent TreeSHAP attributions" — **DELETED**
- "anatomical twin" / "digital twin" — **DELETED**
- All-caps card eyebrow tags ("01. 3D SPATIAL PERFUSION", etc.) — **DELETED**
- Percentages in demo buttons ("High-Risk LAD (78%)", etc.) — **DELETED**
- All benchmark metrics from Model Validation table — **DELETED**
