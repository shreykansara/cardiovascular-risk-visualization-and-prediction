"""
Unit and Integration Tests for Unified Single-Call Report Generation Engine (Task 3.14)
Multimodal AI Hackathon 2026 - Perfusion3D

Asserts EXACT Groq call counts using httpx.MockTransport with a call counter:
- success = 1 call
- field with banned phrase replaced = 1 call
- malformed JSON gives full template = 1 call
- minute-level 429 with retry-after 3s = 2 calls then success
- minute-level 429 with 40s = 1 call, template, cooldown set
- daily 429 = 1 call, template, status rate_limited_daily
- request during cooldown = 0 calls
- identical request twice = 1 call (cache)
- two simultaneous identical requests = 1 call (single-flight)
- force=true = second call
- client limit exceeded = client_limited, 0 calls
- no key = 0 calls
- event order correct and ends with one result
- key never appears in events or logs
"""

import re
import json
import asyncio
import pytest
import httpx
from typing import List, Dict, Any

from apps.api.app.services.llm_service import (
    generate_unified_reports,
    reset_rate_limits_and_cache,
    TECHNICAL_SECTIONS_ORDER,
    PATIENT_SECTIONS_ORDER,
    MANDATORY_DISCLAIMER,
)

SAMPLE_PATIENT_DATA = {
    "Age": 47.0,
    "Sex": "Female",
    "Weight": 75.0,
    "Length": 165.0,
    "BMI": 27.55,
    "BP": 120.0,
    "PR": 90.0,
    "FBS": 84.0,
    "CR": 1.1,
    "TG": 97.0,
    "LDL": 83.0,
    "HDL": 24.0,
    "EF-TTE": 45.0,
    "Typical Chest Pain": "1",
}

SAMPLE_PREDICTIONS = {
    "overall_cad": {"probability": 0.22, "category": "Low", "model_classification": "Negative"},
    "vessels": {
        "lad": {"probability": 0.91, "category": "High", "model_classification": "Positive"},
        "lcx": {"probability": 0.24, "category": "Low", "model_classification": "Negative"},
        "rca": {"probability": 0.22, "category": "Low", "model_classification": "Negative"},
    },
}

SAMPLE_EXPLANATIONS = {
    "cad": {"top_features": [{"feature": "Age", "value": 47.0, "direction": "INCREASES_RISK", "magnitude": 0.42}]},
    "lad": {"top_features": [{"feature": "EF-TTE", "value": 45.0, "direction": "DECREASES_RISK", "magnitude": 0.51}]},
    "lcx": {"top_features": [{"feature": "HDL", "value": 24.0, "direction": "INCREASES_RISK", "magnitude": 0.33}]},
    "rca": {"top_features": [{"feature": "BP", "value": 120.0, "direction": "INCREASES_RISK", "magnitude": 0.25}]},
}

VALID_GROQ_CONTENT = json.dumps({
    "clinician": {
        "model_output_summary": "Overall predicted probability for CAD is 22.0%, categorized as low risk.",
        "attribution": {
            "CAD": "Primary physiological drivers include age and blood pressure.",
            "LAD": "Key factors influencing LAD output include heart pumping fraction.",
            "LCX": "Key factors influencing LCX output include HDL cholesterol.",
            "RCA": "Key factors influencing RCA output include blood pressure.",
        },
        "methodological_notes": [
            "Evaluated using 55 non-invasive physiological features across 5 clinical categories.",
            "Target features LAD, LCX, RCA, and Cath were strictly excluded from model inputs to prevent target leakage.",
            "Reported outputs reflect calibrated probabilities derived from empirical post-test Bayesian odds.",
        ],
    },
    "patient": {
        "what_this_is": "This summary explains your test results in plain language. It shows estimated risk numbers for your heart arteries.",
        "overall_picture": "The computer model evaluated your overall chance of heart artery narrowing based on your numbers. It calculated a 22% probability, which is in the low range.",
        "arteries": {
            "LAD": "The LAD artery brings blood to the front of your heart. The model estimated a 91% probability, which is in the high category.",
            "LCX": "The LCX artery curves around the left side of your heart. The model estimated a 24% probability, which is in the low category.",
            "RCA": "The RCA artery supplies blood to the right side and bottom of your heart. The model estimated a 22% probability, which is in the low category.",
        },
        "influences": [
            "Age: 47 pushed the predicted risk up.",
            "Blood pressure: 120 remained within typical limits.",
            "Heart rate: 90 was within normal resting range.",
        ],
        "about_this_estimate": "This estimate comes from a computer tool trained on patient health records. It finds patterns in your measurements to calculate statistical numbers. The tool does not directly image blood vessels or take pictures of your heart.",
    },
})


