# Clinical Report Ingestion Format Specification

This document details the recommended layout and supported vocabulary for the four report types ingestion backbone.
Deterministic parsers parse files directly in memory using exact keyword matching, regex grammar, and unit conversion tables.

> [!IMPORTANT]
> **Text Layer Requirement**: Scanned image-only PDFs without a readable OCR/text layer are **not** supported.
> The parser expects searchable text characters (`%PDF-` with standard text streams). Documents with fewer than 40 non-whitespace characters return `no_text_layer`.

---

## ECG report (`ecg`)

**Purpose**: Extracts resting 12-lead electrocardiographic findings and conduction disturbances.
**Total Owned Fields**: 7 fields.

### Recommended Layout
1. **Title line**: Include the report name near the top of Page 1 (e.g., `"ECG report"`).
2. **Identifier header block**: Standard hospital headers (e.g. `Patient Name: John Doe`, `MRN: 12345`, `DOB: 1965-04-12`) are automatically ignored.
3. **Structured Table**: The parser reads best from clean tabular layouts with columns: `Finding | Status`.

| Finding | Status |
|---|---|
| Pathological Q waves | Absent |
| ST Elevation | Present |
| ST Depression | Absent |
| T-wave Inversion | Present |
| Left Ventricular Hypertrophy | Absent |
| Poor R Wave Progression | Absent |
| Bundle Branch Block | LBBB |

### Owned Fields Catalog & Accepted Synonyms

| Key | Label | Schema Unit | Allowed Values | Accepted Synonyms |
|---|---|---|---|---|
| `Q Wave` | Pathologic Q-Wave | - | '0', '1' | `pathological q waves`, `pathological q wave`, `pathologic q wave`, `pathologic q-wave`, `q waves`, `q wave` |
| `St Elevation` | ST-Segment Elevation | - | '0', '1' | `st segment elevation`, `st-segment elevation`, `st elevation`, `ste` |
| `St Depression` | ST-Segment Depression | - | '0', '1' | `st segment depression`, `st-segment depression`, `st depression`, `std` |
| `Tinversion` | T-Wave Inversion | - | '0', '1' | `t wave inversion`, `t-wave inversion`, `inverted t waves`, `t inversion`, `twi` |
| `LVH` | Left Ventricular Hypertrophy | - | 'N', 'Y' | `left ventricular hypertrophy`, `lvh` |
| `Poor R Progression` | Poor R-Wave Progression | - | 'N', 'Y' | `poor r wave progression`, `poor r-wave progression`, `poor r progression`, `prwp` |
| `BBB` | Bundle Branch Block | - | 'N', 'LBBB', 'RBBB' | `bundle branch block`, `left bundle branch block`, `right bundle branch block`, `lbbb`, `rbbb`, `bbb` |

### Missing Fields and Confidence Rules
- **Missing values**: If a row or test is absent from the report, it is **never** filled with default values (it is returned in `not_found` and remains empty in the UI form).
- **Confidence `high`**: Assigned when an explicit value is found with declared schema units in structured rows.
- **Confidence `check`**: Assigned when:
  - The report omitted the unit and the schema default unit was assumed;
  - A numeric range was provided (e.g. `50-55 %`) and the midpoint was calculated;
  - A conversion from blood urea to BUN was performed;
  - An abnormal wall motion region count was derived from descriptive text;
  - A derived BMI was calculated from reported height and weight;
  - Free-text fallback negation detection was utilized.

---

## Echo report (`echo`)

**Purpose**: Extracts transthoracic echocardiographic systolic parameters, regional wall motion abnormality scores, and valvulopathy grades.
**Total Owned Fields**: 3 fields.

### Recommended Layout
1. **Title line**: Include the report name near the top of Page 1 (e.g., `"Echo report"`).
2. **Identifier header block**: Standard hospital headers (e.g. `Patient Name: John Doe`, `MRN: 12345`, `DOB: 1965-04-12`) are automatically ignored.
3. **Structured Table**: The parser reads best from clean tabular layouts with columns: `Parameter | Value`.

| Parameter | Value |
|---|---|
| Left Ventricular Ejection Fraction (LVEF) | 52% |
| Regional Wall Motion Abnormality | 1: Anterior Wall RWMA |
| Valvular Heart Disease | Mild regurgitation |

### Owned Fields Catalog & Accepted Synonyms

