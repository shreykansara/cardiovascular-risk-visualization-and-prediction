# Quota Forensics & Live Domain Diagnostics

## 1. Code Path & Groq Request Count Per Click (Task 0.2 a)

### Current Code Flow on "Create reports"
1. **Frontend Initiation (`ReportsPage.tsx`)**:
   - On component mount, `useEffect` immediately fires `GET /api/v1/reports/status` (which calls Groq `/models` if cache >60s).
   - `useEffect([activeTab])` fires `fetchActiveReport()`. In React 18 StrictMode (dev), this effect mounts twice, firing two concurrent POST requests.
   - Initial tab is `'technical'`, triggering `POST /api/v1/reports/technical`.
   - When the user switches to the `'patient'` tab, another `useEffect` fires `POST /api/v1/reports/patient`.
   - After each report response, `ReportsPage.tsx` immediately fires another `GET /api/v1/reports/status`.
   - If the user clicks "Regenerate", `fetchActiveReport(force=true)` fires another POST and another status call.
2. **Backend Execution (`routes.py` & `llm_service.py`)**:
   - `/reports/technical` calls `generate_report(report_type="technical", context=...)`.
   - Inside `generate_report()`, a retry loop (`for attempt in range(3):`) runs up to 3 attempts.
   - If output validation fails (e.g. missing section, banned phrase, or number discrepancy), it loops and makes a 2nd and 3rd live Groq `chat/completions` call.
   - `/reports/patient` repeats the identical logic with up to 3 attempts.
3. **Startup & Background Checks**:
   - Server startup runs `verify_groq_startup()` in `main.py`, calling `GET https://api.groq.com/openai/v1/models`.
   - `/reports/status` calls `perform_live_groq_check()` hitting `/models` on cache expiration (60s).

### Groq Requests Count Per User Generation Action:
- **Best Case (Both valid on attempt 1, single tab, no StrictMode duplicate)**: 2 Groq completions calls + 2 status checks.
- **Normal Usage (User views technical then patient tab)**: 2 Groq completions calls + status calls.
- **With Validation Retries (e.g. 1 failure per endpoint)**: Up to 6 completions calls.
- **With StrictMode dev double-mounting**: Up to 12 completions calls within seconds.

---

## 2. API & Nginx Log Analysis (Last 24 Hours) (Task 0.2 b)

### Requests to `/api/v1/reports/*` in Last 24 Hours
Data extracted from Docker containers (`perfusion3d_api` and `perfusion3d_web`):

| Hour (UTC) | Client IP | Target Endpoint | HTTP Status | Count |
| :--- | :--- | :--- | :--- | :--- |
| **2026-10-05 08:00 - 09:00** | `172.19.0.1` (Docker bridge / localhost) | `POST /api/v1/reports/technical` | 200 OK | 2 |
| **2026-10-05 08:00 - 09:00** | `172.19.0.1` (Docker bridge / localhost) | `POST /api/v1/reports/patient` | 200 OK | 1 |
| **2026-10-05 08:00 - 09:00** | `172.19.0.1` (Docker bridge / localhost) | `GET /api/v1/reports/status` | 200 OK | 7 |
| **2026-10-05 06:00 - 07:00** | `172.19.0.1` (Docker bridge / localhost) | `GET /api/v1/reports/status` | 200 OK | 1 |

