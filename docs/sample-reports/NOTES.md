# Sample Reports Generation & Ingestion Notes

This document records the setup, preset inventory, schema expectations, and LaTeX toolchain configuration for generating synthetic LaTeX test reports and verifying deterministic extraction round-trips.

---

## 1. Source of Truth & Preset Inventory (Task 0.2)

- **Source of Truth Path**: [`apps/web/src/store/usePatientStore.ts`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/apps/web/src/store/usePatientStore.ts) (`PATIENT_PROFILES`).
- **Number of Presets**: 4 presets.
- **Preset Inventory**:
  1. `normal`: `"Healthy Normal"` (38yo Male, asymptomatic, normotensive, normal ECG and echo EF 60%).
  2. `high_risk_lad`: `"LAD Ischemia (Isolated Anterior)"` (47yo Female, exertional angina, anterior ST-elevation, Anterior RWMA, EF 45%, isolated LAD stenosis).
  3. `rca_ischemia`: `"RCA / Inferior Ischemia"` (62yo Male, diabetic, atypical angina, ST depression & T-inversion, EF 55%, dominant RCA stenosis).
  4. `triple_vessel`: `"Triple-Vessel Critical CAD"` (72yo Male, severe diffuse CAD, diabetes, HTN, ST abnormalities, EF 35%, multiple wall dyskinesia).

### Frontend vs Backend Preset Comparison