| Key | Label | Schema Unit | Allowed Values | Accepted Synonyms |
|---|---|---|---|---|
| `EF-TTE` | Ejection Fraction (TTE) | % | - | `ejection fraction (tte)`, `ejection fraction`, `ef (tte)`, `ef-tte`, `lvef`, `ef` |
| `Region RWMA` | Regional Wall Motion Abnormality | score | '0', '1', '2', '3', '4' | `regional wall motion abnormality`, `regional wall motion abnormalities`, `regions with rwma`, `wall motion abnormality`, `rwma` |
| `VHD` | Valvular Heart Disease | grade | 'N', 'mild', 'Moderate', 'Severe' | `valvular heart disease`, `valve disease`, `valvulopathy`, `vhd` |

### Missing Fields and Confidence Rules
- **Missing values**: If a row or test is absent from the report, it is **never** filled with default values (it is returned in `not_found` and remains empty in the UI form).
- **Confidence `high`**: Assigned when an explicit value is found with declared schema units in structured rows.
- **Confidence `check`**: Assigned when:
  - The report omitted the unit and the schema default unit was assumed;
  - A numeric range was provided (e.g. `50-55 %`) and the midpoint was calculated;
  - A conversion from blood urea to BUN was performed;
  - An abnormal wall motion region count was derived from descriptive text;
  - A derived BMI was calculated from reported height and weight;
  - Free-text fallback negation detection was utilized.

---

## Blood lab report (`lab`)

**Purpose**: Extracts serum chemistry, hematology, lipid panel, and renal biomarkers.
**Total Owned Fields**: 14 fields.

### Recommended Layout
1. **Title line**: Include the report name near the top of Page 1 (e.g., `"Blood lab report"`).
2. **Identifier header block**: Standard hospital headers (e.g. `Patient Name: John Doe`, `MRN: 12345`, `DOB: 1965-04-12`) are automatically ignored.
3. **Structured Table**: The parser reads best from clean tabular layouts with columns: `Test | Result | Unit | Reference range`.

| Test | Result | Unit | Reference range |
|---|---|---|---|
| Fasting Blood Glucose | 118 | mg/dL | 70 - 99 |
| Serum Creatinine | 1.1 | mg/dL | 0.7 - 1.3 |
| Triglycerides | 185 | mg/dL | < 150 |
| LDL Cholesterol | 132 | mg/dL | < 100 |
| HDL Cholesterol | 38 | mg/dL | > 40 |
| Blood Urea Nitrogen | 21 | mg/dL | 7 - 20 |
| ESR | 18 | mm/hr | 0 - 20 |
| Hemoglobin | 13.8 | g/dL | 12.0 - 16.0 |
| Potassium | 4.3 | mEq/L | 3.5 - 5.1 |
| Sodium | 142 | mEq/L | 136 - 145 |
| White Blood Cells | 7400 | /mcL | 4000 - 11000 |
| Lymphocytes (%) | 29 | % | 20 - 40 |
| Neutrophils (%) | 64 | % | 40 - 75 |
| Platelets | 225 | x10³/mcL | 150 - 450 |

### Owned Fields Catalog & Accepted Synonyms

| Key | Label | Schema Unit | Allowed Values | Accepted Synonyms |
|---|---|---|---|---|
| `FBS` | Fasting Blood Sugar | mg/dL | - | `fasting blood glucose`, `fasting plasma glucose`, `fasting blood sugar`, `glucose fasting`, `fasting glucose`, `fbs`, *+2 more* |
| `CR` | Serum Creatinine | mg/dL | - | `serum creatinine`, `creatinine`, `cr` |
| `TG` | Triglycerides | mg/dL | - | `serum triglycerides`, `triglycerides`, `triglyceride`, `tgl`, `tg` |
| `LDL` | Low-Density Lipoprotein (LDL) | mg/dL | - | `low density lipoprotein`, `low-density lipoprotein`, `ldl cholesterol`, `ldl-c`, `ldl` |
| `HDL` | High-Density Lipoprotein (HDL) | mg/dL | - | `high density lipoprotein`, `high-density lipoprotein`, `hdl cholesterol`, `hdl-c`, `hdl` |
| `BUN` | Blood Urea Nitrogen | mg/dL | - | `blood urea nitrogen`, `urea nitrogen`, `blood urea`, `urea`, `bun` |
| `ESR` | Erythrocyte Sedimentation Rate | mm/hr | - | `erythrocyte sedimentation rate`, `sed rate`, `esr` |
| `HB` | Hemoglobin | g/dL | - | `hemoglobin`, `haemoglobin`, `hgb`, `hb` |
| `K` | Serum Potassium | mEq/L | - | `serum potassium`, `potassium`, `k+`, `k` |
| `Na` | Serum Sodium | mEq/L | - | `serum sodium`, `sodium`, `na+`, `na` |
| `WBC` | White Blood Cell Count | /mcL | - | `white blood cell count`, `total leukocyte count`, `total leucocyte count`, `white blood cells`, `tlc`, `wbc` |
| `Lymph` | Lymphocyte Percentage | % | - | `lymphocyte percentage`, `lymphocytes (%)`, `lymphocyte %`, `lymphocytes`, `lymph` |
| `Neut` | Neutrophil Percentage | % | - | `neutrophil percentage`, `neutrophils (%)`, `neutrophil %`, `neutrophils`, `polymorphs`, `neut` |
| `PLT` | Platelet Count | x10³/mcL | - | `platelet count`, `platelets`, `plt` |

