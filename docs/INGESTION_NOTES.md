# Clinical Report Ingestion Notes & Field Inventory

## 1. Schema Confirmation & Field Counts

The clinical feature schema defines exactly **55 features** across 5 sections matching the expected counts:

| Section | Expected Count | Confirmed Count | Ownership |
|---|---|---|---|
| Demographics | 5 | 5 | Outpatient note (EHR) |
| Clinical Examination | 26 | 26 | Outpatient note (EHR) |
| ECG | 7 | 7 | ECG report |
| Laboratory | 14 | 14 | Blood lab report |
| Echocardiography | 3 | 3 | Echo report |
| **Total** | **55** | **55** | **4 Report Types (Disjoint sets)** |

Combined Outpatient note ownership: Demographics (5) + Clinical Examination (26) = **31 fields**.

### Canonical Source of Limits and Units
- **Canonical Source for UI, Limits & Units**: `apps/web/src/config/featureSchema.ts` (`FEATURE_SCHEMA`).
- **Backend Validation Model**: `apps/api/app/schemas/patient.py` (`PatientInputSchema`).
- Both files are strictly synchronized on physiological boundaries (e.g., Age 18–110, BP 50–260, K 1.5–9.0, FBS 40–600).
- **Blood Pressure (BP)**: Systolic blood pressure only (50–260 mmHg). Diastolic BP is not modeled in the 55-feature schema.
- **Bundle Branch Block (BBB)**: 3-way categorical ('N': None, 'LBBB': Left Bundle Branch Block, 'RBBB': Right Bundle Branch Block).
- **Valvular Heart Disease (VHD)**: 4-level categorical ('N': None, 'mild': Mild, 'Moderate': Moderate, 'Severe': Severe).
- **NYHA Function Class**: 4-level categorical ('0': Class 0, '1': Class I, '2': Class II, '3': Class III).
- **Regional Wall Motion Abnormality (Region RWMA)**: 5-level score ('0': None, '1': Anterior, '2': Inferior, '3': Lateral, '4': Septal/Multiple).

## 2. Complete 55-Field Catalog

