"""
Backend LLM Report Generation Service (Unified Single-Call Engine)
Multimodal AI Hackathon 2026 - Perfusion3D

Provides:
1. Compact Context extraction (Age, Sex, 4-head predictions, Top 5 SHAP per vessel, Out-of-range parameters)
2. Single-call Groq prompt with strict JSON output contract (src/prompts/reports_combined.md)
3. Defensive parsing & Per-Field Safety Validation with graceful deterministic fallbacks
4. Assembler into complete 7-section Clinician and 8-section Patient reports with code-inserted disclaimer
5. Rate limit classification (minute vs daily), cooldown enforcement, and <=15s one-shot retry
6. In-memory single-flight and 60-minute TTL cache
7. Client IP-based rate limiting (4 per 10m per client, 30 per hour globally)
8. NDJSON event streaming generator for POST /api/v1/reports/generate
9. Zero-call GET /reports/status configuration inspection
"""

import os
import re
import json
import time
import math
import uuid
import hashlib
import asyncio
import logging
import warnings
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional, Set, Tuple
from pathlib import Path

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from apps.api.app.services.risk_bands import risk_label

warnings.filterwarnings("ignore", message=".*LightGBM binary classifier with TreeExplainer.*")

logger = logging.getLogger("cardio_api")

# Banned advisory phrases per SHARED RULES
BANNED_PHRASES = [
    "should",
    "must",
    "need to",
    "recommend",
    "advise",
    "suggest",
    "consider",
    "try",
    "avoid",
    "ensure",
    "it is important to",
    "you may want to",
    "follow up",
    "see a doctor",
    "consult",
]

# Patient jargon terms forbidden in patient-facing summary
PATIENT_JARGON_TERMS = [
    "shap",
    "log-odds",
    "log odds",
    "ensemble",
    "xgboost",
    "lightgbm",
    "auc",
    "f1",
    "hyperparameter",
    "cross-validation",
    "multivariate",
    "logits",
    "gradient boosting",
]

MANDATORY_DISCLAIMER = (
    "Predictions are for decision-support and educational purposes only and are "
    "not a substitute for formal diagnostic imaging or professional medical evaluation."
)

TECHNICAL_SECTIONS_ORDER = [
    "report_header",
    "model_output_summary",
    "input_parameters",
    "parameters_outside_reference_range",
    "model_attribution",
    "methodological_notes",
    "disclaimer",
]

PATIENT_SECTIONS_ORDER = [
    "title_and_date",
    "what_this_summary_is",
    "overall_picture",
    "your_three_main_heart_arteries",
    "your_measurements",
    "what_influenced_the_prediction_most",
    "about_this_estimate",
    "disclaimer",
]

REPO_ROOT: Path = Path(__file__).resolve().parents[4]
PROMPT_FILE: Path = REPO_ROOT / "src" / "prompts" / "reports_combined.md"
PROMPT_VERSION = "v3-combined"

# Global states
_cached_prompt_text: Optional[str] = None
_cooldown_until: float = 0.0
_cooldown_type: str = "ok"
_last_groq_status: str = "ok"
_groq_calls_history: List[float] = []

# Rate limits: 4 per 10m per client, 30 per hour globally
_client_request_history: Dict[str, List[float]] = {}

# In-memory cache: max 50 entries, TTL 3600 seconds
_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_cache_max_size = 50
_cache_ttl_s = 3600.0

# Single-flight map to coalesce concurrent identical requests
_in_flight: Dict[str, asyncio.Future] = {}


# ==============================================================================
# Environment & Configuration (Never expose keys)
# ==============================================================================

def clean_env_str(val: Optional[str]) -> str:
    """Strips BOM, whitespace, and surrounding quotes."""
    if not val:
        return ""
    s = val.lstrip("\ufeff")
    s = s.strip(" \t\r\n")
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip(" \t\r\n")
    return s


def is_placeholder(key: Optional[str]) -> bool:
    """Detects whether API key is unconfigured or a template placeholder."""
    if not key:
        return True
    cleaned = clean_env_str(key)
    if not cleaned or "PASTE_" in cleaned or cleaned == "PASTE_YOUR_GROQ_API_KEY_HERE":
        return True
    return False


def load_and_check_env() -> Tuple[bool, str]:
    """Loads .env from repo root if not already loaded."""
    env_path = REPO_ROOT / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)
        return True, str(env_path)
    return False, str(env_path)


def get_groq_config() -> Tuple[Optional[str], str]:
    """Returns cleaned (api_key, model). Key is None if placeholder or missing."""
    load_and_check_env()
    raw_key = os.environ.get("GROQ_API_KEY", "")
    raw_model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
    key = clean_env_str(raw_key)
    model = clean_env_str(raw_model) or "llama-3.1-8b-instant"
    if is_placeholder(key):
        return None, model
    return key, model


def get_prompt_text() -> str:
    """Loads and caches src/prompts/reports_combined.md."""
    global _cached_prompt_text
    if _cached_prompt_text is None:
        if PROMPT_FILE.exists():
            _cached_prompt_text = PROMPT_FILE.read_text(encoding="utf-8")
        else:
            raise FileNotFoundError(f"Combined prompt file not found at {PROMPT_FILE}")
    return _cached_prompt_text


# ==============================================================================
# Pydantic Schemas for Output Contract (Task 3.4)
# ==============================================================================

class ClinicianAttribution(BaseModel):
    CAD: Optional[str] = None
    LAD: Optional[str] = None
    LCX: Optional[str] = None
    RCA: Optional[str] = None


class ClinicianProse(BaseModel):
    model_output_summary: Optional[str] = None
    attribution: Optional[ClinicianAttribution] = None
    methodological_notes: Optional[List[str]] = None


class PatientArteries(BaseModel):
    LAD: Optional[str] = None
    LCX: Optional[str] = None
    RCA: Optional[str] = None


class PatientProse(BaseModel):
    what_this_is: Optional[str] = None
    overall_picture: Optional[str] = None
    arteries: Optional[PatientArteries] = None
    influences: Optional[List[str]] = None
    about_this_estimate: Optional[str] = None


class CombinedReportsProse(BaseModel):
    clinician: Optional[ClinicianProse] = None
    patient: Optional[PatientProse] = None


# ==============================================================================
# Compact Context Builder (Task 3.2)
# ==============================================================================