### Missing Fields and Confidence Rules
- **Missing values**: If a row or test is absent from the report, it is **never** filled with default values (it is returned in `not_found` and remains empty in the UI form).
- **Confidence `high`**: Assigned when an explicit value is found with declared schema units in structured rows.
- **Confidence `check`**: Assigned when:
  - The report omitted the unit and the schema default unit was assumed;
  - A numeric range was provided (e.g. `50-55 %`) and the midpoint was calculated;
  - A conversion from blood urea to BUN was performed;
  - An abnormal wall motion region count was derived from descriptive text;
  - A derived BMI was calculated from reported height and weight;
  - Free-text fallback negation detection was utilized.

---

## Outpatient note (`ehr`)

**Purpose**: Extracts patient demographics, vital signs, clinical medical history, physical exam findings, and chest pain symptom classification.
**Total Owned Fields**: 31 fields.

### Recommended Layout
1. **Title line**: Include the report name near the top of Page 1 (e.g., `"Outpatient note"`).
2. **Identifier header block**: Standard hospital headers (e.g. `Patient Name: John Doe`, `MRN: 12345`, `DOB: 1965-04-12`) are automatically ignored.
3. **Structured Table**: The parser reads best from clean tabular layouts with columns: `Parameter / Finding | Value / Status`.

| Parameter | Value |
|---|---|
| Patient Age | 62 years |
| Biological Sex | Male |
| Body Weight | 78 kg |
| Body Height | 172 cm |
| Blood Pressure | 140/85 mmHg |
| Resting Pulse Rate | 78 bpm |
| Diabetes Mellitus | Yes |
| Hypertension | Yes |
| NYHA Functional Class | Class II |

### Owned Fields Catalog & Accepted Synonyms

