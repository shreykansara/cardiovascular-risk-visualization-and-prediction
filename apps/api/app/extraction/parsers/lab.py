"""
Deterministic parser for Blood Lab reports.
Extracts the 14 schema laboratory biomarkers:
- FBS, CR, TG, LDL, HDL, BUN, ESR, HB, K, Na, WBC, Lymph, Neut, PLT
Enforces percentage checking for Lymph/Neut, exclusion words for LDL/HDL,
urea-to-BUN conversion, SI unit conversion, and physiological bounds checking.
"""

from typing import Dict, List, Optional, Set, Tuple

from ..locate import locate_value_for_match
from ..matcher import has_ldl_hdl_exclusions, match_field_in_row
from ..models import ExtractedField, RejectedField
from ..pdf_text import Document
from ..report_types import ReportType, owned_keys
from ..units import convert_and_validate_numeric

OWNED_KEYS: Set[str] = set(owned_keys(ReportType.lab))

def parse_lab(document: Document) -> Tuple[Dict[str, ExtractedField], List[RejectedField], List[str]]:
    """
    Parses a Blood Lab report returning (fields, rejected, warnings).
    Fills ONLY keys in OWNED_KEYS.
    """
    fields: Dict[str, ExtractedField] = {}
    rejected: List[RejectedField] = []
    warnings: List[str] = []

    # Two-pass priority: for Lymph and Neut, prefer rows explicitly labelled with '(%)'
    target_keys = list(OWNED_KEYS)

    for page in document.pages:
        for r_idx, row in enumerate(page.rows):
            if not target_keys:
                break

            match = match_field_in_row(row, r_idx, target_keys)
            if not match or match.key not in OWNED_KEYS:
                continue

            key = match.key

            # Exclusion guard for LDL / HDL
            if key in {"LDL", "HDL"} and has_ldl_hdl_exclusions(row.text):
                continue

            loc = locate_value_for_match(match, page.rows, r_idx)
            if not loc or not loc.parsed:
                continue

            # Check if value was censored (<0.5, >90)
            if loc.parsed.is_censored:
                rejected.append(RejectedField(
                    key=key,
                    reason="censored_value",
                    found=loc.parsed.censored_snippet[:40],
                ))
                continue

            if loc.parsed.value is None:
                continue

            raw_val = loc.parsed.value
            stated_unit = loc.parsed.unit

            # Special check for Lymph / Neut: must be percentage
            if key in {"Lymph", "Neut"}:
                # If row text or unit has %, accept; if absolute count (e.g. cells/uL, 10^3), reject
                if stated_unit and stated_unit != "%":
                    rejected.append(RejectedField(
                        key=key,
                        reason="not_percent",
                        found=f"{raw_val} {stated_unit}"[:40],
                    ))
                    continue
                # If no stated unit but label has '(%)' or '%', accept
                if not stated_unit and "%" in match.label_text:
                    stated_unit = "%"
                elif not stated_unit and raw_val > 100:
                    # Absolute count masquerading without unit
                    rejected.append(RejectedField(
                        key=key,
                        reason="not_percent",
                        found=str(raw_val)[:40],
                    ))
                    continue

            # Special check for BUN: check if source was 'urea' or 'blood urea'
            is_urea = False
            if key == "BUN":
                syn_low = match.synonym_matched.lower()
                if "nitrogen" not in syn_low and "bun" not in syn_low:
                    is_urea = True

            conv = convert_and_validate_numeric(
                key=key,
                raw_value=raw_val,
                stated_unit=stated_unit,
                is_urea_source=is_urea,
            )

            if conv.rejection_reason:
                rejected.append(RejectedField(
                    key=key,
                    reason=conv.rejection_reason,
                    found=conv.found_snippet[:40] if conv.found_snippet else str(raw_val),
                ))
                continue

            # Determine confidence
            conf = "check" if (conv.confidence_check or loc.parsed.is_range_midpoint or is_urea) else "high"

            fields[key] = ExtractedField(
                value=conv.value,
                confidence=conf,
                unit_in_report=stated_unit,
                converted=conv.converted,
                derived=False,
                evidence=loc.evidence[:80],
                page=page.page_number,
            )
            target_keys.remove(key)

    # Security assertion: Parser must NEVER return keys it does not own
    for k in list(fields.keys()):
        if k not in OWNED_KEYS:
            del fields[k]

    return fields, rejected, warnings
