"""
Blood Lab Report Generator (14 schema fields + distractor lipid rows).
Fields owned: HB, WBC, Neut, Lymph, PLT, ESR, FBS, CR, BUN, Na, K, TG, HDL, LDL.
"""

from typing import Any, Dict
from .common import assert_label_matches_synonyms, get_preamble_content, render_latex_header
from .data import (
    PatientHeader,
    PatientPreset,
    compute_derived_lipids,
    format_number,
)

LAB_LABELS = {
    "HB": "Hemoglobin",
    "WBC": "Total leucocyte count",
    "Neut": "Neutrophils (%)",
    "Lymph": "Lymphocytes (%)",
    "PLT": "Platelet count",
    "ESR": "Erythrocyte sedimentation rate",
    "FBS": "Fasting blood glucose",
    "CR": "Serum creatinine",
    "BUN": "Blood urea nitrogen",
    "Na": "Sodium",
    "K": "Potassium",
    "TG": "Triglycerides",
    "HDL": "HDL cholesterol",
    "LDL": "LDL cholesterol",
}

def validate_lab_labels() -> None:
    for key, label in LAB_LABELS.items():
        assert_label_matches_synonyms(key, label)

def generate_lab_tex(
    preset: PatientPreset,
    header: PatientHeader,
    use_si_units: bool = False,
    omit_partial: bool = False,
) -> str:
    """
    Generates complete LaTeX source for a Blood Lab report.
    Supports standard US customary units, SI units variant, and partial omission variant.
    """
    validate_lab_labels()
    d = preset.data
    derived = compute_derived_lipids(d)

    # Unit setups
    if not use_si_units:
        hb_unit = "g/dL"
        hb_val = format_number("HB", d.get("HB"))
        hb_ref = "13.0--17.0"

        wbc_unit = "cells/uL"
        wbc_val = format_number("WBC", d.get("WBC"))
        wbc_ref = "4,000--11,000"

        plt_unit = "10\\textasciicircum 3/uL"
        plt_val = format_number("PLT", d.get("PLT"))
        plt_ref = "150--450"

        fbs_unit = "mg/dL"
        fbs_val = format_number("FBS", d.get("FBS"))
        fbs_ref = "70--99"

        cr_unit = "mg/dL"
        cr_val = format_number("CR", d.get("CR"))
        cr_ref = "0.6--1.2"

        bun_unit = "mg/dL"
        bun_val = format_number("BUN", d.get("BUN"))
        bun_ref = "7--20"

        tg_unit = "mg/dL"
        tg_val = format_number("TG", d.get("TG"))
        tg_ref = "< 150"

        hdl_unit = "mg/dL"
        hdl_val = format_number("HDL", d.get("HDL"))
        hdl_ref = "> 40"

        ldl_unit = "mg/dL"
        ldl_val = format_number("LDL", d.get("LDL"))
        ldl_ref = "< 100"

        na_unit = "mEq/L"
        na_val = format_number("Na", d.get("Na"))
        na_ref = "136--145"

        k_unit = "mEq/L"
        k_val = format_number("K", d.get("K"))
        k_ref = "3.5--5.0"
    else:
        # SI units variant:
        # Glucose: mmol/L (mg/dL / 18.016)
        # Creatinine: umol/L (mg/dL * 88.4)
        # Cholesterol: mmol/L (mg/dL / 38.67)
        # Triglycerides: mmol/L (mg/dL / 88.57)
        # Hemoglobin: g/L (g/dL * 10)
        # Urea: mmol/L (BUN mg/dL / 2.801)
        hb_unit = "g/L"
        hb_val = f"{float(d.get('HB', 14.0)) * 10.0:.1f}"
        hb_ref = "130--170"

        wbc_unit = "cells/uL"
        wbc_val = format_number("WBC", d.get("WBC"))
        wbc_ref = "4,000--11,000"

        plt_unit = "10\\textasciicircum 3/uL"
        plt_val = format_number("PLT", d.get("PLT"))
        plt_ref = "150--450"

        fbs_unit = "mmol/L"
        fbs_val = f"{float(d.get('FBS', 90.0)) / 18.016:.2f}"
        fbs_ref = "3.9--5.5"

        cr_unit = "umol/L"
        cr_val = f"{float(d.get('CR', 1.0)) * 88.4:.1f}"
        cr_ref = "53--106"

        bun_unit = "mmol/L"
        bun_val = f"{float(d.get('BUN', 14.0)) / 2.801:.2f}"
        bun_ref = "2.5--7.1"

        tg_unit = "mmol/L"
        tg_val = f"{float(d.get('TG', 120.0)) / 88.57:.2f}"
        tg_ref = "< 1.7"

        hdl_unit = "mmol/L"
        hdl_val = f"{float(d.get('HDL', 45.0)) / 38.67:.2f}"
        hdl_ref = "> 1.0"

        ldl_unit = "mmol/L"
        ldl_val = f"{float(d.get('LDL', 90.0)) / 38.67:.2f}"
        ldl_ref = "< 2.6"

        na_unit = "mmol/L"
        na_val = format_number("Na", d.get("Na"))
        na_ref = "136--145"

        k_unit = "mmol/L"
        k_val = format_number("K", d.get("K"))
        k_ref = "3.5--5.0"

    neut_val = format_number("Neut", d.get("Neut"))
    lymph_val = format_number("Lymph", d.get("Lymph"))
    esr_val = format_number("ESR", d.get("ESR"))

    preamble = get_preamble_content()
    header_tex = render_latex_header(header, "Comprehensive Laboratory Panel", "Clinical Pathology & Biochemistry Department")

    # Haematology rows
    haem_rows = [
        f"  {LAB_LABELS['HB']} & {hb_val} & {hb_unit} & {hb_ref} \\\\",
        f"  {LAB_LABELS['WBC']} & {wbc_val} & {wbc_unit} & {wbc_ref} \\\\",
        f"  {LAB_LABELS['Neut']} & {neut_val} & \\% & 40--75 \\\\",
        f"  {LAB_LABELS['Lymph']} & {lymph_val} & \\% & 20--45 \\\\",
        f"  {LAB_LABELS['PLT']} & {plt_val} & {plt_unit} & {plt_ref} \\\\",
    ]
    if not omit_partial:
        haem_rows.append(f"  {LAB_LABELS['ESR']} & {esr_val} & mm/hr & 0--20 \\\\")

    # Biochemistry rows
    bio_rows = [
        f"  {LAB_LABELS['FBS']} & {fbs_val} & {fbs_unit} & {fbs_ref} \\\\",
        f"  {LAB_LABELS['CR']} & {cr_val} & {cr_unit} & {cr_ref} \\\\",
        f"  {LAB_LABELS['BUN']} & {bun_val} & {bun_unit} & {bun_ref} \\\\",
        f"  {LAB_LABELS['Na']} & {na_val} & {na_unit} & {na_ref} \\\\",
        f"  {LAB_LABELS['K']} & {k_val} & {k_unit} & {k_ref} \\\\",
    ]

    # Lipid rows with distractor items
    # Note: If omit_partial is True, we omit 6 selected tests (e.g. ESR, FBS, BUN, Na, K, TG)
    if not omit_partial:
        lipid_rows = [
            f"  Total cholesterol & {derived.total_cholesterol} & mg/dL & < 200 \\\\",
            f"  {LAB_LABELS['TG']} & {tg_val} & {tg_unit} & {tg_ref} \\\\",
            f"  {LAB_LABELS['HDL']} & {hdl_val} & {hdl_unit} & {hdl_ref} \\\\",
            f"  {LAB_LABELS['LDL']} & {ldl_val} & {ldl_unit} & {ldl_ref} \\\\",
            f"  VLDL cholesterol & {derived.vldl} & mg/dL & < 30 \\\\",
            f"  Non-HDL cholesterol & {derived.non_hdl} & mg/dL & < 130 \\\\",
            f"  Cholesterol / HDL ratio & {derived.chol_hdl_ratio} & ratio & < 4.5 \\\\",
        ]
    else:
        # Partial panel: only HDL, LDL
        lipid_rows = [
            f"  {LAB_LABELS['HDL']} & {hdl_val} & {hdl_unit} & {hdl_ref} \\\\",
            f"  {LAB_LABELS['LDL']} & {ldl_val} & {ldl_unit} & {ldl_ref} \\\\",
        ]
        # In partial mode, remove FBS, BUN, Na, K from bio_rows as well to omit exactly 7 fields
        bio_rows = [
            f"  {LAB_LABELS['CR']} & {cr_val} & {cr_unit} & {cr_ref} \\\\",
        ]

    content = f"""{preamble}

\\begin{{document}}

{header_tex}

\\section*{{Haematology \\& Complete Blood Count}}

\\begin{{tabular}}{{@{{}} p{{7.2cm}} p{{3.0cm}} p{{3.2cm}} p{{3.2cm}} @{{}}}}
  \\toprule
  \\textbf{{Test Description}} & \\textbf{{Result}} & \\textbf{{Unit}} & \\textbf{{Reference Range}} \\\\
  \\midrule
{chr(10).join(haem_rows)}
  \\bottomrule
\\end{{tabular}}

\\vspace{{8pt}}

\\section*{{Clinical Biochemistry \\& Renal Profile}}

\\begin{{tabular}}{{@{{}} p{{7.2cm}} p{{3.0cm}} p{{3.2cm}} p{{3.2cm}} @{{}}}}
  \\toprule
  \\textbf{{Test Description}} & \\textbf{{Result}} & \\textbf{{Unit}} & \\textbf{{Reference Range}} \\\\
  \\midrule
{chr(10).join(bio_rows)}
  \\bottomrule
\\end{{tabular}}

\\vspace{{8pt}}

\\section*{{Lipid Panel \\& Atherogenic Risk Markers}}

\\begin{{tabular}}{{@{{}} p{{7.2cm}} p{{3.0cm}} p{{3.2cm}} p{{3.2cm}} @{{}}}}
  \\toprule
  \\textbf{{Test Description}} & \\textbf{{Result}} & \\textbf{{Unit}} & \\textbf{{Reference Range}} \\\\
  \\midrule
{chr(10).join(lipid_rows)}
  \\bottomrule
\\end{{tabular}}

\\vspace{{14pt}}

\\noindent
\\begin{{tabular*}}{{\\textwidth}}{{@{{\\extracolsep{{\\fill}}}} l r @{{}}}}
  \\textbf{{Consultant Chemical Pathologist:}} Dr. L. Pathologist, FRCPath & \\textbf{{Report Released:}} {header.date_str} 14:30 UTC \\\\
\\end{{tabular*}}

\\end{{document}}
"""
    return content