| Key | Label | Schema Unit | Allowed Values | Accepted Synonyms |
|---|---|---|---|---|
| `Age` | Patient Age | years | - | `patient age`, `age` |
| `Sex` | Biological Sex | - | 'Male', 'Female' | `biological sex`, `gender`, `sex` |
| `Weight` | Body Weight | kg | - | `body weight`, `weight`, `wt` |
| `Length` | Height / Length | cm | - | `body height`, `height`, `length`, `ht` |
| `BMI` | Body Mass Index | kg/m² | - | `body mass index`, `bmi` |
| `BP` | Systolic Blood Pressure | mmHg | - | `resting blood pressure`, `systolic blood pressure`, `blood pressure`, `systolic bp`, `bp` |
| `PR` | Resting Pulse Rate | bpm | - | `resting heart rate`, `resting pulse rate`, `pulse rate`, `heart rate`, `pulse`, `hr`, *+1 more* |
| `DM` | Diabetes Mellitus | - | '0', '1' | `diabetes mellitus`, `diabetes`, `dm` |
| `HTN` | Hypertension | - | '0', '1' | `high blood pressure`, `hypertension`, `htn` |
| `Current Smoker` | Current Smoker | - | '0', '1' | `active smoker`, `current smoker`, `tobacco use`, `smoker`, `smoking` |
| `EX-Smoker` | Ex-Smoker | - | '0', '1' | `former smoker`, `past smoker`, `ex-smoker`, `ex smoker` |
| `FH` | Family History of CAD | - | '0', '1' | `family history of premature cad`, `family history of heart disease`, `family history of cad`, `family history`, `fh` |
| `Obesity` | Clinical Obesity | - | 'N', 'Y' | `clinical obesity`, `clinically obese`, `obese`, `obesity` |
| `CRF` | Chronic Renal Failure | - | 'N', 'Y' | `chronic kidney disease`, `chronic renal failure`, `renal failure`, `ckd`, `crf` |
| `CVA` | Cerebrovascular Accident | - | 'N', 'Y' | `cerebrovascular accident`, `transient ischemic attack`, `stroke`, `tia`, `cva` |
| `Airway disease` | Airway / Lung Disease | - | 'N', 'Y' | `chronic obstructive pulmonary disease`, `airway disease`, `pulmonary disease`, `asthma`, `copd` |
| `Thyroid Disease` | Thyroid Dysfunction | - | 'N', 'Y' | `thyroid dysfunction`, `thyroid disease`, `hypothyroidism`, `hyperthyroidism` |
| `CHF` | Congestive Heart Failure | - | 'N', 'Y' | `congestive heart failure`, `heart failure`, `chf`, `hf` |
| `DLP` | Dyslipidemia | - | 'N', 'Y' | `hypercholesterolemia`, `hyperlipidemia`, `dyslipidemia`, `dlp`, `hld` |
| `Edema` | Peripheral Edema | - | '0', '1' | `peripheral edema`, `peripheral oedema`, `pedal edema`, `ankle edema`, `oedema`, `edema` |
| `Weak Peripheral Pulse` | Weak Peripheral Pulse | - | 'N', 'Y' | `diminished peripheral pulses`, `diminished peripheral pulse`, `weak peripheral pulse`, `absent peripheral pulse`, `weak pulse` |
| `Lung rales` | Pulmonary Rales | - | 'N', 'Y' | `pulmonary crepitations`, `pulmonary crackles`, `pulmonary rales`, `crepitations`, `lung rales`, `crackles`, *+1 more* |
| `Systolic Murmur` | Systolic Murmur | - | 'N', 'Y' | `ejection systolic murmur`, `systolic heart murmur`, `pansystolic murmur`, `systolic murmur` |
| `Diastolic Murmur` | Diastolic Murmur | - | 'N', 'Y' | `early diastolic murmur`, `diastolic heart murmur`, `diastolic murmur` |
| `Typical Chest Pain` | Typical Chest Pain | - | '0', '1' | `typical chest pain`, `substernal chest pain`, `exertional angina`, `typical angina`, `angina pectoris` |
| `Dyspnea` | Exertional Dyspnea | - | 'N', 'Y' | `shortness of breath`, `exertional dyspnea`, `breathlessness`, `dyspnea`, `sob` |
| `Function Class` | NYHA Functional Class | class | '0', '1', '2', '3' | `nyha functional class`, `functional class`, `function class`, `nyha class`, `nyha` |
| `Atypical` | Atypical Angina | - | 'N', 'Y' | `atypical chest pain`, `atypical angina`, `atypical cp`, `atypical` |
| `Nonanginal` | Non-Anginal Chest Pain | - | 'N', 'Y' | `non-anginal chest pain`, `non anginal chest pain`, `nonanginal chest pain`, `non-cardiac chest pain`, `non-anginal`, `nonanginal` |
| `Exertional CP` | Exertional Chest Pain | - | 'N', 'Y' | `chest pain on exertion`, `exertional chest pain`, `exertional cp`, `pain on exertion` |
| `LowTH Ang` | Low-Threshold Angina | - | 'N', 'Y' | `low-threshold angina`, `low threshold angina`, `low-threshold cp`, `rest angina`, `lowth ang` |

### Missing Fields and Confidence Rules
- **Missing values**: If a row or test is absent from the report, it is **never** filled with default values (it is returned in `not_found` and remains empty in the UI form).
- **Confidence `high`**: Assigned when an explicit value is found with declared schema units in structured rows.
- **Confidence `check`**: Assigned when:
  - The report omitted the unit and the schema default unit was assumed;
  - A numeric range was provided (e.g. `50-55 %`) and the midpoint was calculated;
  - A conversion from blood urea to BUN was performed;
  - An abnormal wall motion region count was derived from descriptive text;
  - A derived BMI was calculated from reported height and weight;
  - Free-text fallback negation detection was utilized.

---

## Layout Tips for LaTeX

When generating sample LaTeX reports for testing or clinical templates:
1. **Standard Fonts**: Use standard Computer Modern, Latin Modern, or Helvetica (`lmodern`, `helvet`). Do not embed text inside flattened images.
2. **Tabular Environments**: Use `tabular`, `tabularx`, or `booktabs` with clear column separation (e.g. `&` separators). LaTeX tables with clean horizontal rules (`\toprule`, `\midrule`, `\bottomrule`) parse with high accuracy.
3. **Explicit Units**: State units in a dedicated `Unit` column or immediately following the numeric result (e.g., `118 mg/dL` or separate column).
4. **No Rotated or Scaled Text**: Avoid rotating text or placing tabular data inside rotated minipages or multi-column nested graphics.
5. **Clean Multi-row Headers**: Use a single table header row with standard column headers like `Test`, `Result`, `Unit`, `Reference Range`.

---
Generated by `scripts/make-report-format-doc.py` from `field_specs.json` and `field_synonyms.json`.