def make_mock_groq_response(status_code: int = 200, content_str: str = VALID_GROQ_CONTENT, headers: Dict[str, str] = None):
    resp_headers = {
        "x-ratelimit-limit-tokens": "6000",
        "x-ratelimit-remaining-tokens": "4800",
        "x-ratelimit-reset-tokens": "2.4s",
    }
    if headers:
        resp_headers.update(headers)

    if status_code == 200:
        data = {
            "id": "chatcmpl-test",
            "choices": [{"index": 0, "message": {"role": "assistant", "content": content_str}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 800, "completion_tokens": 400, "total_tokens": 1200},
        }
        return httpx.Response(status_code=200, json=data, headers=resp_headers)
    elif status_code == 429:
        data = {"error": {"message": "Rate limit reached", "type": "tokens", "code": "rate_limit_exceeded"}}
        return httpx.Response(status_code=429, json=data, headers=resp_headers)
    else:
        return httpx.Response(status_code=status_code, text="Error", headers=resp_headers)


async def collect_events(generator) -> List[Dict[str, Any]]:
    events = []
    async for line in generator:
        if line.strip():
            events.append(json.loads(line))
    return events


@pytest.fixture(autouse=True)
def setup_teardown(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "gsk_test1234567890abcdef")
    monkeypatch.setenv("GROQ_MODEL", "llama-3.1-8b-instant")
    reset_rate_limits_and_cache()
    yield
    reset_rate_limits_and_cache()


@pytest.mark.anyio
async def test_case_success_exactly_one_call():
    """Verify standard generation makes exactly ONE Groq call."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 1
    assert len(events) >= 5
    assert [e["stage"] for e in events if e.get("event") == "stage"] == ["preparing", "requesting", "checking", "building"]
    result = events[-1]
    assert result["event"] == "result"
    assert result["status"] == "ok"
    assert result["source"] == "groq"
    assert result["reports"]["clinician"]["disclaimer"] == MANDATORY_DISCLAIMER
    assert result["reports"]["patient"]["disclaimer"] == MANDATORY_DISCLAIMER


@pytest.mark.anyio
async def test_case_banned_phrase_replaced_still_one_call():
    """Verify that a field containing a banned phrase is replaced with template and still makes only 1 call."""
    calls = []
    content_with_banned = json.loads(VALID_GROQ_CONTENT)
    content_with_banned["patient"]["what_this_is"] = "You should consult a doctor right away about your health."

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200, content_str=json.dumps(content_with_banned))

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 1
    result = events[-1]
    assert result["status"] == "ok"
    assert result["source"] == "mixed"
    assert result["section_sources"]["patient.what_this_is"] == "template"
    # Verify no banned phrase in final text
    assert "should" not in result["reports"]["patient"]["what_this_summary_is"]


@pytest.mark.anyio
async def test_case_malformed_json_gives_template_and_one_call():
    """Verify malformed JSON from Groq falls back to deterministic template with 1 call."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200, content_str="INVALID NOT JSON AT ALL {{{")

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 1
    result = events[-1]
    assert result["status"] == "invalid_output"
    assert result["source"] == "template"
    assert [k for k in result["reports"]["clinician"].keys()] == TECHNICAL_SECTIONS_ORDER
    assert [k for k in result["reports"]["patient"].keys()] == PATIENT_SECTIONS_ORDER


@pytest.mark.anyio
async def test_case_minute_429_retry_after_3s_makes_two_calls():
    """Verify minute-level 429 with retry-after <= 15s retries once (exactly 2 calls total)."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        if len(calls) == 1:
            return make_mock_groq_response(429, headers={"retry-after": "0.1"})
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 2
    # Verify waiting_retry stage event was emitted
    waiting_stages = [e for e in events if e.get("event") == "stage" and e.get("stage") == "waiting_retry"]
    assert len(waiting_stages) == 1
    result = events[-1]
    assert result["status"] == "ok"


@pytest.mark.anyio
async def test_case_minute_429_over_15s_one_call_sets_cooldown():
    """Verify minute-level 429 with wait > 15s does not retry (1 call), returns template and sets cooldown."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(429, headers={"retry-after": "40"})

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 1
    result = events[-1]
    assert result["status"] == "rate_limited_minute"
    assert result["source"] == "template"
    assert result["cooldown_s"] is not None and result["cooldown_s"] > 0


@pytest.mark.anyio
async def test_case_daily_429_makes_one_call_and_no_retry():
    """Verify daily limit 429 makes 1 call, returns rate_limited_daily with template."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return httpx.Response(
            status_code=429,
            json={"error": {"message": "Daily request limit reached for model. Limit resets in 14h 20m.", "code": "rate_limit_exceeded"}},
            headers={"retry-after": "51600"},
        )

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 1
    result = events[-1]
    assert result["status"] == "rate_limited_daily"
    assert result["source"] == "template"


@pytest.mark.anyio
async def test_case_request_during_cooldown_makes_zero_calls():
    """Verify request during active cooldown returns immediately with 0 Groq calls."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(429, headers={"retry-after": "45"})

    transport = httpx.MockTransport(handler)
    # First call sets cooldown
    await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))
    assert len(calls) == 1

    # Second call during cooldown
    events2 = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))
    # Calls must still be 1 (zero calls on second request)
    assert len(calls) == 1
    result2 = events2[-1]
    assert result2["status"] == "rate_limited_minute"
    assert result2["source"] == "template"


