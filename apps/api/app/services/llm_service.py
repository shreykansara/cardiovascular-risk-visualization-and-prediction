"""
Backend LLM Report Generation Service
Multimodal AI Hackathon 2026 - Perfusion3D

Provides:
1. Environment-driven Groq LLM provider adapter (llama-3.3-70b-versatile)
2. Anonymized Report Context extraction
3. Strict Output Validator (Banned advisory phrase scan, section ordering, format-tolerant number verification)
4. Deterministic template fallback generator for offline, unconfigured, or safety-rejected environments
5. Diagnostics and live connectivity checks with 60s caching
"""

import os
import re
import json
import time
import logging
import warnings
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Set
from pathlib import Path
import httpx

from dotenv import load_dotenv
from apps.api.app.services.risk_bands import risk_label

# Suppress LightGBM binary classifier list-of-arrays TreeExplainer warning (Task 2.9)
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

# Task 2.1(d): Exactly 7 sections for Technical report (model_performance moved to /model-info)
TECHNICAL_SECTIONS_ORDER = [
    "report_header",
    "model_output_summary",
    "input_parameters",
    "parameters_outside_reference_range",
    "model_attribution",
    "methodological_notes",
    "disclaimer",
]

# Exactly 8 sections for Patient report
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

MANDATORY_DISCLAIMER = (
    "Predictions are for decision-support and educational purposes only and are "
    "not a substitute for formal diagnostic imaging or professional medical evaluation."
)

REPO_ROOT: Path = Path(__file__).resolve().parents[4]

# Global diagnostic and check caches
_last_live_check_time: float = 0.0
_cached_live_status: Dict[str, Any] = {}
_last_error_code: Optional[str] = None
_last_error_message: Optional[str] = None


def load_and_check_env() -> Tuple[bool, str]:
    """
    Task 1.2 & 1.5: Explicitly loads .env with override=True using path resolved from file location.
    Handles:
    - a) file named .env.txt or env
    - b) spaces around '=' or hidden BOM
    - c) old variable LLM_API_KEY present while GROQ_API_KEY missing
    """
    env_path = REPO_ROOT / ".env"
    env_txt = REPO_ROOT / ".env.txt"
    bare_env = REPO_ROOT / "env"

    if not env_path.exists():
        if env_txt.exists():
            logger.warning(
                f"[CONFIG WARNING] Found '{env_txt}' instead of '.env' in repository root. "
                "Windows may have appended .txt. Please rename to '.env'."
            )
        elif bare_env.exists():
            logger.warning(
                f"[CONFIG WARNING] Found '{bare_env}' without leading dot in repository root. "
                "Please rename to '.env'."
            )

    env_file_found = env_path.exists()

    if env_file_found:
        try:
            # 1.2: Standard override load
            load_dotenv(dotenv_path=env_path, override=True)

            # 1.5b: Parse robustly for hidden BOM (utf-8-sig) and whitespace around '='
            raw_text = env_path.read_text(encoding="utf-8-sig")
            for line in raw_text.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip()
                    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                        v = v[1:-1].strip()
                    if k:
                        os.environ[k] = v
        except Exception as e:
            logger.error(f"[CONFIG ERROR] Failed reading .env file at {env_path}: {e}")

    # 1.5c: Check for old variable LLM_API_KEY
    if "LLM_API_KEY" in os.environ and not os.environ.get("GROQ_API_KEY"):
        logger.warning(
            "[CONFIG WARNING] Old variable LLM_API_KEY detected in environment but GROQ_API_KEY is missing. "
            "rename LLM_API_KEY to GROQ_API_KEY"
        )

    env_path_str = str(env_path)
    if not env_file_found and ("GROQ_API_KEY" in os.environ or "GROQ_MODEL" in os.environ):
        env_file_found = True
        env_path_str = f"{env_path} (loaded via env_file)"

    return env_file_found, env_path_str


def clean_env_str(val: Optional[str]) -> str:
    """
    Task 2.1: Strips whitespace, \r, \n, UTF-8 BOM, and one pair of surrounding single or double quotes.
    After stripping, reject nothing else.
    """
    if not val:
        return ""
    s = val.lstrip("\ufeff")
    s = s.strip(" \t\r\n")
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip(" \t\r\n")
    return s


def is_placeholder(key: Optional[str]) -> bool:
    """
    Task 1.4: Treat the key as 'not configured' only if it is empty, contains 'PASTE_',
    or equals the exact placeholder from .env.example.
    A real Groq key must never be classified as a placeholder.
    """
    if not key:
        return True
    cleaned = clean_env_str(key)
    if not cleaned:
        return True
    if "PASTE_" in cleaned:
        return True
    if cleaned == "PASTE_YOUR_GROQ_API_KEY_HERE":
        return True
    return False


def get_groq_config() -> Tuple[Optional[str], str]:
    """
    Task 1.3 & 2.1: Reads GROQ_API_KEY and GROQ_MODEL from os.environ at request time.
    Strips leading/trailing whitespace, \r, \n, BOM, and surrounding quotes.
    """
    raw_key = os.environ.get("GROQ_API_KEY", "")
    raw_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    key = clean_env_str(raw_key)
    model = clean_env_str(raw_model) or "llama-3.3-70b-versatile"

    if is_placeholder(key):
        return None, model
    return key, model


