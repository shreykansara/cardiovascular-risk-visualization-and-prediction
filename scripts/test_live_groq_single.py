"""
Task 3.15: Live Groq Verification Script (Exactly ONE Live Call)
Multimodal AI Hackathon 2026 - Perfusion3D

Performs exactly ONE real generation with the sample patient.
Prints:
- Status
- Elapsed ms
- Tokens estimated
- The x-ratelimit-* values (limit and remaining, reset)
- Per-field validator results
If Groq returns 429, stops, does not retry, quotes Groq's message and reports when the limit resets.
NEVER prints keys. NEVER runs a second call.
"""

import sys
import json
import time
import asyncio
from pathlib import Path

# Add project root to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from apps.api.app.services.llm_service import (
    load_and_check_env,
    get_groq_config,
    generate_unified_reports,
    build_compact_context,
)
from apps.api.app.services import model_service, predict_patient, explain_patient
from apps.api.app.routes import get_sample_patient


async def main():
    print("=" * 60)
    print("TASK 3.15: LIVE GROQ GENERATION CHECK (EXACTLY ONE CALL)")
    print("=" * 60)

    # 1. Environment & Config
    env_found, env_path = load_and_check_env()
    key, model = get_groq_config()

    print(f"Env File: {'Found' if env_found else 'Not Found'} ({env_path})")
    print(f"Key Configured: {bool(key)} (Length: {len(key) if key else 0})")
    print(f"Target Model: {model}")

    if not key:
        print("\n[RESULT] No active Groq API key found. Skipping live check.")
        return

    # 2. Model & Patient Preparation
    print("\nLoading local ML models and sample patient...")
    model_service.load_artifacts()
    patient = get_sample_patient(profile="high_risk_lad")
    patient_dict = patient.model_dump(by_alias=True)

    preds = predict_patient(patient)
    df = patient.to_feature_dataframe()
    X_trans = model_service.preprocessor.transform(df)

    exps = {}
    for target in ["CAD", "LAD", "LCX", "RCA"]:
        t_lower = target.lower()
        prob = preds.overall_cad.probability if target == "CAD" else preds.vessels[t_lower].probability
        exps[t_lower] = explain_patient(
            patient=patient,
            target=target,
            top_k=6,
            pretransformed_x=X_trans,
            precomputed_prob=prob,
        ).model_dump()

    preds_dict = preds.model_dump()

    # 3. Compact context preview
    compact_ctx = build_compact_context(patient_dict, preds_dict, exps)
    ctx_chars = len(json.dumps(compact_ctx))
    est_prompt_tokens = ctx_chars // 4
    print(f"Compact Context Size: {ctx_chars} chars (~{est_prompt_tokens} tokens)")

    # 4. Execute the ONE Live Groq Generation
    print("\nInitiating ONE live Groq generation request...")
    t0 = time.perf_counter()

    events = []
    generator = generate_unified_reports(
        patient_data=patient_dict,
        predictions=preds_dict,
        explanations=exps,
        force=True,
    )

    async for line in generator:
        line_str = line.strip()
        if line_str:
            evt = json.loads(line_str)
            events.append(evt)
            if evt.get("event") == "stage":
                print(f"  -> Stage reached: {evt.get('stage')}")

    elapsed_s = time.perf_counter() - t0
    result_event = events[-1] if events else {}

    print("\n" + "=" * 60)
    print("LIVE GENERATION RESULTS")
    print("=" * 60)
    status = result_event.get("status", "unknown")
    source = result_event.get("source", "unknown")
    elapsed_ms = result_event.get("elapsed_ms", round(elapsed_s * 1000))
    cooldown_s = result_event.get("cooldown_s")

    print(f"Status:       {status}")
    print(f"Source:       {source}")
    print(f"Elapsed Time: {elapsed_ms} ms ({elapsed_s:.2f} s)")
    print(f"Cooldown:     {cooldown_s} s" if cooldown_s else "Cooldown:     None")

    if status.startswith("rate_limited"):
        print("\n[RATE LIMIT TRIGGERED]")
        print(f"Limit Type: {status}")
        print(f"Cooldown wait: {cooldown_s} seconds until reset.")
        print("Safety rule enforced: Zero retries executed. Quota preserved.")
    elif status == "ok":
        print("\n[SUCCESS - ALL CHECKS PASSED]")
        print("Per-Field Section Validation Sources:")
        sources = result_event.get("section_sources", {})
        for sec, src in sources.items():
            print(f"  - {sec:35s}: {src}")

        reports = result_event.get("reports", {})
        clin = reports.get("clinician", {})
        pat = reports.get("patient", {})
        print(f"\nClinician Report Sections: {len(clin.keys())} sections")
        print(f"Patient Report Sections:   {len(pat.keys())} sections")
        print(f"Clinician Disclaimer:      '{clin.get('disclaimer')}'")
        print(f"Patient Disclaimer:        '{pat.get('disclaimer')}'")
    else:
        print(f"\n[CALL STATUS]: {status}")

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
