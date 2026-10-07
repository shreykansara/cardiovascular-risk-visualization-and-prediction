"""
Echocardiography Report Generator (3 schema fields).
Fields owned: EF-TTE, Region RWMA, VHD.
"""

from typing import Any, Dict
from .common import assert_label_matches_synonyms, get_preamble_content, render_latex_header
from .data import DecorativeConstants, PatientHeader, PatientPreset, format_number, format_rwma, format_vhd

ECHO_LABELS = {
    "EF-TTE": "Ejection fraction",
    "Region RWMA": "Regions with RWMA",
    "VHD": "Valvular heart disease",
}

def validate_echo_labels() -> None:
    for key, label in ECHO_LABELS.items():
        assert_label_matches_synonyms(key, label)

def generate_echo_tex(preset: PatientPreset, header: PatientHeader) -> str:
    """Generates complete LaTeX source for an Echocardiography report."""
    validate_echo_labels()
    d = preset.data

    ef_val = format_number("EF-TTE", d.get("EF-TTE"))
    rwma_val = format_rwma(d.get("Region RWMA"))
    vhd_val = format_vhd(d.get("VHD"))

    lvedd = DecorativeConstants.ECHO_LVEDD_MM
    lvesd = DecorativeConstants.ECHO_LVESD_MM
    ivs = DecorativeConstants.ECHO_IVS_MM
    la = DecorativeConstants.ECHO_LA_MM
    ao = DecorativeConstants.ECHO_AO_ROOT_MM

    # Valve status setup
    if vhd_val == "Normal":
        mv_desc = "Normal leaflet morphology and motion; no regurgitation"
        mv_grade = "Normal"
        av_desc = "Trileaflet valve; normal excursion; no aortic insufficiency"
        av_grade = "Normal"
        tv_desc = "Normal tricuspid valve; trace physiological regurgitation"
        tv_grade = "Normal"
        pv_desc = "Normal pulmonic valve structure"
        pv_grade = "Normal"
    elif vhd_val == "Mild":
        mv_desc = "Mild mitral regurgitation; central jet area < 4 cm2"
        mv_grade = "Mild"
        av_desc = "Trileaflet valve; normal excursion; no stenosis"
        av_grade = "Normal"
        tv_desc = "Normal tricuspid leaflets; trace regurgitation"
        tv_grade = "Normal"
        pv_desc = "Normal pulmonic valve structure"
        pv_grade = "Normal"
    elif vhd_val == "Moderate":
        mv_desc = "Moderate mitral regurgitation; leaflet thickening; vena contracta 0.45 cm"
        mv_grade = "Moderate"
        av_desc = "Mild aortic sclerosis without hemodynamically significant gradient"
        av_grade = "Mild"
        tv_desc = "Mild tricuspid regurgitation; estimated PASP 32 mmHg"
        tv_grade = "Mild"
        pv_desc = "Normal pulmonic valve structure"
        pv_grade = "Normal"
    else:  # Severe
        mv_desc = "Severe regurgitation; flail posterior leaflet; holosystolic flow reversal"
        mv_grade = "Severe"
        av_desc = "Mild aortic valve sclerosis"
        av_grade = "Mild"
        tv_desc = "Moderate tricuspid regurgitation"
        tv_grade = "Moderate"
        pv_desc = "Normal pulmonic valve structure"
        pv_grade = "Normal"

    # Wall motion narrative
    rwma_num = int(rwma_val)
    if rwma_num == 0:
        wall_motion_summary = "Normal left ventricular systolic performance without regional wall motion abnormalities."
    elif rwma_num == 1:
        wall_motion_summary = "Regional wall motion abnormality identified: hypokinesis of the anterior wall (LAD territory)."
    elif rwma_num == 2:
        wall_motion_summary = "Regional wall motion abnormality identified: hypokinesis/akinesis of the basal and mid inferior walls (RCA territory)."
    else:
        wall_motion_summary = "Multiple regional wall motion abnormalities: severe hypokinesis/akinesis involving anterior, septal, and inferior segments."

    preamble = get_preamble_content()
    header_tex = render_latex_header(header, "Transthoracic Echocardiogram (TTE) Report", "Echocardiography Core Laboratory")

    content = f"""{preamble}

\\begin{{document}}

{header_tex}

\\section*{{Quantitative Chamber Dimensions & Wall Thickness}}

\\begin{{tabular*}}{{\\textwidth}}{{@{{\\extracolsep{{\\fill}}}} l l l l l @{{}}}}
  \\textbf{{LVEDD:}} {lvedd} mm (42--59) & \\textbf{{LVESD:}} {lvesd} mm (25--40) & \\textbf{{IVS:}} {ivs} mm (6--11) & \\textbf{{LA Dimension:}} {la} mm (30--40) & \\textbf{{Aortic Root:}} {ao} mm (20--37) \\\\
\\end{{tabular*}}

\\vspace{{10pt}}

\\section*{{Left Ventricular Systolic Function \\& Wall Motion}}

\\begin{{tabular}}{{@{{}} p{{7.2cm}} p{{3.0cm}} p{{6.4cm}} @{{}}}}
  \\toprule
  \\textbf{{Parameter}} & \\textbf{{Observed Value}} & \\textbf{{Reference / Notes}} \\\\
  \\midrule
  {ECHO_LABELS['EF-TTE']} & {ef_val} \\% & Normal: $\\ge 55$\\% (Simpson biplane) \\\\
  {ECHO_LABELS['Region RWMA']} & {rwma_val} & Discrete abnormal coronary territories \\\\
  \\bottomrule
\\end{{tabular}}

\\vspace{{10pt}}

\\section*{{Valvular Assessment}}

\\begin{{tabular}}{{@{{}} p{{3.8cm}} p{{9.6cm}} p{{3.2cm}} @{{}}}}
  \\toprule
  \\textbf{{Valve Structure}} & \\textbf{{Doppler / Color Flow Findings}} & \\textbf{{Functional Grade}} \\\\
  \\midrule
  Mitral valve & {mv_desc} & {mv_grade} \\\\
  Aortic valve & {av_desc} & {av_grade} \\\\
  Tricuspid valve & {tv_desc} & {tv_grade} \\\\
  Pulmonic valve & {pv_desc} & {pv_grade} \\\\
  \\bottomrule
\\end{{tabular}}

\\vspace{{10pt}}

\\section*{{Summary \\& Conclusion}}

\\noindent
\\textbf{{Systolic Function:}} LVEF {ef_val}\\%. {wall_motion_summary}\\\\
\\textbf{{Regional Wall Motion:}} Regions with RWMA: {rwma_val}.\\\\
\\textbf{{Valvular Heart Disease:}} Highest valvular grade: {vhd_val}.

\\vspace{{18pt}}

\\noindent
\\begin{{tabular*}}{{\\textwidth}}{{@{{\\extracolsep{{\\fill}}}} l r @{{}}}}
  \\textbf{{Examining Cardiologist:}} Dr. M. Echo, MD, FASE & \\textbf{{Date Verified:}} {header.date_str} \\\\
\\end{{tabular*}}

\\end{{document}}
"""
    return content