### Flagged IPs
- **Flagged external IPs**: None. All recorded traffic originated from `172.19.0.1` (the local Docker bridge gateway proxying requests from the developer's localhost browser session). There is no evidence of unauthorized external abuse on the local container.

---

## 3. Token Estimates Per Call & Sum Per Click (Task 0.2 c)

### Token Estimates:
- **System Prompt**:
  - `technical_report.md`: 4,772 characters ≈ 1,193 tokens.
  - `patient_report.md`: 5,009 characters ≈ 1,252 tokens.
- **User Prompt (with full 55-parameter context & SHAP)**:
  - Context JSON: ~4,500 – 5,200 characters ≈ 1,125 – 1,300 tokens.
- **Total Prompt Tokens Per Request**: ~2,350 – 2,550 tokens.
- **`max_tokens` / Completion Setting**: Not explicitly capped in code (defaulting to the model maximum, typically 4,096 to 8,192 completion tokens).
- **Observed Generated Output**: ~1,500 – 1,800 tokens for full technical report JSON; ~1,100 – 1,400 tokens for patient report JSON.
- **Sum Per Generation Click**:
  - 1 Technical Call: ~4,100 tokens (prompt + output).
  - 1 Patient Call: ~3,800 tokens (prompt + output).
  - **Base Sum Per Click**: ~7,900 tokens.
  - **With a single retry**: ~12,000 to ~16,000 tokens.
  - **With StrictMode / double tab view**: Over 25,000 – 40,000 tokens in under 10 seconds.
- *Comparison to Groq Free Tier*: Models such as `qwen/qwen3.8-27b` and `llama-3.3-70b-versatile` have Free-Tier TPM (tokens-per-minute) thresholds between 6,000 and 30,000 TPM. Two consecutive calls with validation retries easily exceed this minute-level limit.

---

## 4. Tests and Scripts Capable of Calling Live Groq (Task 0.2 d)

The following files were identified as capable of making live Groq requests:
1. `scripts/test_live_groq.py`: Executes unmocked `call_groq()` and unmocked `perform_live_groq_check(force=True)`.
2. `e2e/full_flow.spec.cjs`: Steps through the UI to `/reports` without intercepting `/api/v1/reports/*`, triggering real backend LLM calls if the API backend has an active key.
3. `e2e/print.spec.cjs`: Navigates to `/reports` without route interception.
4. `e2e/contrast.spec.cjs`: Crawls `/reports` (both technical and patient tabs) without route interception.
5. `e2e/test_scrolling.cjs`: Navigates to `/reports` without route interception.

*(Note: The unit test suite `apps/api/tests/test_wizard_and_reports.py` properly mocks `httpx.Client.get` and `call_groq`.)*

---

## 5. Quote of the Most Recent 429 Error (Task 0.2 e)

From `docker compose logs api --since 24h`:
```
2026-10-05 08:13:04 [WARNING] [cardio_api]: Groq HTTP error (attempt 2/3): Groq rate limit exceeded (HTTP 429: tokens)
2026-10-05 08:13:09 [WARNING] [cardio_api]: Groq HTTP error (attempt 1/3): Groq rate limit exceeded (HTTP 429: tokens)
2026-10-05 08:13:56 [WARNING] [cardio_api]: Groq HTTP error (attempt 1/3): Groq rate limit exceeded (HTTP 429: tokens)
```

The error explicitly specifies `(HTTP 429: tokens)`: the minute-level token quota (Tokens Per Minute - TPM) was saturated by rapid back-to-back generation calls containing full prompt contexts and multiple retries.

**Most Likely Cause**:
The 429 rate limit is caused by making two separate multi-thousand-token LLM calls per report generation with automatic 3-attempt validation retry loops, background `/models` polling, and unmocked E2E test runs saturating Groq's free-tier minute token limit (TPM).

---

## 6. Live Domain Key Forensics (`https://perfusion.shreykansara.dev`) (Task 0.3)

### a) How the Domain Reaches the App
- **Status in Repository**: `unknown`.
- **Findings**: The repository contains no configuration files, DNS records, Cloudflare Tunnel (`cloudflared`) configs, Caddyfiles, or remote deployment compose files for `perfusion.shreykansara.dev`. Public DNS resolves `perfusion.shreykansara.dev` to Cloudflare / reverse proxy IPs (`216.24.57.18`, `216.24.57.16`). The exact proxying mechanism between the live domain and the host where it runs is external to this repository.

### b) API Container `GROQ_API_KEY` Status
- **Local Host Docker Container (`perfusion3d_api`)**:
  - `GROQ_API_KEY` present: `True`
  - Key length: `56` characters (never logged or committed)
- **Live Domain Server Container (`https://perfusion.shreykansara.dev`)**:
  - `GROQ_API_KEY` present: `False` (as evidenced by the UI reporting "Groq API key not found. Using standard template." when queried on that host).

### c) `.env` Location & Container Recreation
- **Host `.env` Location**: `.env` is located directly adjacent to `docker-compose.yml` in the project root (`C:\Users\Shrey\Projects\Multimodal AI Hackathon\.env`).
- **Container Lifecycle**:
  - Running `docker compose restart` does **not** re-read or inject updated `.env` values into running containers.
  - To inject updated environment variables from `.env`, the container must be recreated using:
    ```bash
    docker compose up -d --force-recreate
    ```
  - On the host serving `perfusion.shreykansara.dev`, the API container was either launched without a `.env` file containing `GROQ_API_KEY`, or was restarted without `--force-recreate` after `.env` was modified.
