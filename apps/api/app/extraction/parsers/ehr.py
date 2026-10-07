"""
Deterministic parser for EHR Outpatient clinical notes.
Extracts the 31 schema parameters across:
- Demographics & Anthropometrics (5): Age, Sex, Weight, Length, BMI
- Clinical Examination (26): Vitals (BP, PR), Risk factors & comorbidities,
  Physical exam findings, NYHA Function Class, and Chest Pain symptom taxonomy.
"""

import re
from typing import Dict, List, Optional, Set, Tuple

from ..categorical import (
    check_negation_in_prefix,
    parse_function_class,
    parse_sex_value,
    parse_yes_no_value,
)
from ..locate import locate_value_for_match
from ..matcher import FIELD_SYNONYMS, match_field_in_row
from ..models import ExtractedField, RejectedField
from ..pdf_text import Document
from ..report_types import ReportType, owned_keys
from ..units import convert_and_validate_numeric
from ..values import parse_numeric_value_and_unit

OWNED_KEYS: Set[str] = set(owned_keys(ReportType.ehr))

CHEST_PAIN_KEYS = ["Typical Chest Pain", "Atypical", "Nonanginal", "Exertional CP", "LowTH Ang"]

def parse_ft_in_to_cm(text: str) -> Optional[float]:
    """Parses height in feet and inches (e.g. 5'8\", 5 ft 8 in) to cm."""
    m = re.search(r"([4-7])\s*(?:'|ft|feet)\s*([0-9]{1,2})?\s*(?:\"|in|inches)?", text, re.IGNORECASE)
    if m:
        feet = float(m.group(1))
        inches = float(m.group(2)) if m.group(2) else 0.0
        cm = (feet * 12.0 + inches) * 2.54
        return round(cm, 1)
    return None

