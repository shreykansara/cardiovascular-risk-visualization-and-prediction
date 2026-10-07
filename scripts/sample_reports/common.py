"""
Shared utilities, header rendering, and synonym assertions for LaTeX report generators.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from .data import PatientHeader

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
PREAMBLE_PATH = Path(__file__).resolve().parent / "preamble.tex"
SYNONYMS_PATH = ROOT_DIR / "apps" / "api" / "app" / "extraction" / "field_synonyms.json"

_SYNONYMS_CACHE: Optional[Dict[str, List[str]]] = None

def get_synonyms() -> Dict[str, List[str]]:
    global _SYNONYMS_CACHE
    if _SYNONYMS_CACHE is None:
        if not SYNONYMS_PATH.exists():
            raise FileNotFoundError(f"field_synonyms.json not found at {SYNONYMS_PATH}")
        _SYNONYMS_CACHE = json.loads(SYNONYMS_PATH.read_text(encoding="utf-8"))
    return _SYNONYMS_CACHE

def assert_label_matches_synonyms(field_key: str, printed_label: str) -> None:
    """
    Asserts at build time that a printed label matches one of the synonyms in field_synonyms.json.
    """
    synonyms = get_synonyms()
    field_syns = synonyms.get(field_key, [])
    norm_label = printed_label.lower().strip()
    if norm_label not in [s.lower().strip() for s in field_syns]:
        raise ValueError(
            f"Label '{printed_label}' for field '{field_key}' does not match any synonym in field_synonyms.json! "
            f"Allowed synonyms: {field_syns}"
        )

def get_preamble_content() -> str:
    """Returns the LaTeX preamble from preamble.tex."""
    if not PREAMBLE_PATH.exists():
        raise FileNotFoundError(f"preamble.tex not found at {PREAMBLE_PATH}")
    return PREAMBLE_PATH.read_text(encoding="utf-8")

def render_latex_header(header: PatientHeader, report_title: str, report_subtitle: str) -> str:
    """
    Renders the standardized patient header block with prominent synthetic sample notices.
    """
    safe_title = report_title.replace("&", r"\&")
    safe_subtitle = report_subtitle.replace("&", r"\&")
    safe_name = header.name.replace("_", " ")

    return f"""% --- Patient and Report Header ---
\\begin{{center}}
  {{\\Large \\textbf{{{header.facility}}}}}\\\\
  \\vspace{{2pt}}
  {{\\normalsize \\textbf{{{safe_title.upper()}}}}}\\\\
  \\vspace{{1pt}}
  {{\\footnotesize \\textcolor{{subtext}}{{{safe_subtitle}}}}}\\\\
  \\vspace{{4pt}}
  {{\\small \\textbf{{\\textcolor{{red!75!black}}{{{header.synthetic_notice}}}}}}}\\\\
  \\vspace{{3pt}}
  \\textcolor{{linecolor}}{{\\rule{{\\textwidth}}{{0.8pt}}}}
\\end{{center}}

\\vspace{{2pt}}

\\noindent
\\begin{{tabular*}}{{\\textwidth}}{{@{{}} l @{{\\extracolsep{{\\fill}}}} r @{{}}}}
  \\textbf{{Patient:}} {safe_name} & \\textbf{{MRN:}} {header.mrn} \\\\
  \\textbf{{DOB:}} {header.dob} \\quad (\\textbf{{Age / Sex:}} {header.age}y / {header.sex}) & \\textbf{{Report Date:}} {header.date_str} \\\\
  \\textbf{{Encounter:}} Ambulatory Outpatient & \\textbf{{Ref MD:}} {header.physician} \\\\
\\end{{tabular*}}

\\vspace{{2pt}}
\\noindent\\textcolor{{linecolor}}{{\\rule{{\\textwidth}}{{0.4pt}}}}
\\vspace{{6pt}}
"""