@pytest.mark.anyio
async def test_case_identical_request_cached_makes_one_call():
    """Verify identical request hits in-memory cache and makes only 1 call total."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    # First call
    ev1 = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))
    assert len(calls) == 1

    # Second identical call
    ev2 = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))
    # Calls must remain 1
    assert len(calls) == 1
    assert ev2[-1]["status"] == "ok"


@pytest.mark.anyio
async def test_case_concurrent_identical_requests_single_flight():
    """Verify concurrent identical requests share single in-flight call (single flight)."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)

    task1 = collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))
    task2 = collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    ev1, ev2 = await asyncio.gather(task1, task2)
    assert len(calls) == 1
    assert ev1[-1]["event"] == "result"
    assert ev2[-1]["event"] == "result"


@pytest.mark.anyio
async def test_case_force_true_bypasses_cache():
    """Verify force=True bypasses cache and triggers a second Groq call."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))
    assert len(calls) == 1

    await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        force=True,
        mock_transport=transport,
    ))
    assert len(calls) == 2


@pytest.mark.anyio
async def test_case_client_rate_limit_exceeded():
    """Verify exceeding 4 calls per 10 min for a client returns client_limited and 0 calls after cap."""
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    client_ip = "192.168.1.50"

    # Make 4 generations with force=True so cache is bypassed
    for i in range(4):
        await collect_events(generate_unified_reports(
            patient_data=dict(SAMPLE_PATIENT_DATA, Age=float(40 + i)),
            predictions=SAMPLE_PREDICTIONS,
            explanations=SAMPLE_EXPLANATIONS,
            force=True,
            client_ip=client_ip,
            mock_transport=transport,
        ))
    assert len(calls) == 4

    # 5th attempt must be rejected by client limit guard without calling Groq
    events5 = await collect_events(generate_unified_reports(
        patient_data=dict(SAMPLE_PATIENT_DATA, Age=99.0),
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        force=True,
        client_ip=client_ip,
        mock_transport=transport,
    ))
    assert len(calls) == 4  # No 5th call made
    assert events5[-1]["status"] == "client_limited"


@pytest.mark.anyio
async def test_case_no_key_makes_zero_calls(monkeypatch):
    """Verify when GROQ_API_KEY is missing or empty, 0 calls are made and template is returned."""
    monkeypatch.setenv("GROQ_API_KEY", "")
    calls = []

    def handler(request: httpx.Request):
        calls.append(request)
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    assert len(calls) == 0
    result = events[-1]
    assert result["status"] == "no_key"
    assert result["source"] == "template"


@pytest.mark.anyio
async def test_key_never_appears_in_events_or_output():
    """Verify secret API key never leaks in any streamed event or output JSON."""
    secret_key = "gsk_supersecretkeyneverexpose12345"

    def handler(request: httpx.Request):
        return make_mock_groq_response(200)

    transport = httpx.MockTransport(handler)
    events = await collect_events(generate_unified_reports(
        patient_data=SAMPLE_PATIENT_DATA,
        predictions=SAMPLE_PREDICTIONS,
        explanations=SAMPLE_EXPLANATIONS,
        mock_transport=transport,
    ))

    dumped = json.dumps(events)
    assert secret_key not in dumped
    assert "gsk_" not in dumped
