"""
Deterministic parser for Echocardiography (Echo) reports.
Extracts the 3 schema parameters:
- EF-TTE (Ejection Fraction)
- Region RWMA (Regional Wall Motion Abnormality score)
- VHD (Valvular Heart Disease highest grade)
"""

import re
from typing import Dict, List, Optional, Set, Tuple

from ..categorical import parse_vhd_value
from ..locate import locate_value_for_match
from ..matcher import FIELD_SYNONYMS, match_field_in_row
from ..models import ExtractedField, RejectedField
from ..pdf_text import Document
from ..report_types import ReportType, get_field_spec, owned_keys
from ..units import convert_and_validate_numeric
from ..values import parse_numeric_value_and_unit

OWNED_KEYS: Set[str] = set(owned_keys(ReportType.echo))

VHD_SEVERITY_ORDER = {
    "N": 0,
    "mild": 1,
    "Moderate": 2,
    "Severe": 3,
}

VALVE_NAMES = ["mitral", "aortic", "tricuspid", "pulmonary", "pulmonic"]

WALL_REGIONS = ["anterior", "inferior", "lateral", "septal", "apical", "apex", "posterior", "basal"]
ABNORMAL_MOTION_KEYWORDS = ["hypokinetic", "akinetic", "dyskinetic", "hypokinesia", "akinesia", "dyskinesia"]

