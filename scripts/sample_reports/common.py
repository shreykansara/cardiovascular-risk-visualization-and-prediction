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
    return f"""% --- Patient & Report Header ---
\\begin{{center}}
  {{\\Large \\textbf{{{header.facility}}}}}\\\\
  \\vspace{{2pt}}
  {{\\normalsize \\textbf{{{report_title.upper()}}}}}\\\\
  \\vspace{{1pt}}
  {{\\footnotesize \\textcolor{{subtext}}{{{report_subtitle}}}}}\\\\
  \\vspace{{4pt}}
  {{\\small \\textbf{{\\textcolor{{red!75!black}}{{{header.synthetic_notice}}}}}}}\\\\
  \\vspace{{3pt}}
  \\textcolor{{linecolor}}{{\\rule{{\\textwidth}}{{0.8pt}}}}
\\end{{center}}

\\vspace{{2pt}}

\\noindent
\\begin{{tabular*}}{{\\textwidth}}{{@{{\\extracolsep{{\\fill}}}} l l l l @{{}}}}
  \\textbf{{Patient:}} {header.name} & \\textbf{{MRN:}} {header.mrn} & \\textbf{{Date:}} {header.date_str} & \\textbf{{Age / Sex:}} {header.age}y / {header.sex} \\\\
  \\textbf{{DOB:}} {header.dob} & \\textbf{{Ref MD:}} {header.physician} & \\textbf{{Status:}} Final Verified & \\textbf{{Encounter:}} Ambulatory Outpatient \\\\
\\end{{tabular*}}

\\vspace{{2pt}}
\\noindent\\textcolor{{linecolor}}{{\\rule{{\\textwidth}}{{0.4pt}}}}
\\vspace{{6pt}}
"""