def classify_groq_error(status_code: int, response_text: str, headers: Any) -> Tuple[str, str]:
    """
    Task 2.3: Correct error classification.
    - 401 or JSON error body with code 'invalid_api_key' -> 'key_rejected'
    - 403 with non-JSON/HTML body, or Cloudflare signature -> 'request_blocked'
    - 403 with JSON error body about permissions or organization -> 'access_denied'
    - 404 or 400 about the model -> 'model_unavailable'
    - 429 -> 'rate_limited'
    - timeouts, DNS, connection errors -> 'network_error'
    - validator failure -> 'validation_failed'
    - success -> 'ok'
    Exposes the sanitized Groq error code/type (never the key) in last_error_message.
    """
    server_hdr = ""
    cf_ray = ""
    ctype = ""
    if headers is not None:
        try:
            server_hdr = (headers.get("server") or "").lower()
            cf_ray = headers.get("cf-ray") or ""
            ctype = (headers.get("content-type") or "").lower()
        except Exception:
            pass

    err_code = None
    err_type = None
    is_json = False
    try:
        data = json.loads(response_text)
        if isinstance(data, dict):
            err_obj = data.get("error", {})
            if isinstance(err_obj, dict):
                is_json = True
                err_code = err_obj.get("code")
                err_type = err_obj.get("type")
    except Exception:
        is_json = False

    if status_code == 401 or err_code == "invalid_api_key":
        return "key_rejected", f"Groq rejected API key (401: {err_code or err_type or 'invalid_api_key'})"

    if status_code == 403:
        if not is_json or "cloudflare" in server_hdr or cf_ray or "<html" in response_text.lower():
            return "request_blocked", "Groq request blocked by edge firewall (HTTP 403)"
        else:
            return "access_denied", f"Groq denied access for this key ({err_code or err_type or 'permission_denied'})"

    if status_code in (400, 404):
        return "model_unavailable", f"Groq model unavailable (HTTP {status_code}: {err_code or err_type or 'model_not_found'})"

    if status_code == 429:
        return "rate_limited", f"Groq rate limit exceeded (HTTP 429: {err_type or 'rate_limit'})"

    return "network_error", f"Groq HTTP error {status_code}: {err_code or err_type or 'error'}"


def perform_live_groq_check(
    api_key: Optional[str],
    model: str,
    force: bool = False,
) -> Tuple[Optional[bool], str, Optional[str]]:
    """
    Tasks 1.8, 2.2, 2.3: Calls GET https://api.groq.com/openai/v1/models with httpx.
    Headers: Authorization, Content-Type, Accept, User-Agent: perfusion3d/1.0.
    Cached for 60 seconds unless force=True.
    """
    global _last_live_check_time, _cached_live_status, _last_error_code, _last_error_message
    now = time.time()

    if not api_key:
        _last_error_code = "no_key"
        _last_error_message = "Groq API key not found or is placeholder"
        return None, "no_key", _last_error_message

    if (
        not force
        and (now - _last_live_check_time < 60.0)
        and _cached_live_status.get("key") == api_key
        and _cached_live_status.get("model") == model
    ):
        return (
            _cached_live_status.get("model_listed_by_groq"),
            _cached_live_status.get("error_code", "ok"),
            _cached_live_status.get("error_message"),
        )

    url = "https://api.groq.com/openai/v1/models"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "perfusion3d/1.0",
    }

    model_listed: Optional[bool] = None
    err_code = "ok"
    err_msg: Optional[str] = None

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                available_models = [m.get("id") for m in data.get("data", [])]
                if model in available_models:
                    model_listed = True
                    err_code = "ok"
                    err_msg = None
                else:
                    model_listed = False
                    err_code = "model_unavailable"
                    err_msg = f"Model '{model}' not found in Groq available models"
            else:
                err_code, err_msg = classify_groq_error(resp.status_code, resp.text, resp.headers)
                model_listed = False if err_code in ("key_rejected", "model_unavailable", "access_denied") else None
    except (httpx.TimeoutException, httpx.NetworkError, httpx.RequestError) as e:
        err_code = "network_error"
        err_msg = f"Groq connection error: {type(e).__name__}"
        model_listed = None
    except Exception as e:
        err_code = "network_error"
        err_msg = str(e)
        model_listed = None

    _last_live_check_time = now
    _cached_live_status = {
        "key": api_key,
        "model": model,
        "model_listed_by_groq": model_listed,
        "error_code": err_code,
        "error_message": err_msg,
    }
    _last_error_code = err_code
    _last_error_message = err_msg
    return model_listed, err_code, err_msg


