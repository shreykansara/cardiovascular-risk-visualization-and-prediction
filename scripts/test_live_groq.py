"""
Live Groq Generation Verification Script (Task 1.9)
Performs live check and test generation for technical & patient reports.
Prints:
- HTTP status
- Whether JSON parsed
- Whether validator passed
- If failed, exact rejection reasons
Never prints keys.
"""

import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Add project root to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from apps.api.app.services.llm_service import (
    load_and_check_env,
    get_groq_config,
    perform_live_groq_check,
    build_report_context,
    validate_report_json,
    call_groq,
    TECHNICAL_SECTIONS_ORDER,
    PATIENT_SECTIONS_ORDER,
)
from apps.api.app.services.model_service import model_service
from apps.api.app.routes import get_sample_patient


def run_live_test():
    print("=" * 60)
    print("LIVE GROQ TEST REPORT (Task 1.9)")
    print("=" * 60)

    # 1. Environment Loading Check
    env_found, env_path = load_and_check_env()
    print(f"Env File Found: {env_found} ({env_path})")

    api_key, model = get_groq_config()
    key_configured = bool(api_key)
    print(f"Key Configured: {key_configured}")
    print(f"Model: {model}")

    # 2. Live API Connectivity Check
    listed, err_code, err_msg = perform_live_groq_check(api_key, model, force=True)
    print(f"Live Check Result: code='{err_code}', message='{err_msg}', model_listed={listed}\n")

    # 3. Sample Patient Context Preparation
    model_service.load_artifacts()
    sample_patient = get_sample_patient(profile="high_risk_lad")
    sample_dict = sample_patient.model_dump(by_alias=True)

    from apps.api.app.routes import analyze_patient_complete
    from starlette.responses import Response
    full_analysis = analyze_patient_complete(sample_patient, Response(), top_k=6)
    context = build_report_context(
        patient_data=sample_dict,
        predictions=full_analysis.predictions.model_dump(),
        explanations={k: v.model_dump() for k, v in full_analysis.explanations.items()},
        model_metadata=model_service.metadata,
    )

    results = {}

    for r_type in ["technical", "patient"]:
        print(f"--- Testing Report Type: {r_type} ---")
        expected_sections = PATIENT_SECTIONS_ORDER if r_type == "patient" else TECHNICAL_SECTIONS_ORDER
        prompt_file = f"{r_type}_report.md"
        prompt_path = REPO_ROOT / "src" / "prompts" / prompt_file
        system_prompt = prompt_path.read_text(encoding="utf-8") if prompt_path.exists() else "Generate report JSON."
        user_prompt = f"REPORT CONTEXT DATA:\n{json.dumps(context, indent=2)}\n\nGenerate the complete report JSON conforming strictly to SHARED RULES and required section keys in exact order."

        if not api_key:
            print(f"HTTP Status: N/A (Key not configured or is placeholder)")
            print(f"JSON Parsed: N/A")
            print(f"Validator Passed: False")
            print(f"Rejection Reason: Groq API key is not configured or placeholder was detected in .env")
            results[r_type] = {
                "http_status": None,
                "json_parsed": False,
                "validator_passed": False,
                "rejection_reason": "Key not configured or placeholder detected",
            }
            print()
            continue

        http_status = None
        json_parsed = False
        validator_passed = False
        rejection_reason = None

        try:
            raw_response = call_groq(user_prompt, system_prompt)
            http_status = 200
            import re
            cleaned = re.sub(r"^```json\s*", "", raw_response.strip(), flags=re.MULTILINE)
            cleaned = re.sub(r"^```\s*", "", cleaned.strip(), flags=re.MULTILINE)
            parsed_data = json.loads(cleaned)
            json_parsed = True

            is_valid, val_err = validate_report_json(parsed_data, expected_sections, context)
            validator_passed = is_valid
            rejection_reason = val_err
        except urllib.error.HTTPError as e:
            http_status = e.code
            rejection_reason = f"HTTP {e.code}: {e.reason}"
        except json.JSONDecodeError as e:
            http_status = 200
            json_parsed = False
            rejection_reason = f"JSON parse error: {e}"
        except Exception as e:
            rejection_reason = str(e)

        print(f"HTTP Status: {http_status}")
        print(f"JSON Parsed: {json_parsed}")
        print(f"Validator Passed: {validator_passed}")
        if not validator_passed:
            print(f"Rejection Reason: {rejection_reason}")
        print()

        results[r_type] = {
            "http_status": http_status,
            "json_parsed": json_parsed,
            "validator_passed": validator_passed,
            "rejection_reason": rejection_reason,
        }

    return results


if __name__ == "__main__":
    run_live_test()
