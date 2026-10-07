"""
Deterministic parser for ECG reports.
Extracts the 7 schema ECG parameters:
- Q Wave, St Elevation, St Depression, Tinversion, LVH, Poor R Progression, BBB
Supports primary structured table findings and impression/conclusion fallback with negation detection.
"""

import re
from typing import Dict, List, Set, Tuple

from ..categorical import check_negation_in_prefix, parse_bbb_value, parse_yes_no_value
from ..locate import locate_value_for_match
from ..matcher import FIELD_SYNONYMS, match_field_in_row
from ..models import ExtractedField, RejectedField
from ..pdf_text import Document
from ..report_types import ReportType, owned_keys

OWNED_KEYS: Set[str] = set(owned_keys(ReportType.ecg))

def parse_ecg(document: Document) -> Tuple[Dict[str, ExtractedField], List[RejectedField], List[str]]:
    """
    Parses an ECG document returning (fields, rejected, warnings).
    Fills ONLY keys in OWNED_KEYS.
    """
    fields: Dict[str, ExtractedField] = {}
    rejected: List[RejectedField] = []
    warnings: List[str] = []

    remaining_keys = list(OWNED_KEYS)

    # Pass 1: Structured table rows
    for page in document.pages:
        for r_idx, row in enumerate(page.rows):
            if not remaining_keys:
                break

            match = match_field_in_row(row, r_idx, remaining_keys)
            if not match or match.key not in OWNED_KEYS:
                continue

            loc = locate_value_for_match(match, page.rows, r_idx)
            if not loc:
                continue

            key = match.key
            if key == "BBB":
                bbb_val = parse_bbb_value(loc.raw_value)
                if bbb_val:
                    fields[key] = ExtractedField(
                        value=bbb_val,
                        confidence="high",
                        unit_in_report=None,
                        converted=False,
                        derived=False,
                        evidence=loc.evidence[:80],
                        page=page.page_number,
                    )
                    remaining_keys.remove(key)
                else:
                    rejected.append(RejectedField(
                        key=key,
                        reason="unparseable",
                        found=loc.raw_value[:40],
                    ))
            else:
                bool_val = parse_yes_no_value(key, loc.raw_value)
                if bool_val is not None:
                    fields[key] = ExtractedField(
                        value=bool_val,
                        confidence="high",
                        unit_in_report=None,
                        converted=False,
                        derived=False,
                        evidence=loc.evidence[:80],
                        page=page.page_number,
                    )
                    remaining_keys.remove(key)
                else:
                    rejected.append(RejectedField(
                        key=key,
                        reason="unparseable",
                        found=loc.raw_value[:40],
                    ))

    # Pass 2: Free text fallback (Impression / Conclusion / Body)
    # Only for keys not found in structured tables
    if remaining_keys:
        for page in document.pages:
            full_page_text = page.text
            for key in list(remaining_keys):
                synonyms = FIELD_SYNONYMS.get(key, [])
                for syn in synonyms:
                    pattern = r"\b" + re.escape(syn) + r"\b"
                    m = re.search(pattern, full_page_text, re.IGNORECASE)
                    if not m:
                        continue

                    # Check 3 words before match for negation
                    start_pos = m.start()
                    prefix = full_page_text[max(0, start_pos - 60):start_pos]
                    is_negated = check_negation_in_prefix(prefix)

                    if key == "BBB":
                        if is_negated:
                            bbb_val = "N"
                        elif "lbbb" in syn.lower():
                            bbb_val = "LBBB"
                        elif "rbbb" in syn.lower():
                            bbb_val = "RBBB"
                        else:
                            bbb_val = "LBBB" if "lbbb" in m.group(0).lower() else ("RBBB" if "rbbb" in m.group(0).lower() else "N")

                        evidence_str = f"{prefix.strip().split()[-1] if prefix.strip() else ''} {m.group(0)}".strip()
                        fields[key] = ExtractedField(
                            value=bbb_val,
                            confidence="check",
                            unit_in_report=None,
                            converted=False,
                            derived=False,
                            evidence=evidence_str[:80],
                            page=page.page_number,
                        )
                        remaining_keys.remove(key)
                        break
                    else:
                        bool_val = parse_yes_no_value(key, "no" if is_negated else "yes")
                        if bool_val is not None:
                            evidence_str = f"{prefix.strip().split()[-1] if prefix.strip() else ''} {m.group(0)}".strip()
                            fields[key] = ExtractedField(
                                value=bool_val,
                                confidence="check",
                                unit_in_report=None,
                                converted=False,
                                derived=False,
                                evidence=evidence_str[:80],
                                page=page.page_number,
                            )
                            remaining_keys.remove(key)
                            break

    # Security assertion: Parser must NEVER return keys it does not own
    for k in list(fields.keys()):
        if k not in OWNED_KEYS:
            del fields[k]

    return fields, rejected, warnings