REFERENCE_RANGES: Dict[str, Tuple[float, float, str, str]] = {
    "BP": (90.0, 120.0, "mmHg", "90 - 120 mmHg"),
    "Age": (18.0, 75.0, "years", "18 - 75 years"),
    "FBS": (70.0, 99.0, "mg/dL", "70 - 99 mg/dL"),
    "TG": (50.0, 150.0, "mg/dL", "50 - 150 mg/dL"),
    "EF-TTE": (55.0, 70.0, "%", "55 - 70%"),
    "Weight": (50.0, 90.0, "kg", "50 - 90 kg"),
    "Length": (150.0, 190.0, "cm", "150 - 190 cm"),
    "BMI": (18.5, 24.9, "kg/m²", "18.5 - 24.9 kg/m²"),
    "PR": (60.0, 100.0, "bpm", "60 - 100 bpm"),
    "CR": (0.6, 1.2, "mg/dL", "0.6 - 1.2 mg/dL"),
    "LDL": (50.0, 100.0, "mg/dL", "50 - 100 mg/dL"),
    "HDL": (40.0, 60.0, "mg/dL", "40 - 60 mg/dL"),
    "BUN": (7.0, 20.0, "mg/dL", "7 - 20 mg/dL"),
    "ESR": (0.0, 20.0, "mm/hr", "0 - 20 mm/hr"),
    "HB": (12.0, 17.0, "g/dL", "12 - 17 g/dL"),
    "K": (3.5, 5.0, "mEq/L", "3.5 - 5.0 mEq/L"),
    "Na": (135.0, 145.0, "mEq/L", "135 - 145 mEq/L"),
    "WBC": (4000.0, 11000.0, "cells/mcL", "4000 - 11000 cells/mcL"),
    "Lymph": (20.0, 40.0, "%", "20 - 40%"),
    "Neut": (40.0, 70.0, "%", "40 - 70%"),
    "PLT": (150.0, 450.0, "x10^3/mcL", "150 - 450 x10^3/mcL"),
}


