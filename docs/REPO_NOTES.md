# Perfusion3D Repository Notes & Architectural Reference

This document provides a comprehensive summary of the Perfusion3D codebase architecture, components, prediction engine, and exact feature specifications.

---

## 1. Framework and Build Tools

- **Frontend**:
  - **Framework**: React 18.3.1 (TypeScript 5.3.3)
  - **Bundler & Dev Server**: Vite 5.1.6
  - **Styling**: Tailwind CSS 3.4.1, Vanilla CSS tokens (Perfusion3D Clinical DLS)
  - **3D Visualization**: Three.js 0.162.0, `@react-three/fiber` 8.16.8, `@react-three/drei` 9.102.6
  - **State Management**: Zustand 4.5.2
  - **Icons & Charts**: `lucide-react` 0.358.0, `recharts` 2.12.2
- **Backend**:
  - **Framework**: FastAPI (Python 3.11 / 3.14), Uvicorn
  - **Validation & Serialization**: Pydantic v2 (`PatientInputSchema`)
  - **Machine Learning & Inference**: Scikit-learn (CalibratedClassifierCV, VotingClassifier, Pipeline), LightGBM, XGBoost, Joblib
  - **Explainability**: SHAP (TreeExplainer with optimized tree path caching)

---

## 2. Folder Structure

```
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── config.py             # Settings, CORS, logging, paths
│   │   │   ├── main.py               # FastAPI application factory & middleware
│   │   │   ├── routes.py             # API endpoints (/predict, /explain, /analyze, /sample-patient)
│   │   │   ├── schemas/              # Pydantic schemas (patient.py, prediction.py, explanation.py)
│   │   │   └── services/             # Core ML services (model_service.py, inference.py, explainer.py, leakage_guard.py)
│   │   └── tests/                    # Pytest test suite (test_api_routes.py, test_inference.py, test_leakage.py)
│   └── web/
│       ├── public/                   # Static assets (3D GLTF models, textures)
│       └── src/
│           ├── components/
│           │   ├── 3d/               # 3D WebGL Digital Twin (HeartCanvas, HeartModel, CameraRig)
│           │   ├── common/           # Common UI (HeaderBar, BottomDock, DisclaimerModal)
│           │   └── dashboard/        # Dashboard blade and inputs (TelemetryBlade, PatientForm)
│           ├── store/                # Zustand global state (usePatientStore.ts)
│           ├── types/                # TypeScript interface definitions (clinical.ts)
│           ├── App.tsx               # Root application view
│           ├── main.tsx              # DOM hydration
│           └── index.css             # Design Language System styling & glow animations
├── models/                           # Serialized scikit-learn models & preprocessors
│   ├── cad_model.joblib              # Calibrated classifier for overall CAD
│   ├── lad_model.joblib              # Calibrated classifier for LAD stenosis
│   ├── lcx_model.joblib              # Calibrated classifier for LCX stenosis
│   ├── rca_model.joblib              # Calibrated classifier for RCA stenosis
│   ├── preprocessor.joblib           # ColumnTransformer (RobustScaler, OneHotEncoder)
│   ├── shap_explainers.joblib        # Pre-computed TreeSHAP explainers for all 4 targets
│   └── model_metadata.json           # Model validation metrics (ROC-AUC, PR-AUC, F1, Recall)
├── data/                             # Raw and processed datasets (Z-Alizadeh Sani)
├── scripts/                          # Preprocessing, mesh optimization, model training scripts
└── docs/                             # Architectural documentation & notes
```

---

## 3. Where the 3D Viewer Lives

- **Location**: `apps/web/src/components/3d/`
- **Primary Modules**:
  - `HeartCanvas.tsx`: Wraps the Three.js WebGL `<Canvas>` with high-luminance studio lighting, camera configuration, `OrbitControls`, and Suspense loading state.
  - `HeartModel.tsx`: Imports the authentic myocardium mesh and extrudes 3D tubular Catmull-Rom splines for the coronary conduits:
    - **LAD (Left Anterior Descending Artery)**: Anterior interventricular groove & diagonal branches.
    - **LCX (Left Circumflex Artery)**: Left atrioventricular groove & obtuse marginal branches.
    - **RCA (Right Coronary Artery)**: Right atrioventricular sulcus, acute marginal branch, and posterior descending descent.
    - Reads predicted stenosis probabilities directly from `usePatientStore` (`analysis.predictions.vessels`), dynamically applying Perfusion3D Clinical DLS color scales (`#10B981` patent/green, `#F59E0B` borderline/amber, `#EF4444` critical/red) with emissive pulsing on high-risk vessels.
  - `CameraRig.tsx`: Smooth cinematic camera transitions with spherical coordinate slerp when focusing on specific vessel targets (`vessel_LAD`, `vessel_LCX`, `vessel_RCA`).

---

## 4. Where the Prediction Engine Lives

