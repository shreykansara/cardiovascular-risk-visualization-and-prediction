# Synthetic Clinical Sample Reports

This directory contains realistic, synthetic, text-layer clinical PDF reports generated via LaTeX for all stored sample patient presets (`normal`, `high_risk_lad`, `rca_ischemia`, `triple_vessel`), along with test variants and intake edge cases.

All values are derived directly from the canonical preset definitions in [`apps/web/src/store/usePatientStore.ts`](../../apps/web/src/store/usePatientStore.ts). Values are never hardcoded or hand-typed.

---

## 1. Directory Structure

```
docs/sample-reports/
├── NOTES.md                     # Setup inventory, mappings, and unit survival test results
├── ROUNDTRIP.md                 # Automated round-trip verification results report
├── README.md                    # This documentation file
├── presets/                     # Canonical 4-modality test reports for each preset
│   ├── normal/
│   │   ├── ecg_report.pdf / .tex
│   │   ├── echo_report.pdf / .tex
│   │   ├── blood_lab_report.pdf / .tex
│   │   └── outpatient_note.pdf / .tex
│   ├── high_risk_lad/
│   │   └── ... (4 PDFs + 4 .tex)
│   ├── rca_ischemia/
│   │   └── ... (4 PDFs + 4 .tex)
│   └── triple_vessel/
│       └── ... (4 PDFs + 4 .tex)
├── variants/                    # Parser variant test reports
│   ├── normal/
│   │   ├── lab_si_units.pdf / .tex      # SI unit conversions (mmol/L, umol/L, g/L)
│   │   ├── lab_partial.pdf / .tex       # Specimen with 7 tests omitted
│   │   ├── ecg_impression_only.pdf/.tex # Narrative-only impression (free-text fallback)
│   │   └── ehr_narrative.pdf / .tex     # Narrative history/exam (positive mentions only)
│   └── ...
└── edge-cases/                  # Error and intake boundary test files
    ├── scanned_no_text.pdf      # Pure raster image PDF with zero text characters
    ├── encrypted.pdf            # Password-protected PDF
    └── not_a_pdf.pdf            # Plain text file with .pdf extension
```

---

## 2. Modalities and Field Ownership

Each preset generates four PDF reports with mutually exclusive schema section ownership:

| Modality | Schema Section | Field Count | Key Clinical Elements |
|---|---|---|---|
| **ECG Report** | ECG | 7 | Q wave, ST elevation, ST depression, T inversion, LVH, Poor R progression, BBB |
| **Echo Report** | Echocardiography | 3 | Ejection fraction (EF-TTE), Regions with RWMA, Valvular heart disease (VHD) |
| **Blood Lab Report** | Laboratory | 14 | Complete blood count (HB, WBC, Neut %, Lymph %, PLT, ESR), Renal/Electrolytes (FBS, CR, BUN, Na, K), Lipids (TG, HDL, LDL) + Friedewald distractor rows |
| **Outpatient Note** | Demographics & Clinical Examination | 31 | Demographics (Age, Sex, Height, Weight, BMI), Vitals (BP, PR), NYHA Function Class, Medical History (12 conditions), Symptoms & Physical Exam (11 signs) |

**Total Fields Covered:** 55 / 55 schema fields across 4 reports.

---

## 3. How to Run Generation & Verification

### Generate All Reports
```bash
python scripts/build_sample_reports.py
```
Options:
- `--preset <id>`: Generate reports for a single preset (e.g. `--preset normal`).
- `--date <YYYY-MM-DD>`: Specify report header date (default: `2026-03-15`).
- `--no-variants`: Skip variant generation.
- `--no-edge-cases`: Skip edge-case generation.
- `--keep-intermediates`: Retain intermediate `.aux` and `.log` files.

### Run Round-Trip Verification Test Suite
```bash
python scripts/roundtrip_reports.py
```
This script:
1. Ingests the four PDFs for each of the 4 presets through the extraction pipeline.
2. Asserts that each document populates only its owned schema section.
3. Compares the 55 extracted fields against the canonical preset values (asserting 55/55 match).
4. Verifies evidence string limits (`<= 80` chars) and ensures no patient identifiers leak into evidence.
5. Verifies variant reports (SI unit conversion, partial panels, free-text impression, narrative notes).
6. Verifies edge cases (`no_text_layer`, `encrypted`, `not_pdf` error codes).
7. Writes [`ROUNDTRIP.md`](ROUNDTRIP.md).

### Run Existing Extraction Tests
```bash
python -m pytest apps/api/tests/test_extraction.py
```