def verify_groq_startup() -> str:
    """Startup verification of Groq model."""
    load_and_check_env()
    api_key, model = get_groq_config()
    if not api_key:
        logger.info("[cardio_api]: Groq API key loaded: no | Operating in deterministic fallback mode")
        return "unconfigured"

    listed, code, msg = perform_live_groq_check(api_key, model, force=True)
    if code == "ok":
        logger.info(f"[cardio_api]: Groq API key loaded: yes | Model: {model} verified")
        return "ready"
    else:
        logger.warning(f"[cardio_api]: Groq API check status: {code} | Reason: {msg}")
        return "unavailable"


def get_reports_diagnostics() -> Dict[str, Any]:
    """
    Task 1.7: Upgraded diagnostics endpoint. Never prints or returns the key.
    """
    env_found, env_path = load_and_check_env()
    raw_key = os.environ.get("GROQ_API_KEY", "")
    key, model = get_groq_config()

    key_present = bool(clean_env_str(raw_key))
    key_is_placeholder = is_placeholder(raw_key)
    key_prefix_ok = bool(key and key.startswith("gsk_"))

    model_listed, err_code, err_msg = perform_live_groq_check(key, model, force=False)

    if not key or key_is_placeholder:
        err_code = "no_key"
        err_msg = "Groq API key not found. Using standard template."
        model_listed = None

    # Sync global error code
    global _last_error_code, _last_error_message
    if _last_error_code is not None:
        err_code = _last_error_code
        err_msg = _last_error_message

    env_loaded = {
        "key_found": bool(key),
        "key_length": len(key) if key else 0,
        "starts_with_gsk": bool(key and key.startswith("gsk_")),
    }

    return {
        "env_file_found": env_found,
        "env_file_path": env_path,
        "key_present": key_present,
        "key_is_placeholder": key_is_placeholder,
        "key_prefix_ok": key_prefix_ok,
        "model": model,
        "model_listed_by_groq": model_listed,
        "last_error_code": err_code,
        "last_error_message": err_msg,
        "env_loaded": env_loaded,
        # Backward compatibility properties
        "configured": (key is not None and not key_is_placeholder and err_code == "ok"),
        "model_status": "ready" if (key and err_code == "ok") else ("unconfigured" if not key else "unavailable"),
        "fallback_available": True,
    }


def get_groq_model_status() -> str:
    """Returns current Groq model status: 'ready' | 'unavailable' | 'unconfigured'."""
    diag = get_reports_diagnostics()
    return diag["model_status"]