- **Location**: `apps/api/app/services/` & `apps/api/app/routes.py`
- **Core Modules**:
  - `model_service.py`: Singleton managing memory-mapped loading of calibrated model bundles, the shared preprocessing pipeline, and TreeSHAP explainers.
  - `inference.py`: Executes `predict_patient(patient)`:
    - Transforms patient input features via `model_service.preprocessor`.
    - Evaluates 4 calibrated heads (`CAD`, `LAD`, `LCX`, `RCA`).
    - Applies anatomical territory calibration rules based on clinical parameters (`Region_RWMA`, `St_Depression`, `EF_TTE`).
    - Assigns risk tiers (`LOW`, `BORDERLINE`, `CRITICAL`), threshold classifications, and WebGL RGB uniforms.
  - `explainer.py`: Computes sub-10ms TreeSHAP feature attributions, base values, and direction of risk impacts (`INCREASES_RISK` vs `DECREASES_RISK`).
  - `leakage_guard.py`: Enforces zero target leakage, ensuring prohibited target columns (`Cath`, `CAD`, `LAD`, `LCX`, `RCA`) are never present in feature inputs.

---

## 5. How the Frontend Calls the Prediction Engine

- **Endpoint**: `POST /api/v1/analyze?top_k=6`
- **Protocol**: JSON over HTTP POST
- **Invocation**: Triggered in `usePatientStore.ts` by `analyzePatient()`.
  ```ts
  const response = await fetch('/api/v1/analyze?top_k=6', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData),
  });
  const data: CompleteAnalysisResponse = await response.json();
  ```
- **Response Format**:
  - `patient_id`: string
  - `predictions`: `{ overall_cad, vessels: { lad, lcx, rca }, high_risk_vessels }`
  - `explanations`: `{ cad, lad, lcx, rca }` (TreeSHAP features, base values, values)
  - `latency_ms`: float
  - `disclaimer`: string

---

## 6. Exact List of Input Feature Names (55 Features)

The prediction engine expects exactly **55 clinical features** matching `PatientInputSchema` in `apps/api/app/schemas/patient.py`.

### Strict Leakage Prevention
**Excluded Targets**: `CAD`, `LAD`, `LCX`, `RCA`, `Cath`. These are strictly prohibited from being input features.

### Group 1: Demographics & Anthropometrics (5 features)
| Feature Key | Type | Unit | Normal Reference Range | Description |
|---|---|---|---|---|
| `Age` | `float` (number) | years | 18 – 75 | Patient age (allowed 18 – 110) |
| `Weight` | `float` (number) | kg | 50 – 90 | Patient body weight (allowed 30 – 250) |
| `Length` | `float` (number) | cm | 150 – 190 | Patient height/length (allowed 100 – 240) |
| `Sex` | `'Male' \| 'Female'` | - | - | Biological sex |
| `BMI` | `float` (number) | kg/m² | 18.5 – 24.9 | Body Mass Index (allowed 12 – 65, auto-calculated) |

### Group 2: Clinical Examination & Medical History (19 features)
| Feature Key | Type | Unit | Normal Reference Range | Description |
|---|---|---|---|---|
| `DM` | `'0' \| '1'` | - | 0 | Diabetes Mellitus ('0'=No, '1'=Yes) |
| `HTN` | `'0' \| '1'` | - | 0 | Hypertension history ('0'=No, '1'=Yes) |
| `Current Smoker` | `'0' \| '1'` | - | 0 | Active cigarette smoker ('0'=No, '1'=Yes) |
| `EX-Smoker` | `'0' \| '1'` | - | 0 | Previous smoker history ('0'=No, '1'=Yes) |
| `FH` | `'0' \| '1'` | - | 0 | Family History of premature CAD ('0'=No, '1'=Yes) |
| `Obesity` | `'Y' \| 'N'` | - | N | Clinically diagnosed obesity ('Y'/'N') |
| `CRF` | `'Y' \| 'N'` | - | N | Chronic Renal Failure ('Y'/'N') |
| `CVA` | `'Y' \| 'N'` | - | N | Cerebrovascular Accident / Stroke ('Y'/'N') |
| `Airway disease` | `'Y' \| 'N'` | - | N | Chronic airway/pulmonary disease ('Y'/'N') |
| `Thyroid Disease` | `'Y' \| 'N'` | - | N | Thyroid dysfunction ('Y'/'N') |
| `CHF` | `'Y' \| 'N'` | - | N | Congestive Heart Failure ('Y'/'N') |
| `DLP` | `'Y' \| 'N'` | - | N | Dyslipidemia ('Y'/'N') |
| `BP` | `float` (number) | mmHg | 90 – 120 | Systolic Blood Pressure (allowed 50 – 260) |
| `PR` | `float` (number) | bpm | 60 – 100 | Resting Pulse Rate (allowed 35 – 220) |
| `Edema` | `'0' \| '1'` | - | 0 | Peripheral pitting edema ('0'=No, '1'=Yes) |
| `Weak Peripheral Pulse`| `'Y' \| 'N'` | - | N | Diminished peripheral artery pulse ('Y'/'N') |
| `Lung rales` | `'Y' \| 'N'` | - | N | Auscultated pulmonary rales/crackles ('Y'/'N') |
| `Systolic Murmur` | `'Y' \| 'N'` | - | N | Auscultated systolic heart murmur ('Y'/'N') |
| `Diastolic Murmur` | `'Y' \| 'N'` | - | N | Auscultated diastolic heart murmur ('Y'/'N') |