| Key | Label | Section | Type | Unit | Hard Min/Max | Allowed Values |
|---|---|---|---|---|---|---|
| `Age` | Patient Age | Demographics | number | years | 18 to 110 | - |
| `Sex` | Biological Sex | Demographics | toggle | - | - | 'Male' (Male), 'Female' (Female) |
| `Weight` | Body Weight | Demographics | number | kg | 30 to 250 | - |
| `Length` | Height / Length | Demographics | number | cm | 100 to 240 | - |
| `BMI` | Body Mass Index | Demographics | number | kg/m² | 12 to 65 | - |
| `BP` | Systolic Blood Pressure | Clinical Examination | number | mmHg | 50 to 260 | - |
| `PR` | Resting Pulse Rate | Clinical Examination | number | bpm | 35 to 220 | - |
| `DM` | Diabetes Mellitus | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `HTN` | Hypertension | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `Current Smoker` | Current Smoker | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `EX-Smoker` | Ex-Smoker | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `FH` | Family History of CAD | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `Obesity` | Clinical Obesity | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `CRF` | Chronic Renal Failure | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `CVA` | Cerebrovascular Accident | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Airway disease` | Airway / Lung Disease | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Thyroid Disease` | Thyroid Dysfunction | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `CHF` | Congestive Heart Failure | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `DLP` | Dyslipidemia | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Edema` | Peripheral Edema | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `Weak Peripheral Pulse` | Weak Peripheral Pulse | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Lung rales` | Pulmonary Rales | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Systolic Murmur` | Systolic Murmur | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Diastolic Murmur` | Diastolic Murmur | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Typical Chest Pain` | Typical Chest Pain | Clinical Examination | toggle | - | - | '0' (No), '1' (Yes) |
| `Dyspnea` | Exertional Dyspnea | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Function Class` | NYHA Functional Class | Clinical Examination | select | class | - | '0' (Class 0: None / Asymptomatic), '1' (Class I: Mild limitation with vigorous activity), '2' (Class II: Moderate limitation with ordinary activity), '3' (Class III: Severe limitation with minimal activity) |
| `Atypical` | Atypical Angina | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Nonanginal` | Non-Anginal Chest Pain | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Exertional CP` | Exertional Chest Pain | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `LowTH Ang` | Low-Threshold Angina | Clinical Examination | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Q Wave` | Pathologic Q-Wave | ECG | toggle | - | - | '0' (Absent), '1' (Present) |
| `St Elevation` | ST-Segment Elevation | ECG | toggle | - | - | '0' (Absent), '1' (Present) |
| `St Depression` | ST-Segment Depression | ECG | toggle | - | - | '0' (Absent), '1' (Present) |
| `Tinversion` | T-Wave Inversion | ECG | toggle | - | - | '0' (Absent), '1' (Present) |
| `LVH` | Left Ventricular Hypertrophy | ECG | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `Poor R Progression` | Poor R-Wave Progression | ECG | toggle | - | - | 'N' (No), 'Y' (Yes) |
| `BBB` | Bundle Branch Block | ECG | select | - | - | 'N' (None), 'LBBB' (Left Bundle Branch Block (LBBB)), 'RBBB' (Right Bundle Branch Block (RBBB)) |
| `FBS` | Fasting Blood Sugar | Laboratory | number | mg/dL | 40 to 600 | - |
| `CR` | Serum Creatinine | Laboratory | number | mg/dL | 0.1 to 15.0 | - |
| `TG` | Triglycerides | Laboratory | number | mg/dL | 20 to 2000 | - |
| `LDL` | Low-Density Lipoprotein (LDL) | Laboratory | number | mg/dL | 10 to 500 | - |
| `HDL` | High-Density Lipoprotein (HDL) | Laboratory | number | mg/dL | 5 to 180 | - |
| `BUN` | Blood Urea Nitrogen | Laboratory | number | mg/dL | 2 to 150 | - |
| `ESR` | Erythrocyte Sedimentation Rate | Laboratory | number | mm/hr | 1 to 150 | - |
| `HB` | Hemoglobin | Laboratory | number | g/dL | 5.0 to 25.0 | - |
| `K` | Serum Potassium | Laboratory | number | mEq/L | 1.5 to 9.0 | - |
| `Na` | Serum Sodium | Laboratory | number | mEq/L | 100 to 180 | - |
| `WBC` | White Blood Cell Count | Laboratory | number | /mcL | 1000 to 50000 | - |
| `Lymph` | Lymphocyte Percentage | Laboratory | number | % | 1 to 90 | - |
| `Neut` | Neutrophil Percentage | Laboratory | number | % | 5 to 95 | - |
| `PLT` | Platelet Count | Laboratory | number | x10³/mcL | 10 to 1500 | - |
| `EF-TTE` | Ejection Fraction (TTE) | Echocardiography | number | % | 10 to 85 | - |
| `Region RWMA` | Regional Wall Motion Abnormality | Echocardiography | select | score | - | '0' (0: None / Normal wall motion), '1' (1: Anterior Wall RWMA (LAD territory)), '2' (2: Inferior Wall RWMA (RCA territory)), '3' (3: Lateral Wall RWMA (LCX territory)), '4' (4: Septal / Multiple Wall RWMA) |
| `VHD` | Valvular Heart Disease | Echocardiography | select | grade | - | 'N' (None (Normal)), 'mild' (Mild valvulopathy), 'Moderate' (Moderate valvulopathy), 'Severe' (Severe valvulopathy) |

## 3. Architecture & Location Inventory

### 3.1 Wizard Store & Extracted Values Handling
- **File**: `apps/web/src/store/useWizardStore.ts`
- **Stub function**: `applyExtractedValues: (values: Partial<PatientData>, confidences?: Record<string, number>) => void` (lines 58, 193-211).
- **Field Meta & Confidence**: `fieldMeta` in state contains `{ source, confidence, error, touched }`. `FieldSource = 'manual' | 'extracted' | 'unverified'`. `confidence` is a number (or string).
- **Chip display**: In `apps/web/src/components/forms/FormField.tsx` (lines 27-28), chips are displayed only when `source !== 'manual'`. Uses `source` prop on input components.

### 3.2 Data Entry Page & Upload Button
- **File**: `apps/web/src/pages/DataEntryPage.tsx`
- **Disabled Upload Button**: Lines 419-425: `<SecondaryButton size="sm" disabled title="Available in a later version">Upload report (coming soon)</SecondaryButton>`.
- **Sample Patient Loader**: Lines 427-465: `#sample-patient-select` with `handleSelectSample` calling `useWizardStore.getState().loadSamplePatient(...)`.

### 3.3 Backend API Router & Entrypoint
- **Entrypoint**: `apps/api/app/main.py` mounting `api_router` under prefix `/api/v1` (`settings.API_V1_STR`).
- **Router**: `apps/api/app/routes.py` with routes for health, predictions, explanations, and complete analysis.
- **Report extraction endpoint**: Will be mounted at `POST /api/v1/extract/{report_type}`.

### 3.4 Python Dependencies
- **File**: `requirements.txt`
- Contains FastAPI, Uvicorn, Pydantic, scikit-learn, XGBoost, LightGBM, SHAP, pandas, numpy.
- Contains `python-multipart>=0.0.9` for multipart form parsing.
- Needs pinned `pdfplumber==0.11.4` (or latest stable) for in-memory PDF extraction.
- Development-only PDF generation dependency `reportlab` will reside in `requirements-dev.txt`.

### 3.5 Nginx Configuration & Proxy Settings
- **File**: `apps/web/nginx.conf`
- Lines 17-29: `location /api/` proxies to `http://api:8000` with 120s timeout.
- Default `client_max_body_size` in Nginx is 1 MB. For `/api/v1/extract/` endpoint, will configure `client_max_body_size 6m;` and `proxy_read_timeout 60s;`.

### 3.6 Vite Dev Proxy
- **File**: `apps/web/vite.config.ts`
- Lines 19-23: `server.proxy['/api']` maps to `http://127.0.0.1:8000` with `changeOrigin: true`.
- Vite dev proxy (Node.js http-proxy) has no default body size limit.