When comparing the frontend presets ([`usePatientStore.ts`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/apps/web/src/store/usePatientStore.ts)) with the backend fixture endpoint [`routes.py:get_sample_patient`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/apps/api/app/routes.py#L145):
- The frontend presets define complete, explicit values for all 55 schema fields.
- The backend `get_sample_patient` implementation provided explicit values for only a subset of fields, letting the remainder fall back to default values defined in `PatientInputSchema` (e.g. `WBC=7100.0`, `Na=141.0`, `K=4.2`, `Obesity='N'`).
- **Specific Differences Found**:
  - `normal`: Na (140 in UI vs 141.0 in backend default), WBC (5500 in UI vs 7100.0 in backend default).
  - `high_risk_lad`: K (4.4 in UI vs 4.2 in backend), Na (139 in UI vs 141.0 in backend), WBC (7800 in UI vs 7100.0 in backend), Obesity ('Y' in UI vs 'N' in backend).
  - `rca_ischemia`: Na (142 in UI vs 141.0 in backend), WBC (8200 in UI vs 7100.0 in backend), DLP ('Y' in UI vs 'N' in backend).
  - `triple_vessel`: LVH ('Y' in UI vs 'N' in backend), Poor R Progression ('Y' in UI vs 'N' in backend), K (4.6 in UI vs 4.2 in backend), Na (138 in UI vs 141.0 in backend), WBC (9200 in UI vs 7100.0 in backend), FH ('1' in UI vs '0' in backend), Obesity ('Y' in UI vs 'N' in backend), DLP ('Y' in UI vs 'N' in backend), Edema ('1' in UI vs '0' in backend), Weak Peripheral Pulse ('Y' in UI vs 'N' in backend), Systolic Murmur ('Y' in UI vs 'N' in backend).
- **Canonical Decision**: The UI "Load sample patient" menu in [`DataEntryPage.tsx`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/apps/web/src/pages/DataEntryPage.tsx) loads directly from `PATIENT_PROFILES` in `usePatientStore.ts`. Therefore, `usePatientStore.ts` is the canonical source of truth for all 55 preset values.

---

## 2. Field Specifications and Expected Labels (Task 0.3)

Derived from [`field_specs.json`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/apps/api/app/extraction/field_specs.json) and [`docs/REPORT_FORMATS.md`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/docs/REPORT_FORMATS.md). Every printed label wording exists in [`field_synonyms.json`](file:///c:/Users/Shrey/Projects/Multimodal%20AI%20Hackathon/apps/api/app/extraction/field_synonyms.json).

### ECG Report (7 fields)
| Key | Label to Print | Unit to Print | Accepted Value Spellings | Matched Synonym in `field_synonyms.json` |
|---|---|---|---|---|
| `Q Wave` | Pathological Q wave | - | Present, Absent | `pathological q wave` |
| `St Elevation` | ST elevation | - | Present, Absent | `st elevation` |
| `St Depression` | ST depression | - | Present, Absent | `st depression` |
| `Tinversion` | T-wave inversion | - | Present, Absent | `t-wave inversion` |
| `LVH` | Left ventricular hypertrophy (LVH) | - | Yes, No / Present, Absent | `left ventricular hypertrophy` |
| `Poor R Progression` | Poor R-wave progression | - | Yes, No / Present, Absent | `poor r-wave progression` |
| `BBB` | Bundle branch block | - | None, LBBB, RBBB | `bundle branch block` |

### Echo Report (3 fields)
| Key | Label to Print | Unit to Print | Accepted Value Spellings | Matched Synonym in `field_synonyms.json` |
|---|---|---|---|---|
| `EF-TTE` | Ejection fraction (Simpson biplane) | % | Number with % (e.g. 50 %) | `ejection fraction` |
| `Region RWMA` | Regions with RWMA | score | Integer count (0 to 4) | `regions with rwma` |
| `VHD` | Valvular heart disease | grade | Normal, Mild, Moderate, Severe | `valvular heart disease` |

### Blood Lab Report (14 fields)
| Key | Label to Print | Unit to Print | Accepted Value Spellings | Matched Synonym in `field_synonyms.json` |
|---|---|---|---|---|
| `HB` | Hemoglobin | g/dL | Decimal number (e.g. 13.5) | `hemoglobin` |
| `WBC` | Total leucocyte count (WBC) | cells/uL | Thousands format or number (e.g. 7,200) | `total leucocyte count` |
| `Neut` | Neutrophils (%) | % | Percentage number (e.g. 60 %) | `neutrophils (%)` |
| `Lymph` | Lymphocytes (%) | % | Percentage number (e.g. 30 %) | `lymphocytes (%)` |
| `PLT` | Platelet count | 10^3/uL | Scaled count (e.g. 240) | `platelet count` |
| `ESR` | Erythrocyte sedimentation rate (ESR) | mm/hr | Number (e.g. 15) | `erythrocyte sedimentation rate` |
| `FBS` | Fasting blood glucose | mg/dL | Number (e.g. 95) | `fasting blood glucose` |
| `CR` | Serum creatinine | mg/dL | Decimal number (e.g. 1.0) | `serum creatinine` |
| `BUN` | Blood urea nitrogen (BUN) | mg/dL | Number (e.g. 14) | `blood urea nitrogen` |
| `Na` | Sodium | mEq/L | Number (e.g. 140) | `sodium` |
| `K` | Potassium | mEq/L | Decimal number (e.g. 4.2) | `potassium` |
| `TG` | Triglycerides | mg/dL | Number (e.g. 120) | `triglycerides` |
| `HDL` | HDL cholesterol | mg/dL | Number (e.g. 45) | `hdl cholesterol` |
| `LDL` | LDL cholesterol | mg/dL | Number (e.g. 90) | `ldl cholesterol` |

### Outpatient Note (31 fields)
| Key | Label to Print | Unit to Print | Accepted Value Spellings | Matched Synonym in `field_synonyms.json` |
|---|---|---|---|---|
| `Age` | Age | years | Integer number (e.g. 52) | `age` |
| `Sex` | Sex | - | Male, Female | `sex` |
| `Weight` | Weight | kg | Number (e.g. 74) | `weight` |
| `Length` | Height | cm | Number (e.g. 172) | `height` |
| `BMI` | Body mass index | kg/m2 | Two decimals (e.g. 25.01) | `body mass index` |
| `BP` | Blood pressure | mmHg | Systolic/Diastolic (e.g. 130/80) | `blood pressure` |
| `PR` | Pulse rate | bpm | Number (e.g. 72) | `pulse rate` |
| `Function Class` | Function class (NYHA) | class | Roman numeral (I, II, III, IV) or Class 0 | `function class` |
| `DM` | Diabetes mellitus | - | Yes, No | `diabetes mellitus` |
| `HTN` | Hypertension | - | Yes, No | `hypertension` |
| `Current Smoker` | Current smoker | - | Yes, No | `current smoker` |
| `EX-Smoker` | Ex-smoker | - | Yes, No | `ex-smoker` |
| `FH` | Family history of CAD | - | Yes, No | `family history of cad` |
| `Obesity` | Obesity | - | Yes, No | `obesity` |
| `CRF` | Chronic renal failure | - | Yes, No | `chronic renal failure` |
| `CVA` | Cerebrovascular accident (stroke) | - | Yes, No | `cerebrovascular accident` |
| `Airway disease` | Airway disease (asthma, COPD) | - | Yes, No | `airway disease` |
| `Thyroid Disease` | Thyroid disease | - | Yes, No | `thyroid disease` |
| `CHF` | Congestive heart failure | - | Yes, No | `congestive heart failure` |
| `DLP` | Dyslipidemia | - | Yes, No | `dyslipidemia` |
| `Typical Chest Pain` | Typical chest pain | - | Yes, No | `typical chest pain` |
| `Atypical` | Atypical chest pain | - | Yes, No | `atypical chest pain` |
| `Nonanginal` | Non-anginal chest pain | - | Yes, No | `non-anginal chest pain` |
| `Exertional CP` | Exertional chest pain | - | Yes, No | `exertional chest pain` |
| `LowTH Ang` | Low threshold angina | - | Yes, No | `low threshold angina` |
| `Dyspnea` | Dyspnea | - | Yes, No | `dyspnea` |
| `Edema` | Edema | - | Yes, No | `edema` |
| `Weak Peripheral Pulse` | Weak peripheral pulse | - | Yes, No | `weak peripheral pulse` |
| `Lung rales` | Lung rales | - | Yes, No | `lung rales` |
| `Systolic Murmur` | Systolic murmur | - | Yes, No | `systolic murmur` |
| `Diastolic Murmur` | Diastolic murmur | - | Yes, No | `diastolic murmur` |

---

## 3. LaTeX Toolchain Detection (Task 0.4)

- **Engine Detected**: `pdflatex`.
- **Distribution & Version**: `MiKTeX-pdfTeX 4.23 (MiKTeX 25.12)`.
- **Installation Method**: Installed via Windows Package Manager (`winget install --id MiKTeX.MiKTeX -e --silent`).
- **Executable Location**: `C:\Users\Shrey\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe`.
- **On-the-fly Package Installation**: Enabled via `initexmf --set-config-value [MPM]AutoInstall=1`.