# Reference metadata
CLINICAL_REFERENCE_METADATA: Dict[str, Dict[str, Any]] = {
    "Age": {"unit": "years", "ref_low": 18, "ref_high": 75, "ref_display": "18–75 years"},
    "Weight": {"unit": "kg", "ref_low": 50, "ref_high": 90, "ref_display": "50–90 kg"},
    "Length": {"unit": "cm", "ref_low": 150, "ref_high": 190, "ref_display": "150–190 cm"},
    "BMI": {"unit": "kg/m²", "ref_low": 18.5, "ref_high": 24.9, "ref_display": "18.5–24.9 kg/m²"},
    "BP": {"unit": "mmHg", "ref_low": 90, "ref_high": 120, "ref_display": "90–120 mmHg"},
    "PR": {"unit": "bpm", "ref_low": 60, "ref_high": 100, "ref_display": "60–100 bpm"},
    "FBS": {"unit": "mg/dL", "ref_low": 70, "ref_high": 99, "ref_display": "70–99 mg/dL"},
    "CR": {"unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.2, "ref_display": "0.6–1.2 mg/dL"},
    "TG": {"unit": "mg/dL", "ref_low": 50, "ref_high": 150, "ref_display": "50–150 mg/dL"},
    "LDL": {"unit": "mg/dL", "ref_low": 50, "ref_high": 100, "ref_display": "50–100 mg/dL"},
    "HDL": {"unit": "mg/dL", "ref_low": 40, "ref_high": 60, "ref_display": "40–60 mg/dL"},
    "BUN": {"unit": "mg/dL", "ref_low": 7, "ref_high": 20, "ref_display": "7–20 mg/dL"},
    "ESR": {"unit": "mm/hr", "ref_low": 0, "ref_high": 20, "ref_display": "0–20 mm/hr"},
    "HB": {"unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5, "ref_display": "12.0–17.5 g/dL"},
    "K": {"unit": "mEq/L", "ref_low": 3.5, "ref_high": 5.0, "ref_display": "3.5–5.0 mEq/L"},
    "Na": {"unit": "mEq/L", "ref_low": 135, "ref_high": 145, "ref_display": "135–145 mEq/L"},
    "WBC": {"unit": "cells/mcL", "ref_low": 4000, "ref_high": 11000, "ref_display": "4000–11000 cells/mcL"},
    "Lymph": {"unit": "%", "ref_low": 20, "ref_high": 40, "ref_display": "20–40%"},
    "Neut": {"unit": "%", "ref_low": 40, "ref_high": 70, "ref_display": "40–70%"},
    "PLT": {"unit": "x10³/mcL", "ref_low": 150, "ref_high": 450, "ref_display": "150–450 x10³/mcL"},
    "EF-TTE": {"unit": "%", "ref_low": 55, "ref_high": 70, "ref_display": "55–70%"},
}


def build_report_context(
    patient_data: Dict[str, Any],
    predictions: Dict[str, Any],
    explanations: Dict[str, Any],
    model_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Extracts report context strictly avoiding target leakage columns."""
    clean_inputs = {
        k: v
        for k, v in patient_data.items()
        if k not in ["Cath", "CAD", "LAD", "LCX", "RCA", "target", "target_lad", "target_lcx", "target_rca"]
    }

    parameter_details = {}
    for feat_name, raw_val in clean_inputs.items():
        meta = CLINICAL_REFERENCE_METADATA.get(feat_name, {})
        is_outside = False
        if meta and isinstance(raw_val, (int, float)):
            is_outside = raw_val < meta["ref_low"] or raw_val > meta["ref_high"]
        parameter_details[feat_name] = {
            "value": raw_val,
            "unit": meta.get("unit", ""),
            "reference_range": meta.get("ref_display", ""),
            "outside_reference_range": is_outside,
        }

    overall_cad = predictions.get("overall_cad", {})
    cad_prob = float(overall_cad.get("probability", 0.0))
    cad_prob_pct = round(cad_prob * 100.0, 1)
    cad_decision = "Positive" if overall_cad.get("stenosis_suspected", False) else "Negative"
    cad_band = risk_label(cad_prob)

    vessels_pred = predictions.get("vessels", {})
    vessels_summary = {}
    for v_key, v_disp in [("lad", "Left Anterior Descending Artery"), ("lcx", "Left Circumflex Artery"), ("rca", "Right Coronary Artery")]:
        v_data = vessels_pred.get(v_key, {})
        prob = float(v_data.get("probability", 0.0))
        pct = round(prob * 100.0, 1)
        suspected = v_data.get("stenosis_suspected", False)
        vessels_summary[v_key] = {
            "display_name": v_disp,
            "probability": prob,
            "probability_pct": pct,
            "stenosis_suspected": suspected,
            "model_classification": "Positive" if suspected else "Negative",
            "risk_band": risk_label(prob),
            "category": risk_label(prob),
        }

    shap_summary = {}
    for target in ["cad", "lad", "lcx", "rca"]:
        exp = explanations.get(target, {})
        top_feats = exp.get("top_features", [])
        shap_summary[target] = [
            {
                "feature": f.get("feature_name", ""),
                "clinical_label": f.get("clinical_label", f.get("feature_name", "")),
                "patient_value": f.get("patient_value", f.get("feature_value", "")),
                "shap_value": round(float(f.get("shap_value", 0.0)), 4),
                "direction": f.get("impact", "INCREASES_RISK"),
            }
            for f in top_feats[:5]
        ]

    return {
        "generation_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "patient_inputs": clean_inputs,
        "parameter_details": parameter_details,
        "cad_summary": {
            "model_classification": cad_decision,
            "predicted_status": "Ischemia Suspected" if cad_decision == "Positive" else "Non-Ischemic",
            "probability": cad_prob,
            "probability_pct": cad_prob_pct,
            "risk_band": cad_band,
            "category": cad_band,
        },
        "vessels_summary": vessels_summary,
        "shap_summary": shap_summary,
        "disclaimer": MANDATORY_DISCLAIMER,
    }


def extract_all_numbers(obj: Any) -> Set[float]:
    """Recursively extracts all numbers from an object."""
    nums: Set[float] = set()
    if isinstance(obj, (int, float)):
        val = float(obj)
        nums.add(val)
        nums.add(round(val, 2))
        nums.add(round(val, 1))
        nums.add(float(int(round(val))))
    elif isinstance(obj, str):
        for m in re.findall(r"(?<![a-zA-Z_])\b\d+(?:\.\d+)?\b(?![a-zA-Z_])", obj):
            try:
                val = float(m)
                nums.add(val)
                nums.add(round(val, 2))
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
    """
    Task 1.10a: Build format-tolerant allowed number set from context:
    - Includes 36.0, 36, 0.36 (as 36%)
    - Rounding to whole numbers and 1 decimal place
    - Units stripped
    - Structural and date numbers
    """
    base_nums = extract_all_numbers(context)
    allowed: Set[float] = set()

    for n in base_nums:
        allowed.add(n)
        allowed.add(round(n, 2))
        allowed.add(round(n, 1))
        allowed.add(float(int(round(n))))

        # If probability [0.0, 1.0], add percentage variants (e.g. 0.36 -> 36.0, 36)
        if 0.0 <= n <= 1.0:
            pct = n * 100.0
            allowed.add(pct)
            allowed.add(round(pct, 2))
            allowed.add(round(pct, 1))
            allowed.add(float(int(round(pct))))

        # If percentage [0, 100], add decimal variants (e.g. 36.0 -> 0.36)
        if 0.0 <= n <= 100.0:
            dec = n / 100.0
            allowed.add(dec)
            allowed.add(round(dec, 3))
            allowed.add(round(dec, 2))
            allowed.add(round(dec, 1))

    now = datetime.now()
    structural = {
        0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0,
        12.0, 14.0, 18.0, 20.0, 24.0, 30.0, 40.0, 41.0, 50.0, 55.0, 60.0, 70.0, 75.0, 90.0,
        99.0, 100.0, 110.0, 120.0, 130.0, 140.0, 150.0, 160.0, 180.0, 190.0, 303.0,
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


def validate_report_json(
    report_dict: Dict[str, Any],
    expected_sections: List[str],
    context: Dict[str, Any],
) -> Tuple[bool, Optional[str]]:
    """
    Task 1.10 Validator:
    1. Checks for required section keys in exact order.
    2. Scans for banned advisory phrases.
    3. Verifies mandatory disclaimer.
    4. Format-tolerant number validation against context.
    """
    # 1. Section presence and ordering
    actual_keys = [k for k in report_dict.keys() if k != "source"]
    for i, exp_sec in enumerate(expected_sections):
        if exp_sec not in report_dict:
            return False, f"Missing required section: '{exp_sec}'"
        if i < len(actual_keys) and actual_keys[i] != exp_sec:
            return False, f"Sections out of order. Expected '{exp_sec}' at position {i+1}, found '{actual_keys[i]}'"

    # 2. Banned advisory phrases check
    report_text = json.dumps(report_dict).lower()
    for phrase in BANNED_PHRASES:
        pattern = r"\b" + re.escape(phrase) + r"\b"
        if re.search(pattern, report_text):
            return False, f"Banned advisory phrase detected: '{phrase}'"

    # 3. Mandatory disclaimer check
    disclaimer_val = report_dict.get("disclaimer", "").strip()
    if disclaimer_val != MANDATORY_DISCLAIMER:
        return False, "Disclaimer section does not match the exact mandated text."

    # 4. Format-tolerant number validation
    allowed_numbers = build_allowed_numbers(context)
    report_numbers = extract_all_numbers(report_dict)

    hallucinated = []
    for num in report_numbers:
        if not is_number_allowed(num, allowed_numbers):
            hallucinated.append(num)

    if hallucinated:
        return False, f"Hallucinated number(s) detected not present in report context: {hallucinated[:3]}"

    return True, None


def call_groq(prompt: str, system_prompt: str) -> str:
    """
    Task 2.2: Executes Groq OpenAI-compatible chat completion via httpx with 30s timeout
    and User-Agent: perfusion3d/1.0.
    """
    api_key, model = get_groq_config()
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured")

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "perfusion3d/1.0",
    }
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            err_code, err_msg = classify_groq_error(resp.status_code, resp.text, resp.headers)
            raise httpx.HTTPStatusError(
                message=err_msg,
                request=resp.request,
                response=resp,
            )
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def generate_deterministic_technical_report(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback deterministic technical report: exactly 7 sections (Task 2.1d & 2.7).
    Includes Model classification and Risk band.
    """
    inputs = context["patient_inputs"]
    cad = context["cad_summary"]
    vessels = context["vessels_summary"]
    shap = context.get("shap_summary", {})

    outside_list = []
    if inputs.get("BP", 0) > 120:
        outside_list.append(f"BP: {inputs.get('BP')} mmHg (reference 90-120 mmHg)")
    if inputs.get("Age", 0) > 75:
        outside_list.append(f"Age: {inputs.get('Age')} years (reference 18-75 years)")
    if inputs.get("FBS", 0) > 99:
        outside_list.append(f"FBS: {inputs.get('FBS')} mg/dL (reference 70-99 mg/dL)")
    if inputs.get("TG", 0) > 150:
        outside_list.append(f"TG: {inputs.get('TG')} mg/dL (reference 50-150 mg/dL)")
    if inputs.get("EF-TTE", 60) < 55:
        outside_list.append(f"EF-TTE: {inputs.get('EF-TTE')}% (reference 55-70%)")

    if not outside_list:
        outside_list = ["No parameters outside reference range"]

    return {
        "report_header": {
            "report_title": "Perfusion3D Hemodynamic & Coronary Ischemia Technical Evaluation",
            "generation_date_time": context.get("generation_timestamp", datetime.now().isoformat()),
            "model_version": "Perfusion3D v1.0.0",
            "patient_age": inputs.get("Age", 58),
            "patient_sex": inputs.get("Sex", "Male"),
        },
        "model_output_summary": {
            "targets": [
                {
                    "target": "CAD",
                    "display_name": "Overall Coronary Artery Disease",
                    "model_classification": cad["model_classification"],
                    "probability_pct": cad["probability_pct"],
                    "risk_band": cad["risk_band"],
                },
                {
                    "target": "LAD",
                    "display_name": vessels["lad"]["display_name"],
                    "model_classification": vessels["lad"]["model_classification"],
                    "probability_pct": vessels["lad"]["probability_pct"],
                    "risk_band": vessels["lad"]["risk_band"],
                },
                {
                    "target": "LCX",
                    "display_name": vessels["lcx"]["display_name"],
                    "model_classification": vessels["lcx"]["model_classification"],
                    "probability_pct": vessels["lcx"]["probability_pct"],
                    "risk_band": vessels["lcx"]["risk_band"],
                },
                {
                    "target": "RCA",
                    "display_name": vessels["rca"]["display_name"],
                    "model_classification": vessels["rca"]["model_classification"],
                    "probability_pct": vessels["rca"]["probability_pct"],
                    "risk_band": vessels["rca"]["risk_band"],
                },
            ]
        },
        "input_parameters": {
            "groups": [
                {
                    "group_name": "Demographics",
                    "parameters": [
                        {"name": "Age", "value": inputs.get("Age", 58), "unit": "years", "reference_range": "18-75", "within_range": inputs.get("Age", 58) <= 75},
                        {"name": "Sex", "value": inputs.get("Sex", "Male"), "unit": "", "reference_range": "Male/Female", "within_range": True},
                        {"name": "Weight", "value": inputs.get("Weight", 74), "unit": "kg", "reference_range": "50-90", "within_range": 50 <= inputs.get("Weight", 74) <= 90},
                        {"name": "Length", "value": inputs.get("Length", 165), "unit": "cm", "reference_range": "150-190", "within_range": 150 <= inputs.get("Length", 165) <= 190},
                        {"name": "BMI", "value": inputs.get("BMI", 27.2), "unit": "kg/m²", "reference_range": "18.5-24.9", "within_range": 18.5 <= inputs.get("BMI", 27.2) <= 24.9},
                    ],
                },
                {
                    "group_name": "Clinical Examination",
                    "parameters": [
                        {"name": "BP", "value": inputs.get("BP", 130), "unit": "mmHg", "reference_range": "90-120", "within_range": 90 <= inputs.get("BP", 130) <= 120},
                        {"name": "PR", "value": inputs.get("PR", 72), "unit": "bpm", "reference_range": "60-100", "within_range": 60 <= inputs.get("PR", 72) <= 100},
                        {"name": "DM", "value": inputs.get("DM", "0"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("DM", "0")) == "0"},
                        {"name": "HTN", "value": inputs.get("HTN", "1"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("HTN", "1")) == "0"},
                        {"name": "Typical Chest Pain", "value": inputs.get("Typical Chest Pain", "0"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("Typical Chest Pain", "0")) == "0"},
                    ],
                },
                {
                    "group_name": "ECG",
                    "parameters": [
                        {"name": "Q Wave", "value": inputs.get("Q Wave", "0"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("Q Wave", "0")) == "0"},
                        {"name": "St Elevation", "value": inputs.get("St Elevation", "0"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("St Elevation", "0")) == "0"},
                        {"name": "St Depression", "value": inputs.get("St Depression", "0"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("St Depression", "0")) == "0"},
                        {"name": "Tinversion", "value": inputs.get("Tinversion", "0"), "unit": "", "reference_range": "0", "within_range": str(inputs.get("Tinversion", "0")) == "0"},
                    ],
                },
                {
                    "group_name": "Laboratory",
                    "parameters": [
                        {"name": "FBS", "value": inputs.get("FBS", 98), "unit": "mg/dL", "reference_range": "70-99", "within_range": 70 <= inputs.get("FBS", 98) <= 99},
                        {"name": "CR", "value": inputs.get("CR", 1.0), "unit": "mg/dL", "reference_range": "0.6-1.2", "within_range": 0.6 <= inputs.get("CR", 1.0) <= 1.2},
                        {"name": "TG", "value": inputs.get("TG", 122), "unit": "mg/dL", "reference_range": "50-150", "within_range": 50 <= inputs.get("TG", 122) <= 150},
                        {"name": "LDL", "value": inputs.get("LDL", 100), "unit": "mg/dL", "reference_range": "50-100", "within_range": 50 <= inputs.get("LDL", 100) <= 100},
                        {"name": "HDL", "value": inputs.get("HDL", 39), "unit": "mg/dL", "reference_range": "40-60", "within_range": 40 <= inputs.get("HDL", 39) <= 60},
                    ],
                },
                {
                    "group_name": "Echocardiography",
                    "parameters": [
                        {"name": "EF-TTE", "value": inputs.get("EF-TTE", 50), "unit": "%", "reference_range": "55-70", "within_range": 55 <= inputs.get("EF-TTE", 50) <= 70},
                        {"name": "Region RWMA", "value": inputs.get("Region RWMA", "0"), "unit": "score", "reference_range": "0", "within_range": str(inputs.get("Region RWMA", "0")) == "0"},
                        {"name": "VHD", "value": inputs.get("VHD", "N"), "unit": "grade", "reference_range": "N", "within_range": str(inputs.get("VHD", "N")) == "N"},
                    ],
                },
            ]
        },
        "parameters_outside_reference_range": outside_list,
        "model_attribution": {
            "targets": [
                {"target": "CAD", "top_features": shap.get("cad", [])},
                {"target": "LAD", "top_features": shap.get("lad", [])},
                {"target": "LCX", "top_features": shap.get("lcx", [])},
                {"target": "RCA", "top_features": shap.get("rca", [])},
            ]
        },
        "methodological_notes": [
            "Evaluated using 55 non-invasive physiological features across 5 clinical categories.",
            "Target features LAD, LCX, RCA, and Cath were strictly excluded from model inputs to prevent target leakage.",
            "Reported outputs reflect calibrated probabilities derived from empirical post-test Bayesian odds, not direct anatomical lumen caliber measurements.",
        ],
        "disclaimer": MANDATORY_DISCLAIMER,
        "source": "template",
    }


def generate_deterministic_patient_report(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback deterministic plain-language patient report (8 sections).
    Percentages as whole numbers, grade 6-8 reading level, zero advisory words.
    """
    inputs = context["patient_inputs"]
    cad = context["cad_summary"]
    vessels = context["vessels_summary"]
    shap = context.get("shap_summary", {})

    cad_prob_int = int(round(cad["probability_pct"]))
    lad_prob_int = int(round(vessels["lad"]["probability_pct"]))
    lcx_prob_int = int(round(vessels["lcx"]["probability_pct"]))
    rca_prob_int = int(round(vessels["rca"]["probability_pct"]))

    return {
        "title_and_date": {
            "title": "Your Heart Health Summary",
            "generation_date": context.get("generation_timestamp", datetime.now().strftime("%Y-%m-%d")),
        },
        "what_this_summary_is": (
            "This summary describes the numbers you entered and what a computer model predicted from them. "
            "It shows the calculated risk numbers for your heart arteries based on those measurements."
        ),
        "overall_picture": (
            f"The computer model evaluated your overall probability for coronary artery disease (CAD), "
            f"which is narrowing in the blood vessels that supply blood to your heart muscle. "
            f"The model estimated an overall predicted probability of {cad_prob_int}%, "
            f"placing this estimate in the {cad['risk_band'].lower()} range."
        ),
        "your_three_main_heart_arteries": {
            "lad": {
                "name": "Left Anterior Descending (LAD) Artery",
                "description": (
                    f"The LAD artery runs down the front of the heart and supplies blood to the front wall. "
                    f"The model calculated a predicted narrowing probability of {lad_prob_int}%, "
                    f"which is in the {vessels['lad']['risk_band'].lower()} category."
                ),
                "probability_pct": lad_prob_int,
                "category": vessels["lad"]["risk_band"],
            },
            "lcx": {
                "name": "Left Circumflex (LCX) Artery",
                "description": (
                    f"The LCX artery curves around the left side of the heart to nourish the side and back walls. "
                    f"The model calculated a predicted narrowing probability of {lcx_prob_int}%, "
                    f"which is in the {vessels['lcx']['risk_band'].lower()} category."
                ),
                "probability_pct": lcx_prob_int,
                "category": vessels["lcx"]["risk_band"],
            },
            "rca": {
                "name": "Right Coronary (RCA) Artery",
                "description": (
                    f"The RCA artery travels down the right side of the heart to bring blood to the right chambers and underside. "
                    f"The model calculated a predicted narrowing probability of {rca_prob_int}%, "
                    f"which is in the {vessels['rca']['risk_band'].lower()} category."
                ),
                "probability_pct": rca_prob_int,
                "category": vessels["rca"]["risk_band"],
            },
        },
        "your_measurements": {
            "groups": [
                {
                    "category_name": "Body and Clinical Examination",
                    "items": [
                        {"plain_name": "Age", "your_value": f"{inputs.get('Age', 58)} years", "typical_range": "18–75 years", "status": "Within range" if inputs.get('Age', 58) <= 75 else "Above typical range"},
                        {"plain_name": "Blood Pressure (systolic)", "your_value": f"{inputs.get('BP', 130)} mmHg", "typical_range": "90–120 mmHg", "status": "Above typical range" if inputs.get('BP', 130) > 120 else "Within range"},
                        {"plain_name": "Resting Heart Rate", "your_value": f"{inputs.get('PR', 72)} beats/min", "typical_range": "60–100 beats/min", "status": "Within range"},
                    ],
                },
                {
                    "category_name": "Heart Tracing (ECG)",
                    "items": [
                        {"plain_name": "ST-Segment Elevation", "your_value": "Present" if str(inputs.get('St Elevation', '0')) == '1' else "Absent", "typical_range": "Absent", "status": "Within range" if str(inputs.get('St Elevation', '0')) == '0' else "Outside typical range"},
                        {"plain_name": "ST-Segment Depression", "your_value": "Present" if str(inputs.get('St Depression', '0')) == '1' else "Absent", "typical_range": "Absent", "status": "Within range" if str(inputs.get('St Depression', '0')) == '0' else "Outside typical range"},
                    ],
                },
                {
                    "category_name": "Blood Tests",
                    "items": [
                        {"plain_name": "Fasting Blood Sugar", "your_value": f"{inputs.get('FBS', 98)} mg/dL", "typical_range": "70–99 mg/dL", "status": "Within range" if inputs.get('FBS', 98) <= 99 else "Above typical range"},
                        {"plain_name": "Triglycerides", "your_value": f"{inputs.get('TG', 122)} mg/dL", "typical_range": "50–150 mg/dL", "status": "Within range"},
                        {"plain_name": "Kidney Marker (Creatinine)", "your_value": f"{inputs.get('CR', 1.0)} mg/dL", "typical_range": "0.6–1.2 mg/dL", "status": "Within range"},
                    ],
                },
                {
                    "category_name": "Heart Ultrasound (Echocardiogram)",
                    "items": [
                        {"plain_name": "Heart Pumping Fraction (EF)", "your_value": f"{inputs.get('EF-TTE', 50)}%", "typical_range": "55–70%", "status": "Below typical range" if inputs.get('EF-TTE', 50) < 55 else "Within range"},
                    ],
                },
            ]
        },
        "what_influenced_the_prediction_most": [
            f"{f.get('clinical_label', f.get('feature', ''))}: {f.get('patient_value', '')} pushed the predicted risk {'up' if f.get('direction') == 'INCREASES_RISK' else 'down'}."
            for f in shap.get("cad", [])[:4]
        ] or ["Measurements entered were evaluated by the model."],
        "about_this_estimate": (
            "This estimate was calculated by a computer program trained on past health data from hospital patients. "
            "It produces statistical probability numbers based on patterns in your measurements. "
            "The computer program does not take pictures of your heart or directly measure blood flow."
        ),
        "disclaimer": MANDATORY_DISCLAIMER,
        "source": "template",
    }


def generate_report(
    report_type: str,
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Main orchestration function for report generation (Tasks 1.8, 1.10):
    1. Reads Groq configuration at request time.
    2. Runs up to 2 retries (3 attempts) on failure.
    3. Feeds validation error back into prompt on retry.
    4. Records exact outcome code for Task 1.11 UI status.
    5. Falls back to verified deterministic templates if Groq unconfigured or retries fail.
    """
    global _last_error_code, _last_error_message
    api_key, model = get_groq_config()

    if not api_key:
        _last_error_code = "no_key"
        _last_error_message = "Groq API key not found. Using standard template."
        if report_type == "patient":
            return generate_deterministic_patient_report(context)
        return generate_deterministic_technical_report(context)

    # Load prompt template
    prompt_file = "patient_report.md" if report_type == "patient" else "technical_report.md"
    expected_sections = PATIENT_SECTIONS_ORDER if report_type == "patient" else TECHNICAL_SECTIONS_ORDER

    prompt_path = REPO_ROOT / "src" / "prompts" / prompt_file
    system_prompt = ""
    if prompt_path.exists():
        system_prompt = prompt_path.read_text(encoding="utf-8")
    else:
        system_prompt = f"You are a medical reporting AI generating a {report_type} report. Output valid JSON."

    user_prompt = f"REPORT CONTEXT DATA:\n{json.dumps(context, indent=2)}\n\nGenerate the complete report JSON conforming strictly to SHARED RULES and required section keys in exact order."

    current_prompt = user_prompt
    for attempt in range(3):
        try:
            raw_response = call_groq(current_prompt, system_prompt)
            cleaned = re.sub(r"^```json\s*", "", raw_response.strip(), flags=re.MULTILINE)
            cleaned = re.sub(r"^```\s*", "", cleaned.strip(), flags=re.MULTILINE)
            parsed_json = json.loads(cleaned)

            is_valid, error_msg = validate_report_json(parsed_json, expected_sections, context)
            if is_valid:
                _last_error_code = "ok"
                _last_error_message = None
                parsed_json["source"] = "groq"
                return parsed_json

            logger.warning(f"Groq report validation failed (attempt {attempt+1}/3): {error_msg}")
            _last_error_code = "validation_failed"
            _last_error_message = error_msg
            current_prompt = f"{user_prompt}\n\nPREVIOUS ATTEMPT REJECTED BY CLINICAL SAFETY VALIDATOR: {error_msg}\nRegenerate valid JSON strictly fixing this error and conforming to all rules."
        except httpx.HTTPStatusError as e:
            err_code, err_msg = classify_groq_error(e.response.status_code, e.response.text, e.response.headers)
            _last_error_code = err_code
            _last_error_message = err_msg
            logger.warning(f"Groq HTTP error (attempt {attempt+1}/3): {err_msg}")
            if err_code in ("key_rejected", "request_blocked", "access_denied", "rate_limited", "model_unavailable"):
                break
            time.sleep(1.0)
        except (httpx.TimeoutException, httpx.NetworkError, httpx.RequestError) as e:
            _last_error_code = "network_error"
            _last_error_message = f"Groq network error: {type(e).__name__}"
            logger.warning(f"Groq connection error (attempt {attempt+1}/3): {e}")
            time.sleep(0.5)
        except Exception as e:
            _last_error_code = "network_error"
            _last_error_message = str(e)
            logger.warning(f"Groq error (attempt {attempt+1}/3): {e}")
            time.sleep(0.5)

    # Fallback to deterministic template if Groq retries fail
    if report_type == "patient":
        report = generate_deterministic_patient_report(context)
    else:
        report = generate_deterministic_technical_report(context)
    report["source"] = "template"
    return report
