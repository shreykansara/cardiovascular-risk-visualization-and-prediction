"""
Parser registry and signature-based wrong-type detector.
Maps ReportType to its parser and scores document keywords to prevent misallocated report uploads.
"""

from typing import Callable, Dict, List, Optional, Tuple

from ..models import ExtractedField, RejectedField
from ..pdf_text import Document
from ..report_types import ReportType
from .ecg import parse_ecg
from .echo import parse_echo
from .ehr import parse_ehr
from .lab import parse_lab

ParserFunc = Callable[[Document], Tuple[Dict[str, ExtractedField], List[RejectedField], List[str]]]

PARSER_REGISTRY: Dict[ReportType, ParserFunc] = {
    ReportType.ecg: parse_ecg,
    ReportType.echo: parse_echo,
    ReportType.lab: parse_lab,
    ReportType.ehr: parse_ehr,
}

SIGNATURE_KEYWORDS: Dict[ReportType, List[str]] = {
    ReportType.ecg: [
        "electrocardiogram", "ecg", "ekg", "st segment", "qrs", "sinus rhythm", "pr interval", "qt"
    ],
    ReportType.echo: [
        "echocardiograph", "ejection fraction", "lvef", "mitral", "aortic valve", "wall motion", "left atrium", "doppler"
    ],
    ReportType.lab: [
        "hemoglobin", "haemoglobin", "creatinine", "glucose", "cholesterol", "triglyceride", "platelet", "reference range"
    ],
    ReportType.ehr: [
        "chief complaint", "past history", "vitals", "blood pressure", "examination", "outpatient", "opd", "history"
    ],
}

def detect_wrong_report_type(chosen_type: ReportType, document: Document) -> Optional[ReportType]:
    """
    Evaluates signature keywords across document text.
    If the chosen report type scores 1 or less and another type scores 3 or more,
    returns the suggested ReportType.
    """
    full_text_lower = " ".join(r.text.lower() for p in document.pages for r in p.rows)

    scores: Dict[ReportType, int] = {}
    for r_type, keywords in SIGNATURE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in full_text_lower)
        scores[r_type] = score

    chosen_score = scores.get(chosen_type, 0)
    if chosen_score <= 1:
        # Check if any other report type scored 3 or more
        candidates = [
            (r_type, score) for r_type, score in scores.items()
            if r_type != chosen_type and score >= 3
        ]
        if candidates:
            # Pick candidate with highest score
            candidates.sort(key=lambda x: x[1], reverse=True)
            return candidates[0][0]

    return None

def get_parser(report_type: ReportType) -> ParserFunc:
    """Returns the deterministic parsing function for the specified report type."""
    if report_type not in PARSER_REGISTRY:
        raise ValueError(f"No parser registered for report type: {report_type}")
    return PARSER_REGISTRY[report_type]