def build_compact_context(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    model_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Task 3.2: Builds minimal context string under 1,200 tokens containing only:
    - Age, Sex
    - CAD, LAD, LCX, RCA: predicted probability, classification, risk band
    - Top 5 SHAP contributors per target (name, value, direction, magnitude)
    - Out-of-range parameters (name, value, unit, reference range)
    """
    # Demographics
    age = patient_data.get("Age")
    sex = patient_data.get("Sex", "Unknown")

    # Predictions
    preds_compact: Dict[str, Any] = {}
    cad_pred = predictions.get("overall_cad", {})
    cad_prob = cad_pred.get("probability", 0.0)
    preds_compact["CAD"] = {
        "probability_pct": round(cad_prob * 100, 1),
        "model_classification": "Positive" if cad_prob >= 0.48 else "Negative",
        "risk_band": cad_pred.get("category") or risk_label(cad_prob),
    }

    vessels = predictions.get("vessels", {})
    for v_key in ["lad", "lcx", "rca"]:
        v_data = vessels.get(v_key, {})
        v_prob = v_data.get("probability", 0.0)
        v_upper = v_key.upper()
        preds_compact[v_upper] = {
            "probability_pct": round(v_prob * 100, 1),
            "model_classification": "Positive" if v_prob >= 0.40 else "Negative",
            "risk_band": v_data.get("category") or risk_label(v_prob),
        }

    # Top 5 SHAP contributors per target
    shap_compact: Dict[str, List[Dict[str, Any]]] = {}
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        t_key = target.lower()
        exp = explanations.get(t_key, {})
        top_feats = exp.get("top_features", [])[:5]
        compact_feats = []
        for f in top_feats:
            fname = f.get("clinical_label") or f.get("feature", "")
            raw_v = f.get("patient_value") or f.get("input_value") or f.get("value") or patient_data.get(f.get("feature", ""))
            val = str(raw_v) if raw_v is not None else ""
            direction = "increases risk" if f.get("direction") in ("INCREASES_RISK", "increases risk") else "decreases risk"
            raw_mag = f.get("shap_value") or f.get("magnitude") or 0.0
            mag = round(float(raw_mag), 4)
            compact_feats.append({
                "feature": fname,
                "value": val,
                "direction": direction,
                "magnitude": mag,
            })
        shap_compact[target] = compact_feats

    # Out of range parameters
    out_of_range: List[Dict[str, Any]] = []
    for k, (low, high, unit, ref_str) in REFERENCE_RANGES.items():
        if k in patient_data:
            try:
                v = float(patient_data[k])
                if v < low or v > high:
                    out_of_range.append({
                        "name": k,
                        "value": v,
                        "unit": unit,
                        "typical_range": ref_str,
                    })
            except (ValueError, TypeError):
                pass

    context = {
        "demographics": {"age": age, "sex": sex},
        "predictions": preds_compact,
        "top_shap_contributors": shap_compact,
        "out_of_range_parameters": out_of_range,
    }

    raw_json = json.dumps(context, separators=(",", ":"))
    char_len = len(raw_json)
    est_tokens = char_len // 4
    logger.info(f"[COMPACT CONTEXT] characters={char_len} estimated_tokens={est_tokens}")

    return context


# ==============================================================================
# Format-Tolerant Numbers & Per-Field Validation (Task 3.6 & 3.7)
# ==============================================================================

def extract_all_numbers(obj: Any) -> Set[float]:
    """Recursively extracts all numbers from an arbitrary JSON/string object."""
    nums: Set[float] = set()
    if isinstance(obj, (int, float)):
        val = float(obj)
        nums.add(val)
        nums.add(round(val, 1))
        nums.add(float(int(round(val))))
    elif isinstance(obj, str):
        for m in re.findall(r"(?<![a-zA-Z_])\b\d+(?:\.\d+)?\b(?![a-zA-Z_])", obj):
            try:
                val = float(m)
                nums.add(val)
                nums.add(round(val, 1))
                nums.add(float(int(round(val))))
            except ValueError:
                pass
    elif isinstance(obj, dict):
        for v in obj.values():
            nums.update(extract_all_numbers(v))
    elif isinstance(obj, (list, tuple)):
        for item in obj:
            nums.update(extract_all_numbers(item))
    return nums


def build_allowed_numbers(context: Dict[str, Any]) -> Set[float]:
    """Builds format-tolerant allowed number set from context."""
    base = extract_all_numbers(context)
    allowed: Set[float] = set()
    for n in base:
        allowed.add(n)
        allowed.add(round(n, 1))
        allowed.add(float(int(round(n))))
        if 0.0 <= n <= 1.0:
            pct = n * 100.0
            allowed.add(pct)
            allowed.add(round(pct, 1))
            allowed.add(float(int(round(pct))))
        if 0.0 <= n <= 100.0:
            dec = n / 100.0
            allowed.add(dec)
            allowed.add(round(dec, 2))

    now = datetime.now()
    structural = {
        0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0,
        float(now.year), float(now.month), float(now.day),
        2024.0, 2025.0, 2026.0,
    }
    allowed.update(structural)
    return allowed


def is_number_allowed(num: float, allowed_set: Set[float]) -> bool:
    """Tolerantly matches numbers to allowed set."""
    for c in allowed_set:
        if abs(num - c) < 0.2:
            return True
        if c > 10.0 and abs(num - c) / c < 0.015:
            return True
    return False


def count_sentences(s: str) -> int:
    """Counts sentences without splitting on decimal numbers like 58.1%."""
    if not s or not s.strip():
        return 0
    # Clean decimals before splitting
    cleaned = re.sub(r"\b\d+\.\d+\b", "NUM", s)
    # Split on sentence terminators followed by whitespace or end of string
    parts = [p.strip() for p in re.split(r"[.!?]+(?:\s+|$)", cleaned) if p.strip()]
    return len(parts)


def check_banned_phrase(s: str) -> Optional[str]:
    """Returns matching banned phrase if any."""
    lower = s.lower()
    for phrase in BANNED_PHRASES:
        if re.search(r"\b" + re.escape(phrase) + r"\b", lower):
            return phrase
    return None


def check_jargon(s: str) -> Optional[str]:
    """Returns matching jargon word if any."""
    lower = s.lower()
    for j in PATIENT_JARGON_TERMS:
        if re.search(r"\b" + re.escape(j) + r"\b", lower):
            return j
    return None


def get_average_words_per_sentence(s: str) -> float:
    """Calculates average words per sentence."""
    sentences = max(1, count_sentences(s))
    words = len(s.split())
    return words / sentences


# ==============================================================================
# Rate Limit Parsing & Classification (Task 3.9)
# ==============================================================================

def parse_429_response(status_code: int, response_text: str, headers: Any) -> Tuple[str, float]:
    """
    Classifies 429 into 'rate_limited_minute' or 'rate_limited_daily'
    and extracts wait time in seconds.
    """
    wait_s = 30.0  # default cooldown

    # 1. Parse Retry-After header
    if headers:
        ra = headers.get("retry-after")
        if ra:
            try:
                wait_s = float(ra)
            except ValueError:
                pass

    # 2. Parse body text for 'try again in ...'
    m_body = re.search(r"try again in (?:(\d+)m)?(\d+(?:\.\d+)?)s", response_text, re.IGNORECASE)
    if m_body:
        minutes = float(m_body.group(1)) if m_body.group(1) else 0.0
        seconds = float(m_body.group(2))
        wait_s = minutes * 60.0 + seconds

    # 3. Classify minute vs daily limit
    lower_body = response_text.lower()
    is_daily = "day" in lower_body or "daily" in lower_body or "rpd" in lower_body or "tpd" in lower_body
    limit_type = "rate_limited_daily" if is_daily else "rate_limited_minute"

    return limit_type, wait_s


# ==============================================================================
# Client Limiting Guard (Task 3.10 c)
# ==============================================================================

def check_client_rate_limit(client_ip: str) -> Optional[int]:
    """
    Enforces:
    - At most 4 generations per 10 minutes per client
    - At most 30 generations per hour globally
    Returns wait seconds if blocked, or None if allowed.
    """
    now = time.time()
    ten_min_ago = now - 600.0
    one_hour_ago = now - 3600.0

    # Purge old global history
    global _groq_calls_history
    _groq_calls_history = [t for t in _groq_calls_history if t > one_hour_ago]
    if len(_groq_calls_history) >= 30:
        oldest = _groq_calls_history[0]
        wait_needed = int(math.ceil(oldest + 3600.0 - now))
        return max(1, wait_needed)

    # Per-client history
    history = _client_request_history.setdefault(client_ip, [])
    _client_request_history[client_ip] = [t for t in history if t > ten_min_ago]
    if len(_client_request_history[client_ip]) >= 4:
        oldest = _client_request_history[client_ip][0]
        wait_needed = int(math.ceil(oldest + 600.0 - now))
        return max(1, wait_needed)

    return None


def record_successful_generation(client_ip: str):
    """Records timestamp for client and global rate tracking."""
    now = time.time()
    _groq_calls_history.append(now)
    _client_request_history.setdefault(client_ip, []).append(now)


# ==============================================================================
# Deterministic Fallbacks & Assembler (Task 3.8)
# ==============================================================================

def generate_fallback_prose(context: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Builds deterministic fallback prose dictionaries for clinician and patient."""
    preds = context["predictions"]
    cad_pct = preds["CAD"]["probability_pct"]
    cad_band = preds["CAD"]["risk_band"]
    shap_cad = context["top_shap_contributors"].get("CAD", [])

    top_names = ", ".join([f["feature"] for f in shap_cad[:3]]) or "measured physiological parameters"

    clinician_prose = {
        "model_output_summary": (
            f"Overall predicted probability for coronary artery disease is {cad_pct}%, "
            f"categorized as {cad_band} risk."
        ),
        "attribution": {
            "CAD": f"Primary physiological drivers include {top_names}.",
            "LAD": f"Key factors influencing LAD output include {top_names}.",
            "LCX": f"Key factors influencing LCX output include {top_names}.",
            "RCA": f"Key factors influencing RCA output include {top_names}.",
        },
        "methodological_notes": [
            "Evaluated using 55 non-invasive physiological features across 5 clinical categories.",
            "Target features LAD, LCX, RCA, and Cath were strictly excluded from model inputs to prevent target leakage.",
            "Reported outputs reflect calibrated probabilities derived from empirical post-test Bayesian odds, not direct anatomical lumen caliber measurements.",
        ],
    }

    patient_prose = {
        "what_this_is": (
            "This summary describes the numbers you entered and what a computer model predicted from them. "
            "It shows the calculated risk numbers for your heart arteries based on those measurements."
        ),
        "overall_picture": (
            f"The computer model evaluated your overall probability for coronary artery disease (CAD), "
            f"which is narrowing in the blood vessels that supply blood to your heart muscle. "
            f"The model estimated an overall predicted probability of {int(round(cad_pct))}%, "
            f"placing this estimate in the {cad_band.lower()} range."
        ),
        "arteries": {
            "LAD": (
                f"The LAD artery runs down the front of the heart and supplies blood to the front wall. "
                f"The model calculated a predicted narrowing probability of {int(round(preds['LAD']['probability_pct']))}%, "
                f"which is in the {preds['LAD']['risk_band'].lower()} category."
            ),
            "LCX": (
                f"The LCX artery curves around the left side of the heart to nourish the side and back walls. "
                f"The model calculated a predicted narrowing probability of {int(round(preds['LCX']['probability_pct']))}%, "
                f"which is in the {preds['LCX']['risk_band'].lower()} category."
            ),
            "RCA": (
                f"The RCA artery travels down the right side of the heart to bring blood to the right chambers and underside. "
                f"The model calculated a predicted narrowing probability of {int(round(preds['RCA']['probability_pct']))}%, "
                f"which is in the {preds['RCA']['risk_band'].lower()} category."
            ),
        },
        "influences": [
            f"{f['feature']}: {f['value']} pushed the predicted risk {'up' if 'increase' in f['direction'] else 'down'}."
            for f in shap_cad[:4]
        ] or ["Measurements entered were evaluated by the model."],
        "about_this_estimate": (
            "This estimate was calculated by a computer program trained on past health data from hospital patients. "
            "It produces statistical probability numbers based on patterns in your measurements. "
            "The computer program does not take pictures of your heart or directly measure blood flow."
        ),
    }

    return clinician_prose, patient_prose


def assemble_final_reports(
    context: Dict[str, Any],
    patient_data: Dict[str, Any],
    clinician_prose: Dict[str, Any],
    patient_prose: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Task 3.8 Assembler: Merges prose with deterministic tables into:
    - Clinician: 7 sections
    - Patient: 8 sections
    Disclaimer is ALWAYS inserted by code.
    """
    preds = context["predictions"]
    now_iso = datetime.now().isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # 1. Clinician Report (7 Sections)
    clinician_report = {
        "report_header": {
            "report_title": "Perfusion3D Hemodynamic & Coronary Ischemia Technical Evaluation",
            "generation_date_time": now_iso,
            "model_version": "Perfusion3D v1.0.0",
            "patient_age": patient_data.get("Age", 58),
            "patient_sex": patient_data.get("Sex", "Male"),
        },
        "model_output_summary": {
            "summary_text": clinician_prose.get("model_output_summary", ""),
            "targets": [
                {
                    "target": "CAD",
                    "display_name": "Overall Coronary Artery Disease",
                    "model_classification": preds["CAD"]["model_classification"],
                    "probability_pct": preds["CAD"]["probability_pct"],
                    "risk_band": preds["CAD"]["risk_band"],
                },
                {
                    "target": "LAD",
                    "display_name": "Left Anterior Descending Artery",
                    "model_classification": preds["LAD"]["model_classification"],
                    "probability_pct": preds["LAD"]["probability_pct"],
                    "risk_band": preds["LAD"]["risk_band"],
                },
                {
                    "target": "LCX",
                    "display_name": "Left Circumflex Artery",
                    "model_classification": preds["LCX"]["model_classification"],
                    "probability_pct": preds["LCX"]["probability_pct"],
                    "risk_band": preds["LCX"]["risk_band"],
                },
                {
                    "target": "RCA",
                    "display_name": "Right Coronary Artery",
                    "model_classification": preds["RCA"]["model_classification"],
                    "probability_pct": preds["RCA"]["probability_pct"],
                    "risk_band": preds["RCA"]["risk_band"],
                },
            ],
        },
        "input_parameters": {
            "groups": [
                {
                    "group_name": "Demographics",
                    "parameters": [
                        {"name": "Age", "value": patient_data.get("Age", 58), "unit": "years", "reference_range": "18-75", "within_range": float(patient_data.get("Age", 58)) <= 75},
                        {"name": "Sex", "value": patient_data.get("Sex", "Male"), "unit": "", "reference_range": "Male/Female", "within_range": True},
                        {"name": "Weight", "value": patient_data.get("Weight", 74), "unit": "kg", "reference_range": "50-90", "within_range": 50 <= float(patient_data.get("Weight", 74)) <= 90},
                        {"name": "Length", "value": patient_data.get("Length", 165), "unit": "cm", "reference_range": "150-190", "within_range": 150 <= float(patient_data.get("Length", 165)) <= 190},
                        {"name": "BMI", "value": patient_data.get("BMI", 27.2), "unit": "kg/m²", "reference_range": "18.5-24.9", "within_range": 18.5 <= float(patient_data.get("BMI", 27.2)) <= 24.9},
                    ],
                },
                {
                    "group_name": "Clinical Examination",
                    "parameters": [
                        {"name": "BP", "value": patient_data.get("BP", 130), "unit": "mmHg", "reference_range": "90-120", "within_range": 90 <= float(patient_data.get("BP", 130)) <= 120},
                        {"name": "PR", "value": patient_data.get("PR", 72), "unit": "bpm", "reference_range": "60-100", "within_range": 60 <= float(patient_data.get("PR", 72)) <= 100},
                        {"name": "DM", "value": patient_data.get("DM", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("DM", "0")) == "0"},
                        {"name": "HTN", "value": patient_data.get("HTN", "1"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("HTN", "1")) == "0"},
                        {"name": "Typical Chest Pain", "value": patient_data.get("Typical Chest Pain", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("Typical Chest Pain", "0")) == "0"},
                    ],
                },
                {
                    "group_name": "ECG",
                    "parameters": [
                        {"name": "Q Wave", "value": patient_data.get("Q Wave", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("Q Wave", "0")) == "0"},
                        {"name": "St Elevation", "value": patient_data.get("St Elevation", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("St Elevation", "0")) == "0"},
                        {"name": "St Depression", "value": patient_data.get("St Depression", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("St Depression", "0")) == "0"},
                        {"name": "Tinversion", "value": patient_data.get("Tinversion", "0"), "unit": "", "reference_range": "0", "within_range": str(patient_data.get("Tinversion", "0")) == "0"},
                    ],
                },
                {
                    "group_name": "Laboratory",
                    "parameters": [
                        {"name": "FBS", "value": patient_data.get("FBS", 98), "unit": "mg/dL", "reference_range": "70-99", "within_range": 70 <= float(patient_data.get("FBS", 98)) <= 99},
                        {"name": "CR", "value": patient_data.get("CR", 1.0), "unit": "mg/dL", "reference_range": "0.6-1.2", "within_range": 0.6 <= float(patient_data.get("CR", 1.0)) <= 1.2},
                        {"name": "TG", "value": patient_data.get("TG", 122), "unit": "mg/dL", "reference_range": "50-150", "within_range": 50 <= float(patient_data.get("TG", 122)) <= 150},
                        {"name": "LDL", "value": patient_data.get("LDL", 100), "unit": "mg/dL", "reference_range": "50-100", "within_range": 50 <= float(patient_data.get("LDL", 100)) <= 100},
                        {"name": "HDL", "value": patient_data.get("HDL", 39), "unit": "mg/dL", "reference_range": "40-60", "within_range": 40 <= float(patient_data.get("HDL", 39)) <= 60},
                    ],
                },
                {
                    "group_name": "Echocardiography",
                    "parameters": [
                        {"name": "EF-TTE", "value": patient_data.get("EF-TTE", 50), "unit": "%", "reference_range": "55-70", "within_range": 55 <= float(patient_data.get("EF-TTE", 50)) <= 70},
                        {"name": "Region RWMA", "value": patient_data.get("Region RWMA", "0"), "unit": "score", "reference_range": "0", "within_range": str(patient_data.get("Region RWMA", "0")) == "0"},
                        {"name": "VHD", "value": patient_data.get("VHD", "N"), "unit": "grade", "reference_range": "N", "within_range": str(patient_data.get("VHD", "N")) == "N"},
                    ],
                },
            ]
        },
        "parameters_outside_reference_range": [
            f"{p['name']}: {p['value']} {p['unit']} (reference {p['typical_range']})"
            for p in context.get("out_of_range_parameters", [])
        ] or ["All physiological parameters are within typical reference intervals."],
        "model_attribution": {
            "attribution_summary": clinician_prose.get("attribution", {}),
            "targets": [
                {
                    "target": "CAD",
                    "top_features": [
                        {"feature": f["feature"], "patient_value": f["value"], "direction": "INCREASES_RISK" if "increase" in f["direction"] else "DECREASES_RISK", "shap_value": f["magnitude"]}
                        for f in context["top_shap_contributors"].get("CAD", [])
                    ],
                },
                {
                    "target": "LAD",
                    "top_features": [
                        {"feature": f["feature"], "patient_value": f["value"], "direction": "INCREASES_RISK" if "increase" in f["direction"] else "DECREASES_RISK", "shap_value": f["magnitude"]}
                        for f in context["top_shap_contributors"].get("LAD", [])
                    ],
                },
                {
                    "target": "LCX",
                    "top_features": [
                        {"feature": f["feature"], "patient_value": f["value"], "direction": "INCREASES_RISK" if "increase" in f["direction"] else "DECREASES_RISK", "shap_value": f["magnitude"]}
                        for f in context["top_shap_contributors"].get("LCX", [])
                    ],
                },
                {
                    "target": "RCA",
                    "top_features": [
                        {"feature": f["feature"], "patient_value": f["value"], "direction": "INCREASES_RISK" if "increase" in f["direction"] else "DECREASES_RISK", "shap_value": f["magnitude"]}
                        for f in context["top_shap_contributors"].get("RCA", [])
                    ],
                },
            ],
        },
        "methodological_notes": clinician_prose.get("methodological_notes", []),
        "disclaimer": MANDATORY_DISCLAIMER,
    }

    # 2. Patient Report (8 Sections)
    arteries_prose = patient_prose.get("arteries", {})
    patient_report = {
        "title_and_date": {
            "title": "Your Heart Health Summary",
            "generation_date": today_str,
        },
        "what_this_summary_is": patient_prose.get("what_this_summary_is", ""),
        "overall_picture": patient_prose.get("overall_picture", ""),
        "your_three_main_heart_arteries": {
            "lad": {
                "name": "Left anterior descending (LAD) artery",
                "description": arteries_prose.get("LAD", ""),
                "probability_pct": preds["LAD"]["probability_pct"],
                "category": preds["LAD"]["risk_band"],
            },
            "lcx": {
                "name": "Left circumflex (LCX) artery",
                "description": arteries_prose.get("LCX", ""),
                "probability_pct": preds["LCX"]["probability_pct"],
                "category": preds["LCX"]["risk_band"],
            },
            "rca": {
                "name": "Right coronary (RCA) artery",
                "description": arteries_prose.get("RCA", ""),
                "probability_pct": preds["RCA"]["probability_pct"],
                "category": preds["RCA"]["risk_band"],
            },
        },
        "your_measurements": {
            "groups": [
                {
                    "category_name": "Body and Clinical Examination",
                    "items": [
                        {"plain_name": "Age", "your_value": f"{patient_data.get('Age', 58)} years", "typical_range": "18–75 years", "status": "Within range" if float(patient_data.get("Age", 58)) <= 75 else "Above typical range"},
                        {"plain_name": "Blood Pressure (systolic)", "your_value": f"{patient_data.get('BP', 130)} mmHg", "typical_range": "90–120 mmHg", "status": "Above typical range" if float(patient_data.get("BP", 130)) > 120 else "Within range"},
                        {"plain_name": "Resting Heart Rate", "your_value": f"{patient_data.get('PR', 72)} beats/min", "typical_range": "60–100 beats/min", "status": "Within range"},
                    ],
                },
                {
                    "category_name": "Heart Tracing (ECG)",
                    "items": [
                        {"plain_name": "ST-Segment Elevation", "your_value": "Present" if str(patient_data.get("St Elevation", "0")) == "1" else "Absent", "typical_range": "Absent", "status": "Within range" if str(patient_data.get("St Elevation", "0")) == "0" else "Outside typical range"},
                        {"plain_name": "ST-Segment Depression", "your_value": "Present" if str(patient_data.get("St Depression", "0")) == "1" else "Absent", "typical_range": "Absent", "status": "Within range" if str(patient_data.get("St Depression", "0")) == "0" else "Outside typical range"},
                    ],
                },
                {
                    "category_name": "Blood Tests",
                    "items": [
                        {"plain_name": "Fasting Blood Sugar", "your_value": f"{patient_data.get('FBS', 98)} mg/dL", "typical_range": "70–99 mg/dL", "status": "Within range" if float(patient_data.get("FBS", 98)) <= 99 else "Above typical range"},
                        {"plain_name": "Triglycerides", "your_value": f"{patient_data.get('TG', 122)} mg/dL", "typical_range": "50–150 mg/dL", "status": "Within range"},
                        {"plain_name": "Kidney Marker (Creatinine)", "your_value": f"{patient_data.get('CR', 1.0)} mg/dL", "typical_range": "0.6–1.2 mg/dL", "status": "Within range"},
                    ],
                },
                {
                    "category_name": "Heart Ultrasound (Echocardiogram)",
                    "items": [
                        {"plain_name": "Heart Pumping Fraction (EF)", "your_value": f"{patient_data.get('EF-TTE', 50)}%", "typical_range": "55–70%", "status": "Below typical range" if float(patient_data.get("EF-TTE", 50)) < 55 else "Within range"},
                    ],
                },
            ]
        },
        "what_influenced_the_prediction_most": patient_prose.get("influences", []),
        "about_this_estimate": patient_prose.get("about_this_estimate", ""),
        "disclaimer": MANDATORY_DISCLAIMER,
    }

    return {
        "clinician": clinician_report,
        "patient": patient_report,
    }


# ==============================================================================
# Unified Single-Call Generator & Streaming Engine (Task 3.1, 3.11)
# ==============================================================================

async def generate_unified_reports(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    client_ip: str = "127.0.0.1",
    force: bool = False,
    model_metadata: Optional[Dict[str, Any]] = None,
    mock_transport: Optional[httpx.BaseTransport] = None,
) -> AsyncGenerator[str, None]:
    """
    Unified generator yielding NDJSON events for POST /api/v1/reports/generate.
    GUARANTEE: Exactly one result event at completion.
    """
    global _cooldown_until, _cooldown_type, _last_groq_status
    start_time = time.perf_counter()
    api_key, model = get_groq_config()

    # Stage 1: Preparing
    yield json.dumps({"event": "stage", "stage": "preparing"}) + "\n"

    # Build compact context & allowed numbers
    compact_ctx = build_compact_context(patient_data, predictions, explanations)
    allowed_numbers = build_allowed_numbers(compact_ctx)

    # Fallback template baseline
    fallback_clinician, fallback_patient = generate_fallback_prose(compact_ctx)

    # Cache key: sha256(compact context + prompt version + model)
    cache_raw = f"{json.dumps(compact_ctx, sort_keys=True)}:{PROMPT_VERSION}:{model}"
    cache_key = hashlib.sha256(cache_raw.encode("utf-8")).hexdigest()

    # Check Client Limits (Task 3.10 c)
    client_wait = check_client_rate_limit(client_ip)
    if client_wait is not None:
        elapsed = round((time.perf_counter() - start_time) * 1000)
        reports = assemble_final_reports(compact_ctx, patient_data, fallback_clinician, fallback_patient)
        res = {
            "event": "result",
            "status": "client_limited",
            "source": "template",
            "model": model,
            "elapsed_ms": elapsed,
            "cooldown_s": client_wait,
            "section_sources": {k: "template" for k in ["clinician", "patient"]},
            "reports": reports,
            "generated_at": datetime.now().isoformat(),
        }
        yield json.dumps(res) + "\n"
        return

    # Check Cooldown
    now = time.time()
    if now < _cooldown_until:
        cooldown_s = int(math.ceil(_cooldown_until - now))
        elapsed = round((time.perf_counter() - start_time) * 1000)
        reports = assemble_final_reports(compact_ctx, patient_data, fallback_clinician, fallback_patient)
        res = {
            "event": "result",
            "status": _cooldown_type if _cooldown_type in ("rate_limited_minute", "rate_limited_daily") else "cooldown",
            "source": "template",
            "model": model,
            "elapsed_ms": elapsed,
            "cooldown_s": cooldown_s,
            "section_sources": {k: "template" for k in ["clinician", "patient"]},
            "reports": reports,
            "generated_at": datetime.now().isoformat(),
        }
        yield json.dumps(res) + "\n"
        return

    # Check Cache (Task 3.10 b)
    if not force and cache_key in _cache:
        ts, cached_result = _cache[cache_key]
        if now - ts < _cache_ttl_s:
            logger.info(f"[CACHE HIT] Returning cached report for {cache_key[:8]}")
            yield json.dumps(cached_result) + "\n"
            return

    # If no key, skip Groq immediately
    if not api_key:
        _last_groq_status = "no_key"
        elapsed = round((time.perf_counter() - start_time) * 1000)
        reports = assemble_final_reports(compact_ctx, patient_data, fallback_clinician, fallback_patient)
        res = {
            "event": "result",
            "status": "no_key",
            "source": "template",
            "model": model,
            "elapsed_ms": elapsed,
            "cooldown_s": None,
            "section_sources": {k: "template" for k in ["clinician", "patient"]},
            "reports": reports,
            "generated_at": datetime.now().isoformat(),
        }
        yield json.dumps(res) + "\n"
        return

    # Stage 2: Requesting
    yield json.dumps({"event": "stage", "stage": "requesting", "model": model}) + "\n"

    system_prompt = get_prompt_text()
    user_prompt = f"PATIENT REPORT CONTEXT (JSON):\n{json.dumps(compact_ctx, indent=2)}\n\nGenerate the combined report JSON object strictly matching the output contract."

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_completion_tokens": 1400,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "perfusion3d/1.0",
    }

    req_id = str(uuid.uuid4())[:8]
    prompt_chars = len(system_prompt) + len(user_prompt)
    est_tokens = prompt_chars // 4

    resp_data = None
    call_status = "ok"
    groq_resp = None

    # Single-flight guard (Task 3.10 a)
    # Check if an identical request is already in-flight
    if cache_key in _in_flight:
        logger.info(f"[SINGLE-FLIGHT] Awaiting identical concurrent request {cache_key[:8]}")
        try:
            identical_res = await _in_flight[cache_key]
            yield json.dumps(identical_res) + "\n"
            return
        except Exception:
            pass

    # Create Future for this request
    loop = asyncio.get_event_loop()
    flight_fut: asyncio.Future = loop.create_future()
    _in_flight[cache_key] = flight_fut

    try:
        async with httpx.AsyncClient(transport=mock_transport, timeout=40.0) as client:
            t0 = time.perf_counter()
            try:
                groq_resp = await client.post(groq_url, json=payload, headers=headers)
                t_elapsed_ms = round((time.perf_counter() - t0) * 1000)

                # Log call metrics (Task 3.13)
                rl_limit = groq_resp.headers.get("x-ratelimit-limit-tokens", "n/a")
                rl_remaining = groq_resp.headers.get("x-ratelimit-remaining-tokens", "n/a")
                rl_reset = groq_resp.headers.get("x-ratelimit-reset-tokens", "n/a")
                logger.info(
                    f"[GROQ CALL] req_id={req_id} prompt_chars={prompt_chars} est_tokens={est_tokens} "
                    f"max_tokens=1400 status={groq_resp.status_code} elapsed_ms={t_elapsed_ms} "
                    f"ratelimit_limit={rl_limit} ratelimit_remaining={rl_remaining} ratelimit_reset={rl_reset}"
                )

                # Handle minute-level 429 retry once if wait <= 15s (Task 3.1 a, 3.9 c)
                if groq_resp.status_code == 429:
                    limit_type, wait_s = parse_429_response(groq_resp.status_code, groq_resp.text, groq_resp.headers)
                    if limit_type == "rate_limited_minute" and wait_s <= 15.0:
                        yield json.dumps({"event": "stage", "stage": "waiting_retry", "retry_in_s": round(wait_s, 1)}) + "\n"
                        await asyncio.sleep(wait_s)

                        # Retry ONCE
                        t1 = time.perf_counter()
                        groq_resp = await client.post(groq_url, json=payload, headers=headers)
                        t1_elapsed = round((time.perf_counter() - t1) * 1000)
                        rl_rem2 = groq_resp.headers.get("x-ratelimit-remaining-tokens", "n/a")
                        logger.info(
                            f"[GROQ CALL RETRY] req_id={req_id} status={groq_resp.status_code} "
                            f"elapsed_ms={t1_elapsed} remaining={rl_rem2}"
                        )

                # Classify response
                if groq_resp.status_code == 200:
                    resp_data = groq_resp.json()
                    call_status = "ok"
                    record_successful_generation(client_ip)
                elif groq_resp.status_code == 401:
                    call_status = "key_rejected"
                elif groq_resp.status_code == 403:
                    body_lower = groq_resp.text.lower()
                    if "cloudflare" in body_lower or "<html" in body_lower:
                        call_status = "request_blocked"
                    else:
                        call_status = "access_denied"
                elif groq_resp.status_code in (400, 404):
                    call_status = "model_unavailable"
                elif groq_resp.status_code == 429:
                    limit_type, wait_s = parse_429_response(groq_resp.status_code, groq_resp.text, groq_resp.headers)
                    call_status = limit_type
                    _cooldown_type = limit_type
                    _cooldown_until = time.time() + wait_s
                else:
                    call_status = "network_error"

            except httpx.TimeoutException:
                call_status = "timeout"
            except Exception as e:
                logger.error(f"[GROQ CONNECTION ERROR] {e}")
                call_status = "network_error"

    finally:
        pass

    _last_groq_status = call_status

    # Stage 3: Checking
    yield json.dumps({"event": "stage", "stage": "checking"}) + "\n"

    parsed_json: Optional[Dict[str, Any]] = None
    if call_status == "ok" and resp_data:
        try:
            content_str = resp_data["choices"][0]["message"]["content"]
            # Defensive clean: strip BOM and markdown fences
            content_str = content_str.lstrip("\ufeff").strip()
            content_str = re.sub(r"^```(?:json)?\s*", "", content_str)
            content_str = re.sub(r"\s*```$", "", content_str)
            parsed_json = json.loads(content_str)
        except Exception as e:
            logger.warning(f"[PARSING ERROR] Failed parsing Groq JSON: {e}")
            call_status = "invalid_output"

    # Per-Field Validation & Assembly (Task 3.7)
    section_sources: Dict[str, str] = {}
    final_clinician = dict(fallback_clinician)
    final_patient = dict(fallback_patient)
    has_groq_section = False
    has_template_section = False

    if call_status == "ok" and parsed_json:
        # 1. Clinician model_output_summary
        cl_data = parsed_json.get("clinician", {})
        mos = cl_data.get("model_output_summary")
        if (
            isinstance(mos, str)
            and 1 <= count_sentences(mos) <= 2
            and not check_banned_phrase(mos)
            and all(is_number_allowed(n, allowed_numbers) for n in extract_all_numbers(mos))
        ):
            final_clinician["model_output_summary"] = mos
            section_sources["clinician.model_output_summary"] = "groq"
            has_groq_section = True
        else:
            section_sources["clinician.model_output_summary"] = "template"
            has_template_section = True

        # 2. Clinician attribution
        cl_attr = cl_data.get("attribution", {})
        final_attr = dict(fallback_clinician["attribution"])
        for v in ["CAD", "LAD", "LCX", "RCA"]:
            t_str = cl_attr.get(v)
            if (
                isinstance(t_str, str)
                and 1 <= count_sentences(t_str) <= 2
                and not check_banned_phrase(t_str)
                and all(is_number_allowed(n, allowed_numbers) for n in extract_all_numbers(t_str))
            ):
                final_attr[v] = t_str
                section_sources[f"clinician.attribution.{v}"] = "groq"
                has_groq_section = True
            else:
                section_sources[f"clinician.attribution.{v}"] = "template"
                has_template_section = True
        final_clinician["attribution"] = final_attr

        # 3. Clinician methodological_notes
        m_notes = cl_data.get("methodological_notes")
        if (
            isinstance(m_notes, list)
            and len(m_notes) == 3
            and all(isinstance(n, str) and not check_banned_phrase(n) for n in m_notes)
        ):
            final_clinician["methodological_notes"] = m_notes
            section_sources["clinician.methodological_notes"] = "groq"
            has_groq_section = True
        else:
            section_sources["clinician.methodological_notes"] = "template"
            has_template_section = True

        # 4. Patient what_this_is
        pt_data = parsed_json.get("patient", {})
        wti = pt_data.get("what_this_is")
        if (
            isinstance(wti, str)
            and count_sentences(wti) == 2
            and not check_banned_phrase(wti)
            and not check_jargon(wti)
            and get_average_words_per_sentence(wti) <= 20
        ):
            final_patient["what_this_is"] = wti
            section_sources["patient.what_this_is"] = "groq"
            has_groq_section = True
        else:
            section_sources["patient.what_this_is"] = "template"
            has_template_section = True

        # 5. Patient overall_picture
        op = pt_data.get("overall_picture")
        if (
            isinstance(op, str)
            and 2 <= count_sentences(op) <= 3
            and not check_banned_phrase(op)
            and not check_jargon(op)
            and get_average_words_per_sentence(op) <= 20
            and all(is_number_allowed(n, allowed_numbers) for n in extract_all_numbers(op))
        ):
            final_patient["overall_picture"] = op
            section_sources["patient.overall_picture"] = "groq"
            has_groq_section = True
        else:
            section_sources["patient.overall_picture"] = "template"
            has_template_section = True

        # 6. Patient arteries
        pt_art = pt_data.get("arteries", {})
        final_art = dict(fallback_patient["arteries"])
        for a in ["LAD", "LCX", "RCA"]:
            art_str = pt_art.get(a)
            if (
                isinstance(art_str, str)
                and 1 <= count_sentences(art_str) <= 3
                and not check_banned_phrase(art_str)
                and not check_jargon(art_str)
                and get_average_words_per_sentence(art_str) <= 20
                and all(is_number_allowed(n, allowed_numbers) for n in extract_all_numbers(art_str))
            ):
                final_art[a] = art_str
                section_sources[f"patient.arteries.{a}"] = "groq"
                has_groq_section = True
            else:
                section_sources[f"patient.arteries.{a}"] = "template"
                has_template_section = True
        final_patient["arteries"] = final_art

        # 7. Patient influences
        inf = pt_data.get("influences")
        if (
            isinstance(inf, list)
            and 3 <= len(inf) <= 5
            and all(
                isinstance(item, str)
                and count_sentences(item) == 1
                and not check_banned_phrase(item)
                and not check_jargon(item)
                and get_average_words_per_sentence(item) <= 20
                and all(is_number_allowed(n, allowed_numbers) for n in extract_all_numbers(item))
                for item in inf
            )
        ):
            final_patient["influences"] = inf
            section_sources["patient.influences"] = "groq"
            has_groq_section = True
        else:
            section_sources["patient.influences"] = "template"
            has_template_section = True

        # 8. Patient about_this_estimate
        ate = pt_data.get("about_this_estimate")
        if (
            isinstance(ate, str)
            and 3 <= count_sentences(ate) <= 4
            and not check_banned_phrase(ate)
            and not check_jargon(ate)
            and get_average_words_per_sentence(ate) <= 20
        ):
            final_patient["about_this_estimate"] = ate
            section_sources["patient.about_this_estimate"] = "groq"
            has_groq_section = True
        else:
            section_sources["patient.about_this_estimate"] = "template"
            has_template_section = True
    else:
        has_template_section = True
        section_sources = {k: "template" for k in ["clinician", "patient"]}

    # Determine overall source category
    if has_groq_section and not has_template_section:
        overall_source = "groq"
    elif has_groq_section and has_template_section:
        overall_source = "mixed"
    else:
        overall_source = "template"

    # Stage 4: Building
    yield json.dumps({"event": "stage", "stage": "building"}) + "\n"

    final_reports = assemble_final_reports(compact_ctx, patient_data, final_clinician, final_patient)
    elapsed_total_ms = round((time.perf_counter() - start_time) * 1000)

    cooldown_s_val = None
    if time.time() < _cooldown_until:
        cooldown_s_val = int(math.ceil(_cooldown_until - time.time()))

    result_event = {
        "event": "result",
        "status": call_status,
        "source": overall_source,
        "model": model,
        "elapsed_ms": elapsed_total_ms,
        "cooldown_s": cooldown_s_val,
        "section_sources": section_sources,
        "reports": final_reports,
        "generated_at": datetime.now().isoformat(),
    }

    # Store in in-memory cache if successful or mixed
    if call_status == "ok":
        if len(_cache) >= _cache_max_size:
            # Drop oldest entry
            oldest_k = min(_cache.keys(), key=lambda k: _cache[k][0])
            _cache.pop(oldest_k, None)
        _cache[cache_key] = (time.time(), result_event)

    # Resolve single-flight future
    if not flight_fut.done():
        flight_fut.set_result(result_event)
    _in_flight.pop(cache_key, None)

    yield json.dumps(result_event) + "\n"


# ==============================================================================
# Configuration Status (Task 3.12 - ZERO Groq calls)
# ==============================================================================

def get_reports_status() -> Dict[str, Any]:
    """
    Task 3.12: Returns configuration status facts only.
    Makes NO call to Groq.
    """
    load_and_check_env()
    api_key, model = get_groq_config()
    raw_key = os.environ.get("GROQ_API_KEY", "")

    now = time.time()
    cooldown_s = None
    if now < _cooldown_until:
        cooldown_s = int(math.ceil(_cooldown_until - now))

    # Calls in last hour
    one_hour_ago = now - 3600.0
    calls_last_hour = sum(1 for t in _groq_calls_history if t > one_hour_ago)

    key_present = bool(api_key and not is_placeholder(api_key))
    key_is_placeholder_val = is_placeholder(clean_env_str(raw_key))

    return {
        "key_present": key_present,
        "key_is_placeholder": key_is_placeholder_val,
        "key_length": len(api_key) if api_key else 0,
        "model": model,
        "cooldown_s": cooldown_s,
        "groq_calls_last_hour": calls_last_hour,
        "last_status": _last_groq_status,
        # Backward compatibility
        "env_file_found": (REPO_ROOT / ".env").exists(),
        "env_file_path": str(REPO_ROOT / ".env"),
        "key_prefix_ok": bool(api_key and api_key.startswith("gsk_")),
        "configured": key_present,
        "model_status": "ready",
        "fallback_available": True,
    }


def get_reports_diagnostics() -> Dict[str, Any]:
    """Alias for backwards compatibility with existing route imports."""
    return get_reports_status()


def build_report_context(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    model_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Backward compatibility wrapper around build_compact_context."""
    return build_compact_context(patient_data, predictions, explanations, model_metadata or {})


def generate_deterministic_technical_report(context: Dict[str, Any]) -> Dict[str, Any]:
    """Backward compatibility wrapper returning deterministic clinician report."""
    clin_prose, _ = generate_fallback_prose(context)
    reports = assemble_final_reports(context, context.get("patient_inputs", {}), clin_prose, {})
    rep = reports["clinician"]
    rep["source"] = "template"
    return rep


def generate_deterministic_patient_report(context: Dict[str, Any]) -> Dict[str, Any]:
    """Backward compatibility wrapper returning deterministic patient report."""
    _, pat_prose = generate_fallback_prose(context)
    reports = assemble_final_reports(context, context.get("patient_inputs", {}), {}, pat_prose)
    rep = reports["patient"]
    rep["source"] = "template"
    return rep



def validate_report_json(
    report: Dict[str, Any],
    sections_order: List[str],
    context: Dict[str, Any],
) -> Tuple[bool, Optional[str]]:
    """Validates report JSON structure, ordering, disclaimer, banned phrases, and numbers."""
    if not isinstance(report, dict):
        return False, "Report is not a dictionary"

    # 1. Section ordering
    report_keys = [k for k in report.keys() if k != "source"]
    if report_keys != sections_order:
        return False, f"Sections out of order or missing. Expected {sections_order}, got {report_keys}"

    # 2. Disclaimer
    if report.get("disclaimer") != MANDATORY_DISCLAIMER:
        return False, f"Disclaimer section does not match mandatory clinical disclaimer text."

    # 3. Banned phrases
    report_str = json.dumps(report)
    bp = check_banned_phrase(report_str)
    if bp:
        return False, f"Banned advisory phrase detected: '{bp}'"

    # 4. Number validation
    allowed_numbers = build_allowed_numbers(context)
    found_numbers = re.findall(r"\b\d+(?:\.\d+)?\b", report_str)
    for n_str in found_numbers:
        try:
            n_val = float(n_str)
            if not is_number_allowed(n_val, allowed_numbers):
                return False, f"Hallucinated number detected: {n_val}"
        except ValueError:
            pass

    return True, None


def reset_rate_limits_and_cache() -> None:
    """Resets in-memory state for isolated test execution."""
    global _cooldown_until, _cooldown_type, _last_groq_status
    _cooldown_until = 0.0
    _cooldown_type = "ok"
    _last_groq_status = "ok"
    _groq_calls_history.clear()
    _client_request_history.clear()
    _cache.clear()
    _in_flight.clear()