def parse_ehr(document: Document) -> Tuple[Dict[str, ExtractedField], List[RejectedField], List[str]]:
    """
    Parses an Outpatient clinical note returning (fields, rejected, warnings).
    Fills ONLY keys in OWNED_KEYS.
    """
    fields: Dict[str, ExtractedField] = {}
    rejected: List[RejectedField] = []
    warnings: List[str] = []

    remaining_keys = list(OWNED_KEYS)
    full_text = "\n".join(p.text for p in document.pages)

    # =========================================================================
    # 1. SPECIAL DEMOGRAPHICS & VITALS PASS
    # =========================================================================

    # --- Blood Pressure (BP): Systolic blood pressure only (50 - 260 mmHg) ---
    bp_match = re.search(r"\b(?:resting\s+blood\s+pressure|blood\s+pressure|resting\s+bp|bp)\s*(?:\([a-z\s]+\))?\s*[:=]?\s*([0-9]{2,3})\s*(?:/\s*([0-9]{2,3}))?\s*(?:mm\s*hg)?", full_text, re.IGNORECASE)
    if bp_match:
        systolic = float(bp_match.group(1))
        conv = convert_and_validate_numeric("BP", systolic, "mmHg")
        if conv.rejection_reason:
            rejected.append(RejectedField(
                key="BP",
                reason=conv.rejection_reason,
                found=bp_match.group(0)[:40],
            ))
        else:
            fields["BP"] = ExtractedField(
                value=conv.value,
                confidence="high",
                unit_in_report="mmHg",
                converted=False,
                derived=False,
                evidence=bp_match.group(0)[:80],
                page=1,
            )
            if "BP" in remaining_keys:
                remaining_keys.remove("BP")

    # --- Pulse Rate (PR) ---
    pr_match = re.search(r"\b(?:resting\s+pulse\s+rate|pulse\s+rate|resting\s+pulse|pulse|heart\s+rate|hr|pr)\s*(?:\([a-z\s]+\))?\s*[:=]?\s*([0-9]{2,3})\s*(?:bpm|/min)?\b", full_text, re.IGNORECASE)
    if pr_match and "PR" in remaining_keys:
        val = float(pr_match.group(1))
        conv = convert_and_validate_numeric("PR", val, "bpm")
        if conv.rejection_reason:
            rejected.append(RejectedField(
                key="PR",
                reason=conv.rejection_reason,
                found=pr_match.group(0)[:40],
            ))
        else:
            fields["PR"] = ExtractedField(
                value=conv.value,
                confidence="high",
                unit_in_report="bpm",
                converted=False,
                derived=False,
                evidence=pr_match.group(0)[:80],
                page=1,
            )
            remaining_keys.remove("PR")

    # --- Height / Length (cm, m, ft-in) ---
    if "Length" in remaining_keys:
        ft_in_cm = parse_ft_in_to_cm(full_text)
        if ft_in_cm:
            conv = convert_and_validate_numeric("Length", ft_in_cm, "cm")
            if not conv.rejection_reason:
                fields["Length"] = ExtractedField(
                    value=conv.value,
                    confidence="high",
                    unit_in_report="ft/in",
                    converted=True,
                    derived=False,
                    evidence=f"Height: {conv.value} cm",
                    page=1,
                )
                remaining_keys.remove("Length")
        else:
            ht_m = re.search(r"\b(?:height|length|ht)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(cm|m|meters)?\b", full_text, re.IGNORECASE)
            if ht_m:
                val = float(ht_m.group(1))
                unit = ht_m.group(2) or ("m" if val < 2.5 else "cm")
                conv = convert_and_validate_numeric("Length", val, unit)
                if conv.rejection_reason:
                    rejected.append(RejectedField(
                        key="Length",
                        reason=conv.rejection_reason,
                        found=ht_m.group(0)[:40],
                    ))
                else:
                    fields["Length"] = ExtractedField(
                        value=conv.value,
                        confidence="high",
                        unit_in_report=unit,
                        converted=conv.converted,
                        derived=False,
                        evidence=ht_m.group(0)[:80],
                        page=1,
                    )
                    remaining_keys.remove("Length")

    # --- Weight (kg, lb) ---
    if "Weight" in remaining_keys:
        wt_m = re.search(r"\b(?:weight|wt|body\s+weight)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|lb|lbs|pounds)?\b", full_text, re.IGNORECASE)
        if wt_m:
            val = float(wt_m.group(1))
            unit = wt_m.group(2) or "kg"
            conv = convert_and_validate_numeric("Weight", val, unit)
            if conv.rejection_reason:
                rejected.append(RejectedField(
                    key="Weight",
                    reason=conv.rejection_reason,
                    found=wt_m.group(0)[:40],
                ))
            else:
                fields["Weight"] = ExtractedField(
                    value=conv.value,
                    confidence="high",
                    unit_in_report=unit,
                    converted=conv.converted,
                    derived=False,
                    evidence=wt_m.group(0)[:80],
                    page=1,
                )
                remaining_keys.remove("Weight")

    # --- Age (From 'Age' label or demographic narrative; NEVER read dates of birth) ---
    if "Age" in remaining_keys:
        age_m = re.search(r"\b(?:age|patient\s+age)\s*[:=]?\s*([0-9]{2,3})\s*(?:yo|y/o|years|yrs)?\b", full_text, re.IGNORECASE)
        if not age_m:
            # Narrative format e.g. "62-year-old male", "55 yo female", "71 y/o"
            age_m = re.search(r"\b([0-9]{2,3})\s*(?:-|–)?\s*(?:year[s]?(?:-|–|\s*)old|yo|y/o|years|yrs)\b", full_text, re.IGNORECASE)
        if age_m:
            val = float(age_m.group(1))
            conv = convert_and_validate_numeric("Age", val, "years")
            if conv.rejection_reason:
                rejected.append(RejectedField(
                    key="Age",
                    reason=conv.rejection_reason,
                    found=age_m.group(0)[:40],
                ))
            else:
                fields["Age"] = ExtractedField(
                    value=conv.value,
                    confidence="high",
                    unit_in_report="years",
                    converted=False,
                    derived=False,
                    evidence=f"Age: {int(conv.value)} years",
                    page=1,
                )
                remaining_keys.remove("Age")

    # --- Sex ---
    if "Sex" in remaining_keys:
        sex_m = re.search(r"\b(?:sex|gender|biological\s+sex)\s*[:=]?\s*(male|female|m|f)\b", full_text, re.IGNORECASE)
        if not sex_m:
            # Narrative format e.g. "62-year-old male", "55 yo female"
            sex_m = re.search(r"\b(?:[0-9]{2,3}\s*(?:-|–)?\s*(?:year[s]?(?:-|–|\s*)old|yo|y/o|years|yrs)\s+)?(male|female)\b", full_text, re.IGNORECASE)
        if sex_m:
            sex_val = parse_sex_value(sex_m.group(1))
            if sex_val:
                fields["Sex"] = ExtractedField(
                    value=sex_val,
                    confidence="high",
                    unit_in_report=None,
                    converted=False,
                    derived=False,
                    evidence=f"Sex: {sex_val}",
                    page=1,
                )
                remaining_keys.remove("Sex")

    # --- Function Class ---
    if "Function Class" in remaining_keys:
        fc_m = re.search(r"\b(?:nyha\s*(?:functional\s*)?(?:class)?|functional\s*class|function\s*class)\s*[:=]?\s*(?:class\s+)?([0-4]|i{1,3}|iv|none)\b", full_text, re.IGNORECASE)
        if fc_m:
            fc_val = parse_function_class(fc_m.group(1))
            if fc_val:
                fields["Function Class"] = ExtractedField(
                    value=fc_val,
                    confidence="high",
                    unit_in_report="class",
                    converted=False,
                    derived=False,
                    evidence=fc_m.group(0)[:80],
                    page=1,
                )
                remaining_keys.remove("Function Class")

    # --- BMI (explicit or derived from height and weight) ---
    if "BMI" in remaining_keys:
        bmi_m = re.search(r"\b(?:body\s+mass\s+index|bmi)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\b", full_text, re.IGNORECASE)
        if bmi_m:
            val = float(bmi_m.group(1))
            conv = convert_and_validate_numeric("BMI", val, "kg/m²")
            if conv.rejection_reason:
                rejected.append(RejectedField(
                    key="BMI",
                    reason=conv.rejection_reason,
                    found=bmi_m.group(0)[:40],
                ))
            else:
                fields["BMI"] = ExtractedField(
                    value=conv.value,
                    confidence="high",
                    unit_in_report="kg/m²",
                    converted=False,
                    derived=False,
                    evidence=bmi_m.group(0)[:80],
                    page=1,
                )
                remaining_keys.remove("BMI")
        elif "Weight" in fields and "Length" in fields and fields["Length"].value and fields["Length"].value > 0:
            height_m = float(fields["Length"].value) / 100.0
            weight_kg = float(fields["Weight"].value)
            bmi_calc = round(weight_kg / (height_m ** 2), 2)
            conv = convert_and_validate_numeric("BMI", bmi_calc, "kg/m²")
            if not conv.rejection_reason:
                fields["BMI"] = ExtractedField(
                    value=conv.value,
                    confidence="check",
                    unit_in_report="kg/m²",
                    converted=False,
                    derived=True,
                    evidence="Calculated from height and weight",
                    page=1,
                )
                remaining_keys.remove("BMI")

    # =========================================================================
    # 2. STRUCTURED TABLE PASS FOR REMAINING FIELDS
    # =========================================================================
    for page in document.pages:
        for r_idx, row in enumerate(page.rows):
            if not remaining_keys:
                break

            match = match_field_in_row(row, r_idx, remaining_keys)
            if not match or match.key not in OWNED_KEYS:
                continue

            key = match.key
            loc = locate_value_for_match(match, page.rows, r_idx)
            if not loc:
                continue

            # Route by key type
            if key == "BMI":
                if loc.parsed and loc.parsed.value is not None:
                    conv = convert_and_validate_numeric("BMI", loc.parsed.value, "kg/m^2")
                    if conv.rejection_reason:
                        rejected.append(RejectedField(key=key, reason=conv.rejection_reason, found=str(loc.parsed.value)))
                    else:
                        fields[key] = ExtractedField(
                            value=conv.value,
                            confidence="high",
                            unit_in_report="kg/m^2",
                            converted=False,
                            derived=False,
                            evidence=loc.evidence[:80],
                            page=page.page_number,
                        )
                        remaining_keys.remove(key)
            elif key == "Sex":
                sex_val = parse_sex_value(loc.raw_value)
                if sex_val:
                    fields[key] = ExtractedField(
                        value=sex_val,
                        confidence="high",
                        evidence=loc.evidence[:80],
                        page=page.page_number,
                    )
                    remaining_keys.remove(key)
            elif key == "Function Class":
                fc_val = parse_function_class(loc.raw_value)
                if fc_val:
                    fields[key] = ExtractedField(
                        value=fc_val,
                        confidence="high",
                        unit_in_report="class",
                        evidence=loc.evidence[:80],
                        page=page.page_number,
                    )
                    remaining_keys.remove(key)
            else:
                # Yes/No categorical
                bool_val = parse_yes_no_value(key, loc.raw_value)
                if bool_val is not None:
                    fields[key] = ExtractedField(
                        value=bool_val,
                        confidence="high",
                        evidence=loc.evidence[:80],
                        page=page.page_number,
                    )
                    remaining_keys.remove(key)

    # =========================================================================
    # 3. CHEST PAIN FAMILY FALLBACK
    # =========================================================================
    # If the note has a single "Chest pain: [Type]" line naming one type,
    # set only that field to yes and leave the other chest-pain fields empty.
    unfound_cp = [k for k in CHEST_PAIN_KEYS if k in remaining_keys]
    if len(unfound_cp) == len(CHEST_PAIN_KEYS):
        single_cp_match = re.search(r"\bchest\s+pain\s*[:=-]\s*([^\n\r]+)", full_text, re.IGNORECASE)
        if single_cp_match:
            cp_desc = single_cp_match.group(1).lower()
            matched_cp_key: Optional[str] = None

            if "typical" in cp_desc or "angina pectoris" in cp_desc:
                matched_cp_key = "Typical Chest Pain"
            elif "atypical" in cp_desc:
                matched_cp_key = "Atypical"
            elif "non-anginal" in cp_desc or "nonanginal" in cp_desc or "noncardiac" in cp_desc:
                matched_cp_key = "Nonanginal"
            elif "exertional" in cp_desc:
                matched_cp_key = "Exertional CP"
            elif "low-threshold" in cp_desc or "low threshold" in cp_desc or "rest" in cp_desc:
                matched_cp_key = "LowTH Ang"

            if matched_cp_key:
                val = parse_yes_no_value(matched_cp_key, "yes")
                fields[matched_cp_key] = ExtractedField(
                    value=val,
                    confidence="high",
                    evidence=single_cp_match.group(0)[:80],
                    page=1,
                )
                remaining_keys.remove(matched_cp_key)

    # =========================================================================
    # 4. FREE TEXT HISTORY & EXAMINATION FALLBACK
    # =========================================================================
    # Scan "Past history:", "Medical history:", "Examination:" blocks for positive mentions
    if remaining_keys:
        history_exam_match = re.search(r"(?:past\s+history|medical\s+history|history|examination|physical\s+exam)\s*[:=](.*?)(?=\n\n|[A-Z][a-z]+:|$)", full_text, re.DOTALL | re.IGNORECASE)
        context_text = history_exam_match.group(1) if history_exam_match else full_text

        for key in list(remaining_keys):
            if key in {"BMI", "Length", "Weight", "Age", "BP", "PR", "Sex", "Function Class"}:
                continue

            synonyms = FIELD_SYNONYMS.get(key, [])
            for syn in synonyms:
                pattern = r"\b" + re.escape(syn) + r"\b"
                m = re.search(pattern, context_text, re.IGNORECASE)
                if not m:
                    continue

                start_pos = m.start()
                prefix = context_text[max(0, start_pos - 60):start_pos]
                is_negated = check_negation_in_prefix(prefix)

                # Positive mention gives yes ("check"); absent/negated conditions stay empty in free-text fallback
                if not is_negated:
                    yes_val = parse_yes_no_value(key, "yes")
                    if yes_val is not None:
                        fields[key] = ExtractedField(
                            value=yes_val,
                            confidence="check",
                            evidence=f"{syn}: positive"[:80],
                            page=1,
                        )
                        remaining_keys.remove(key)
                        break

    # =========================================================================
    # 5. BMI CALCULATION FALLBACK
    # =========================================================================
    # If BMI was not found in document, but Weight and Length were found:
    # calculate weight / height(m)^2 rounded to 2 decimals, derived: True, confidence: "check"
    if "BMI" not in fields and "Weight" in fields and "Length" in fields:
        try:
            wt_val = float(fields["Weight"].value)
            len_val = float(fields["Length"].value)
            if len_val > 0:
                height_m = len_val / 100.0
                calc_bmi = round(wt_val / (height_m * height_m), 2)
                conv = convert_and_validate_numeric("BMI", calc_bmi, "kg/m^2")
                if not conv.rejection_reason:
                    fields["BMI"] = ExtractedField(
                        value=conv.value,
                        confidence="check",
                        unit_in_report="kg/m^2",
                        converted=False,
                        derived=True,
                        evidence="Calculated from height and weight",
                        page=fields["Weight"].page,
                    )
                    if "BMI" in remaining_keys:
                        remaining_keys.remove("BMI")
        except Exception:
            pass

    # Security assertion: Parser must NEVER return keys it does not own
    for k in list(fields.keys()):
        if k not in OWNED_KEYS:
            del fields[k]

    return fields, rejected, warnings