def parse_echo(document: Document) -> Tuple[Dict[str, ExtractedField], List[RejectedField], List[str]]:
    """
    Parses an Echocardiography document returning (fields, rejected, warnings).
    Fills ONLY keys in OWNED_KEYS.
    """
    fields: Dict[str, ExtractedField] = {}
    rejected: List[RejectedField] = []
    warnings: List[str] = []

    full_text = "\n".join(p.text for p in document.pages)
    full_text_lower = full_text.lower()

    # =========================================================================
    # 1. EJECTION FRACTION (EF-TTE)
    # =========================================================================
    ef_found = False
    for page in document.pages:
        for r_idx, row in enumerate(page.rows):
            match = match_field_in_row(row, r_idx, ["EF-TTE"])
            if match:
                loc = locate_value_for_match(match, page.rows, r_idx)
                if loc and loc.parsed and loc.parsed.value is not None:
                    # Validate numeric limits
                    conv = convert_and_validate_numeric("EF-TTE", loc.parsed.value, loc.parsed.unit or "%")
                    if conv.rejection_reason:
                        rejected.append(RejectedField(
                            key="EF-TTE",
                            reason=conv.rejection_reason,
                            found=conv.found_snippet[:40] if conv.found_snippet else str(loc.parsed.value),
                        ))
                    else:
                        conf = "check" if loc.parsed.is_range_midpoint or conv.confidence_check else "high"
                        fields["EF-TTE"] = ExtractedField(
                            value=conv.value,
                            confidence=conf,
                            unit_in_report=loc.parsed.unit,
                            converted=conv.converted,
                            derived=False,
                            evidence=loc.evidence[:80],
                            page=page.page_number,
                        )
                        ef_found = True
                        break
        if ef_found:
            break

    # Fallback regex for EF in text: e.g. "EF: 45%" or "LVEF 50-55%"
    if not ef_found:
        m = re.search(r"\b(?:lvef|ef|ejection\s+fraction)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*-\s*[0-9]+(?:\.[0-9]+)?)?)\s*(%)?", full_text, re.IGNORECASE)
        if m:
            parsed = parse_numeric_value_and_unit(m.group(1))
            if parsed and parsed.value is not None:
                conv = convert_and_validate_numeric("EF-TTE", parsed.value, "%")
                if conv.rejection_reason:
                    rejected.append(RejectedField(
                        key="EF-TTE",
                        reason=conv.rejection_reason,
                        found=str(parsed.value),
                    ))
                else:
                    conf = "check" if parsed.is_range_midpoint else "high"
                    fields["EF-TTE"] = ExtractedField(
                        value=conv.value,
                        confidence=conf,
                        unit_in_report="%",
                        converted=conv.converted,
                        derived=False,
                        evidence=m.group(0)[:80],
                        page=1,
                    )

    # =========================================================================
    # 2. REGIONAL WALL MOTION ABNORMALITY (Region RWMA)
    # =========================================================================
    # Strategy A: Explicit "Regions with RWMA: N" or "RWMA score: N" or "RWMA: N"
    explicit_rwma_match = re.search(r"\b(?:regions\s+with\s+rwma|rwma\s+score|rwma)\s*[:=]?\s*([0-9]+|none|normal)\b", full_text, re.IGNORECASE)
    if explicit_rwma_match:
        val_str = explicit_rwma_match.group(1).lower()
        if val_str in {"none", "normal", "0"}:
            fields["Region RWMA"] = ExtractedField(
                value="0",
                confidence="high",
                evidence=explicit_rwma_match.group(0)[:80],
                page=1,
            )
        else:
            num = int(val_str)
            if num > 4:
                warnings.append(f"Clamped RWMA score from {num} to schema maximum 4")
                num = 4
            fields["Region RWMA"] = ExtractedField(
                value=str(num),
                confidence="high",
                evidence=explicit_rwma_match.group(0)[:80],
                page=1,
            )
    elif re.search(r"\bno\s+(?:regional\s+)?wall\s+motion\s+abnormalit(?:y|ies)\b", full_text_lower) or re.search(r"\bnormal\s+wall\s+motion\b", full_text_lower):
        fields["Region RWMA"] = ExtractedField(
            value="0",
            confidence="high",
            evidence="No regional wall motion abnormality",
            page=1,
        )
    else:
        # Strategy B: Count distinct listed regions described as hypokinetic, akinetic, or dyskinetic
        abnormal_regions_found: Set[str] = set()
        for region in WALL_REGIONS:
            # Check if region is near any abnormal motion keyword
            pattern = (
                r"\b" + re.escape(region) + r"\b.{0,30}\b(?:" +
                "|".join(ABNORMAL_MOTION_KEYWORDS) + r")\b|\b(?:" +
                "|".join(ABNORMAL_MOTION_KEYWORDS) + r")\b.{0,30}\b" +
                re.escape(region) + r"\b"
            )
            if re.search(pattern, full_text_lower):
                abnormal_regions_found.add(region)

        if abnormal_regions_found:
            count = len(abnormal_regions_found)
            clamped = min(4, count)
            evidence_str = f"Counted {count} abnormal regions: {', '.join(sorted(abnormal_regions_found))}"
            fields["Region RWMA"] = ExtractedField(
                value=str(clamped),
                confidence="check",
                evidence=evidence_str[:80],
                page=1,
            )

    # =========================================================================
    # 3. VALVULAR HEART DISEASE (VHD)
    # =========================================================================
    valves_considered: List[str] = []
    highest_severity_str = "N"
    highest_severity_val = 0

    # Pass through lines looking for valve descriptions
    for page in document.pages:
        for row in page.rows:
            row_lower = row.text.lower()
            for v_name in VALVE_NAMES:
                if re.search(r"\b" + re.escape(v_name) + r"\b", row_lower):
                    if v_name not in valves_considered:
                        valves_considered.append(v_name)
                    # Check severity in this row
                    grade = parse_vhd_value(row.text)
                    if grade:
                        sev_num = VHD_SEVERITY_ORDER.get(grade, 0)
                        if sev_num > highest_severity_val:
                            highest_severity_val = sev_num
                            highest_severity_str = grade

    # Check for global normal valves statement
    if not valves_considered:
        if re.search(r"\b(?:normal\s+valves|no\s+significant\s+valvular\s+disease|valves\s+normal)\b", full_text_lower):
            fields["VHD"] = ExtractedField(
                value="N",
                confidence="high",
                evidence="No significant valvular disease",
                page=1,
            )
    else:
        warnings.append(f"Highest grade across {len(valves_considered)} valves ({', '.join(valves_considered)})")
        fields["VHD"] = ExtractedField(
            value=highest_severity_str,
            confidence="high",
            evidence=f"Highest grade across {len(valves_considered)} valves: {highest_severity_str}"[:80],
            page=1,
        )

    # Security assertion: Parser must NEVER return keys it does not own
    for k in list(fields.keys()):
        if k not in OWNED_KEYS:
            del fields[k]

    return fields, rejected, warnings