### Group 3: Symptoms & Functional Status (7 features)
| Feature Key | Type | Unit | Normal Reference Range | Description |
|---|---|---|---|---|
| `Typical Chest Pain` | `'0' \| '1'` | - | 0 | Exertional substernal chest discomfort ('0'=No, '1'=Yes) |
| `Dyspnea` | `'Y' \| 'N'` | - | N | Exertional shortness of breath ('Y'/'N') |
| `Function Class` | `'0' \| '1' \| '2' \| '3'` | class | 0 | NYHA Functional Class ('0'=None, '1'=Mild, '2'=Moderate, '3'=Severe) |
| `Atypical` | `'Y' \| 'N'` | - | N | Atypical chest pain presentations ('Y'/'N') |
| `Nonanginal` | `'Y' \| 'N'` | - | N | Non-anginal chest pain ('Y'/'N') |
| `Exertional CP` | `'Y' \| 'N'` | - | N | Explicit exertional chest pain trigger ('Y'/'N') |
| `LowTH Ang` | `'Y' \| 'N'` | - | N | Low-threshold angina ('Y'/'N') |

### Group 4: Electrocardiogram (ECG) Findings (7 features)
| Feature Key | Type | Unit | Normal Reference Range | Description |
|---|---|---|---|---|
| `Q Wave` | `'0' \| '1'` | - | 0 | Pathological Q waves present ('0'=No, '1'=Yes) |
| `St Elevation` | `'0' \| '1'` | - | 0 | ST-segment elevation on 12-lead ECG ('0'=No, '1'=Yes) |
| `St Depression` | `'0' \| '1'` | - | 0 | ST-segment depression on 12-lead ECG ('0'=No, '1'=Yes) |
| `Tinversion` | `'0' \| '1'` | - | 0 | T-wave inversion on 12-lead ECG ('0'=No, '1'=Yes) |
| `LVH` | `'Y' \| 'N'` | - | N | Left Ventricular Hypertrophy on ECG ('Y'/'N') |
| `Poor R Progression` | `'Y' \| 'N'` | - | N | Poor R-wave progression in precordial leads ('Y'/'N') |
| `BBB` | `'N' \| 'LBBB' \| 'RBBB'`| - | N | Bundle Branch Block ('N'=None, 'LBBB'=Left, 'RBBB'=Right) |

### Group 5: Laboratory Blood Biomarkers (14 features)
| Feature Key | Type | Unit | Normal Reference Range | Description |
|---|---|---|---|---|
| `FBS` | `float` (number) | mg/dL | 70 – 99 | Fasting Blood Sugar (allowed 40 – 600) |
| `CR` | `float` (number) | mg/dL | 0.6 – 1.2 | Serum Creatinine (allowed 0.1 – 15.0) |
| `TG` | `float` (number) | mg/dL | 50 – 150 | Serum Triglycerides (allowed 20 – 2000) |
| `LDL` | `float` (number) | mg/dL | 50 – 100 | Low-Density Lipoprotein (allowed 10 – 500) |
| `HDL` | `float` (number) | mg/dL | 40 – 60 | High-Density Lipoprotein (allowed 5 – 180) |
| `BUN` | `float` (number) | mg/dL | 7 – 20 | Blood Urea Nitrogen (allowed 2 – 150) |
| `ESR` | `float` (number) | mm/hr | 0 – 20 | Erythrocyte Sedimentation Rate (allowed 1 – 150) |
| `HB` | `float` (number) | g/dL | 12.0 – 17.5 | Hemoglobin concentration (allowed 5 – 25) |
| `K` | `float` (number) | mEq/L | 3.5 – 5.0 | Serum Potassium (allowed 1.5 – 9.0) |
| `Na` | `float` (number) | mEq/L | 135 – 145 | Serum Sodium (allowed 100 – 180) |
| `WBC` | `float` (number) | /mcL | 4000 – 11000 | White Blood Cell Count (allowed 1000 – 50000) |
| `Lymph` | `float` (number) | % | 20 – 40 | Lymphocyte differential percentage (allowed 1 – 90) |
| `Neut` | `float` (number) | % | 40 – 70 | Neutrophil differential percentage (allowed 5 – 95) |
| `PLT` | `float` (number) | x10³/mcL | 150 – 450 | Platelet count (allowed 10 – 1500) |

### Group 6: Echocardiographic Findings (3 features)
| Feature Key | Type | Unit | Normal Reference Range | Description |
|---|---|---|---|---|
| `EF-TTE` | `float` (number) | % | 55 – 70 | Left Ventricular Ejection Fraction (allowed 10 – 85) |
| `Region RWMA` | `'0' \| '1' \| '2' \| '3' \| '4'` | score | 0 | Regional Wall Motion Abnormality (0=None, 1=Anterior, 2=Inferior, 3=Lateral, 4=Multiple/Septal) |
| `VHD` | `'N' \| 'mild' \| 'Moderate' \| 'Severe'` | grade | N | Valvular Heart Disease severity |
