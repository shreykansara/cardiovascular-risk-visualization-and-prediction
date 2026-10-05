# Phase 1 Removal & Clean-up Inventory

Total matching occurrences across codebase: **503**

| File | Line | Keyword | Snippet | Action | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `.dockerignore` | 16 | `.env` | `.env` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `.dockerignore` | 17 | `.env` | `.env.*` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `.dockerignore` | 18 | `.env` | `!.env.example` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `.env` | 1 | `groq` | `GROQ_API_KEY=[REDACTED_DELETED_KEY]` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `.env` | 2 | `groq` | `GROQ_MODEL=qwen/qwen3.8-27b` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `.env.example` | 1 | `groq` | `GROQ_API_KEY=PASTE_YOUR_GROQ_API_KEY_HERE` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `.env.example` | 2 | `groq` | `GROQ_MODEL=llama-3.3-70b-versatile` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `.gitattributes` | 2 | `.env` | `.env.example text eol=lf` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `.gitignore` | 52 | `.env` | `.env` | **KEEP** | Harmless guard to prevent accidental commits of local .env |
| `.gitignore` | 53 | `.env` | `.env.local` | **KEEP** | Harmless guard to prevent accidental commits of local .env |
| `.gitignore` | 54 | `.env` | `.env.development.local` | **KEEP** | Harmless guard to prevent accidental commits of local .env |
| `.gitignore` | 55 | `.env` | `.env.test.local` | **KEEP** | Harmless guard to prevent accidental commits of local .env |
| `.gitignore` | 56 | `.env` | `.env.production.local` | **KEEP** | Harmless guard to prevent accidental commits of local .env |
| `DEPLOYMENT.md` | 4 | `stage` | `Perfusion3D is packaged as an **All-in-One Multi-Stage Docker Container** uniting the React 19 + Three.js WebGL spatial ` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `docker-compose.yml` | 17 | `env_file` | `env_file:` | **DELETE** | Remove env_file from compose services |
| `docker-compose.yml` | 18 | `.env` | `- path: .env` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `Dockerfile` | 2 | `stage` | `# Multi-Stage Production Dockerfile: Perfusion3D` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile` | 6 | `stage` | `# --- Stage 1: Build React 19 + Three.js WebGL Frontend ---` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile` | 18 | `stage` | `# --- Stage 2: Production Python Runtime ---` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile` | 34 | `prompts` | `# Copy backend application, ML model artifacts, data, prompts, and reports` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `Dockerfile` | 38 | `prompts` | `COPY src/prompts ./src/prompts` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `Dockerfile` | 41 | `stage` | `# Copy built frontend SPA assets from Stage 1` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile.api` | 29 | `prompts` | `# Copy model artifacts, API source, processed data, metrics, and prompts` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `Dockerfile.api` | 34 | `prompts` | `COPY --chown=appuser:appuser src/prompts ./src/prompts` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `Dockerfile.web` | 2 | `stage` | `# Multi-Stage Dockerfile for Perfusion3D Web Frontend (Task D2)` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile.web` | 5 | `stage` | `# --- Stage 1: Build React 18 + Three.js WebGL Frontend ---` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile.web` | 23 | `stage` | `# --- Stage 2: Production Nginx Server ---` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `Dockerfile.web` | 32 | `stage` | `# Copy built assets from builder stage` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `package-lock.json` | 338 | `llm` | `"integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `package-lock.json` | 4388 | `llm` | `"integrity": "sha512-/LLMVyas0ljjAtoYiPqYiL8VWXzUUdThrmU5+n20DZv+a+ClRoevUzw5JxU+Ieh5/c87ytoTBV9G1FiKfNJdmg==",` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `README.md` | 9 | `groq` | `[![Groq LLM](https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-orange?style=flat-square)](https://groq.com)` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 18 | `groq` | `1. **Configure Environment** (Optional: add your Groq key for LLM reports; deterministic fallback activates automaticall` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 21 | `.env` | `Copy-Item .env.example .env` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 24 | `.env` | `cp .env.example .env` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 34 | `.env` | `> **Note on Environment Configuration**: `.env` must use LF line endings (no CRLF). After editing `.env`, run `docker co` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 103 | `groq` | `├── Single-Call Unified Groq Engine (Combined Clinician + Patient)` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 138 | `groq` | `- **Unified Single-Call Generation**: POST /api/v1/reports/generate streams NDJSON progress stages (preparing, requestin` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 141 | `groq` | `- **Deterministic Fallback**: Automatically synthesizes verified clinical reports from model context if Groq API key is ` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 159 | `llm` | `## Environment Variables & LLM Configuration` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 161 | `.env` | `Create `.env` in the project root:` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 165 | `.env` | `Copy-Item .env.example .env   # PowerShell` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 166 | `.env` | `# or: cp .env.example .env    # Bash` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 169 | `.env` | `Configure `.env`:` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 171 | `groq` | `# Groq Cloud API Key (LLM Reports)` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 172 | `groq` | `# Obtain a key at: https://console.groq.com/keys` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 173 | `groq` | `GROQ_API_KEY=gsk_your_groq_api_key_here` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 175 | `groq` | `# Model identifier (Locked to Groq Llama 3.3 70B Versatile)` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 176 | `groq` | `GROQ_MODEL=llama-3.3-70b-versatile` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 183 | `groq` | `> **Zero-Downtime Resilience**: If `GROQ_API_KEY` is omitted, left empty, or invalid, the backend automatically logs `"G` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 201 | `groq` | `### 2. Groq LLM Key Missing or Expired` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 202 | `groq` | `- Symptom: Banner appears on `/reports` saying *"Groq API key not configured in environment. Displaying verified determi` | **EDIT** | Remove Groq/LLM references and update run commands |
| `README.md` | 203 | `groq` | `- Resolution: This is the intended graceful fallback behavior. The report displays all calibrated metrics and SHAP facto` | **EDIT** | Remove Groq/LLM references and update run commands |
| `requirements.txt` | 30 | `httpx` | `httpx==0.28.1` | **DELETE** | Dependency only used by Groq LLM service |
| `requirements.txt` | 36 | `dotenv` | `python-dotenv>=1.0.1` | **DELETE** | Dependency only used by Groq LLM service |
| `apps/api/app/config.py` | 12 | `dotenv` | `from dotenv import load_dotenv` | **EDIT** | Remove dotenv and Groq settings |
| `apps/api/app/config.py` | 13 | `dotenv` | `load_dotenv(ROOT_DIR / ".env")` | **EDIT** | Remove dotenv and Groq settings |
| `apps/api/app/config.py` | 44 | `groq` | `# Groq Reporting LLM Configuration (Phase B)` | **EDIT** | Remove dotenv and Groq settings |
| `apps/api/app/config.py` | 45 | `groq` | `GROQ_API_KEY: str \| None = None` | **EDIT** | Remove dotenv and Groq settings |
| `apps/api/app/config.py` | 46 | `groq` | `GROQ_MODEL: str = "llama-3.3-70b-versatile"` | **EDIT** | Remove dotenv and Groq settings |
| `apps/api/app/config.py` | 50 | `env_file` | `env_file=str(ROOT_DIR / ".env"),` | **EDIT** | Remove dotenv and Groq settings |
| `apps/api/app/main.py` | 23 | `llm` | `from apps.api.app.services.llm_service import load_and_check_env` | **EDIT** | Remove llm_service startup call |
| `apps/api/app/routes.py` | 296 | `llm` | `from apps.api.app.schemas.report import ReportGenerateRequestSchema, LLMConfigStatusResponse` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 297 | `llm` | `from apps.api.app.services.llm_service import (` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 305 | `llm` | `response_model=LLMConfigStatusResponse,` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 306 | `groq` | `summary="Check Groq API Configuration Status (Zero Groq Calls)",` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 309 | `llm` | `def get_reports_status_endpoint() -> LLMConfigStatusResponse:` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 310 | `groq` | `"""Task 3.12: Returns configuration status facts only. Makes NO call to Groq."""` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 312 | `llm` | `return LLMConfigStatusResponse(**diagnostics)` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 317 | `groq` | `summary="Generate Unified Clinical & Patient Reports via Single Groq Call (Task 3.11)",` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 326 | `groq` | `Task 3.11: Single endpoint executing one unified Groq chat completion returning` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 328 | `ndjson` | `Streams progress stages and final reports as NDJSON (application/x-ndjson).` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/routes.py` | 352 | `ndjson` | `media_type="application/x-ndjson",` | **EDIT** | Replace streaming endpoints with POST /api/v1/reports |
| `apps/api/app/schemas/report.py` | 31 | `llm` | `class LLMConfigStatusResponse(BaseModel):` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `apps/api/app/schemas/report.py` | 32 | `groq` | `"""Diagnostics on Groq API configuration status (Task 3.12). Never contains keys."""` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/app/schemas/report.py` | 37 | `cooldown` | `cooldown_s: Optional[int] = None` | **EDIT** | Keyword 'cooldown' matched; update to reflect static report template architecture |
| `apps/api/app/schemas/report.py` | 38 | `groq` | `groq_calls_last_hour: int = 0` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/app/schemas/report.py` | 42 | `env_file` | `env_file_found: bool = True` | **EDIT** | Keyword 'env_file' matched; update to reflect static report template architecture |
| `apps/api/app/schemas/report.py` | 43 | `env_file` | `env_file_path: str = ""` | **EDIT** | Keyword 'env_file' matched; update to reflect static report template architecture |
| `apps/api/app/schemas/report.py` | 45 | `groq` | `model_listed_by_groq: Optional[bool] = None` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/app/services/llm_service.py` | 2 | `llm` | `Backend LLM Report Generation Service (Unified Single-Call Engine)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 7 | `groq` | `2. Single-call Groq prompt with strict JSON output contract (src/prompts/reports_combined.md)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 10 | `cooldown` | `5. Rate limit classification (minute vs daily), cooldown enforcement, and <=15s one-shot retry` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 12 | `rate limit` | `7. Client IP-based rate limiting (4 per 10m per client, 30 per hour globally)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 13 | `ndjson` | `8. NDJSON event streaming generator for POST /api/v1/reports/generate` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 31 | `httpx` | `import httpx` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 32 | `dotenv` | `from dotenv import load_dotenv` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 104 | `prompts` | `PROMPT_FILE: Path = REPO_ROOT / "src" / "prompts" / "reports_combined.md"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 109 | `cooldown` | `_cooldown_until: float = 0.0` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 110 | `cooldown` | `_cooldown_type: str = "ok"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 111 | `groq` | `_last_groq_status: str = "ok"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 112 | `groq` | `_groq_calls_history: List[float] = []` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 114 | `rate limit` | `# Rate limits: 4 per 10m per client, 30 per hour globally` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 146 | `groq` | `if not cleaned or "PASTE_" in cleaned or cleaned == "PASTE_YOUR_GROQ_API_KEY_HERE":` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 152 | `.env` | `"""Loads .env from repo root if not already loaded."""` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 153 | `.env` | `env_path = REPO_ROOT / ".env"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 155 | `dotenv` | `load_dotenv(dotenv_path=env_path, override=False)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 160 | `groq` | `def get_groq_config() -> Tuple[Optional[str], str]:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 163 | `groq` | `raw_key = os.environ.get("GROQ_API_KEY", "")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 164 | `groq` | `raw_model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 173 | `prompts` | `"""Loads and caches src/prompts/reports_combined.md."""` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 444 | `rate limit` | `# Rate Limit Parsing & Classification (Task 3.9)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 452 | `cooldown` | `wait_s = 30.0  # default cooldown` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 494 | `groq` | `global _groq_calls_history` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 495 | `groq` | `_groq_calls_history = [t for t in _groq_calls_history if t > one_hour_ago]` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 496 | `groq` | `if len(_groq_calls_history) >= 30:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 497 | `groq` | `oldest = _groq_calls_history[0]` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 515 | `groq` | `_groq_calls_history.append(now)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 826 | `httpx` | `mock_transport: Optional[httpx.BaseTransport] = None,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 829 | `ndjson` | `Unified generator yielding NDJSON events for POST /api/v1/reports/generate.` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 832 | `groq` | `global _cooldown_until, _cooldown_type, _last_groq_status` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 834 | `groq` | `api_key, model = get_groq_config()` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 836 | `stage` | `# Stage 1: Preparing` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 837 | `stage` | `yield json.dumps({"event": "stage", "stage": "preparing"}) + "\n"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 861 | `cooldown` | `"cooldown_s": client_wait,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 869 | `cooldown` | `# Check Cooldown` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 871 | `cooldown` | `if now < _cooldown_until:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 872 | `cooldown` | `cooldown_s = int(math.ceil(_cooldown_until - now))` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 877 | `cooldown` | `"status": _cooldown_type if _cooldown_type in ("rate_limited_minute", "rate_limited_daily") else "cooldown",` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 881 | `cooldown` | `"cooldown_s": cooldown_s,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 897 | `groq` | `# If no key, skip Groq immediately` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 899 | `groq` | `_last_groq_status = "no_key"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 908 | `cooldown` | `"cooldown_s": None,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 916 | `stage` | `# Stage 2: Requesting` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 917 | `stage` | `yield json.dumps({"event": "stage", "stage": "requesting", "model": model}) + "\n"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 922 | `groq` | `groq_url = "https://api.groq.com/openai/v1/chat/completions"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 947 | `groq` | `groq_resp = None` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 966 | `httpx` | `async with httpx.AsyncClient(transport=mock_transport, timeout=40.0) as client:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 969 | `groq` | `groq_resp = await client.post(groq_url, json=payload, headers=headers)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 973 | `groq` | `rl_limit = groq_resp.headers.get("x-ratelimit-limit-tokens", "n/a")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 974 | `groq` | `rl_remaining = groq_resp.headers.get("x-ratelimit-remaining-tokens", "n/a")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 975 | `groq` | `rl_reset = groq_resp.headers.get("x-ratelimit-reset-tokens", "n/a")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 977 | `groq` | `f"[GROQ CALL] req_id={req_id} prompt_chars={prompt_chars} est_tokens={est_tokens} "` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 978 | `groq` | `f"max_tokens=1400 status={groq_resp.status_code} elapsed_ms={t_elapsed_ms} "` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 983 | `groq` | `if groq_resp.status_code == 429:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 984 | `groq` | `limit_type, wait_s = parse_429_response(groq_resp.status_code, groq_resp.text, groq_resp.headers)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 986 | `stage` | `yield json.dumps({"event": "stage", "stage": "waiting_retry", "retry_in_s": round(wait_s, 1)}) + "\n"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 991 | `groq` | `groq_resp = await client.post(groq_url, json=payload, headers=headers)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 993 | `groq` | `rl_rem2 = groq_resp.headers.get("x-ratelimit-remaining-tokens", "n/a")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 995 | `groq` | `f"[GROQ CALL RETRY] req_id={req_id} status={groq_resp.status_code} "` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1000 | `groq` | `if groq_resp.status_code == 200:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1001 | `groq` | `resp_data = groq_resp.json()` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1004 | `groq` | `elif groq_resp.status_code == 401:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1006 | `groq` | `elif groq_resp.status_code == 403:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1007 | `groq` | `body_lower = groq_resp.text.lower()` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1012 | `groq` | `elif groq_resp.status_code in (400, 404):` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1014 | `groq` | `elif groq_resp.status_code == 429:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1015 | `groq` | `limit_type, wait_s = parse_429_response(groq_resp.status_code, groq_resp.text, groq_resp.headers)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1017 | `cooldown` | `_cooldown_type = limit_type` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1018 | `cooldown` | `_cooldown_until = time.time() + wait_s` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1022 | `httpx` | `except httpx.TimeoutException:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1025 | `groq` | `logger.error(f"[GROQ CONNECTION ERROR] {e}")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1031 | `groq` | `_last_groq_status = call_status` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1033 | `stage` | `# Stage 3: Checking` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1034 | `stage` | `yield json.dumps({"event": "stage", "stage": "checking"}) + "\n"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1046 | `groq` | `logger.warning(f"[PARSING ERROR] Failed parsing Groq JSON: {e}")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1053 | `groq` | `has_groq_section = False` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1067 | `groq` | `section_sources["clinician.model_output_summary"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1068 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1085 | `groq` | `section_sources[f"clinician.attribution.{v}"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1086 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1100 | `groq` | `section_sources["clinician.methodological_notes"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1101 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1117 | `groq` | `section_sources["patient.what_this_is"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1118 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1134 | `groq` | `section_sources["patient.overall_picture"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1135 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1154 | `groq` | `section_sources[f"patient.arteries.{a}"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1155 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1177 | `groq` | `section_sources["patient.influences"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1178 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1193 | `groq` | `section_sources["patient.about_this_estimate"] = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1194 | `groq` | `has_groq_section = True` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1203 | `groq` | `if has_groq_section and not has_template_section:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1204 | `groq` | `overall_source = "groq"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1205 | `groq` | `elif has_groq_section and has_template_section:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1210 | `stage` | `# Stage 4: Building` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1211 | `stage` | `yield json.dumps({"event": "stage", "stage": "building"}) + "\n"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1216 | `cooldown` | `cooldown_s_val = None` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1217 | `cooldown` | `if time.time() < _cooldown_until:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1218 | `cooldown` | `cooldown_s_val = int(math.ceil(_cooldown_until - time.time()))` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1226 | `cooldown` | `"cooldown_s": cooldown_s_val,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1249 | `groq` | `# Configuration Status (Task 3.12 - ZERO Groq calls)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1255 | `groq` | `Makes NO call to Groq.` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1258 | `groq` | `api_key, model = get_groq_config()` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1259 | `groq` | `raw_key = os.environ.get("GROQ_API_KEY", "")` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1262 | `cooldown` | `cooldown_s = None` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1263 | `cooldown` | `if now < _cooldown_until:` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1264 | `cooldown` | `cooldown_s = int(math.ceil(_cooldown_until - now))` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1268 | `groq` | `calls_last_hour = sum(1 for t in _groq_calls_history if t > one_hour_ago)` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1278 | `cooldown` | `"cooldown_s": cooldown_s,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1279 | `groq` | `"groq_calls_last_hour": calls_last_hour,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1280 | `groq` | `"last_status": _last_groq_status,` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1282 | `env_file` | `"env_file_found": (REPO_ROOT / ".env").exists(),` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1283 | `env_file` | `"env_file_path": str(REPO_ROOT / ".env"),` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1365 | `groq` | `global _cooldown_until, _cooldown_type, _last_groq_status` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1366 | `cooldown` | `_cooldown_until = 0.0` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1367 | `cooldown` | `_cooldown_type = "ok"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1368 | `groq` | `_last_groq_status = "ok"` | **DELETE** | Replaced by report_templates.py |
| `apps/api/app/services/llm_service.py` | 1369 | `groq` | `_groq_calls_history.clear()` | **DELETE** | Replaced by report_templates.py |
| `apps/api/tests/test_report_engine_single_call.py` | 5 | `groq` | `Asserts EXACT Groq call counts using httpx.MockTransport with a call counter:` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 10 | `cooldown` | `- minute-level 429 with 40s = 1 call, template, cooldown set` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 12 | `cooldown` | `- request during cooldown = 0 calls` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 26 | `httpx` | `import httpx` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 29 | `llm` | `from apps.api.app.services.llm_service import (` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 70 | `groq` | `VALID_GROQ_CONTENT = json.dumps({` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 103 | `groq` | `def make_mock_groq_response(status_code: int = 200, content_str: str = VALID_GROQ_CONTENT, headers: Dict[str, str] = Non` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 118 | `httpx` | `return httpx.Response(status_code=200, json=data, headers=resp_headers)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 120 | `rate limit` | `data = {"error": {"message": "Rate limit reached", "type": "tokens", "code": "rate_limit_exceeded"}}` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 121 | `httpx` | `return httpx.Response(status_code=429, json=data, headers=resp_headers)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 123 | `httpx` | `return httpx.Response(status_code=status_code, text="Error", headers=resp_headers)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 136 | `groq` | `monkeypatch.setenv("GROQ_API_KEY", "gsk_test1234567890abcdef")` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 137 | `groq` | `monkeypatch.setenv("GROQ_MODEL", "llama-3.1-8b-instant")` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 145 | `groq` | `"""Verify standard generation makes exactly ONE Groq call."""` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 148 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 150 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 152 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 162 | `stage` | `assert [e["stage"] for e in events if e.get("event") == "stage"] == ["preparing", "requesting", "checking", "building"]` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 166 | `groq` | `assert result["source"] == "groq"` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 175 | `groq` | `content_with_banned = json.loads(VALID_GROQ_CONTENT)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 178 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 180 | `groq` | `return make_mock_groq_response(200, content_str=json.dumps(content_with_banned))` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 182 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 201 | `groq` | `"""Verify malformed JSON from Groq falls back to deterministic template with 1 call."""` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 204 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 206 | `groq` | `return make_mock_groq_response(200, content_str="INVALID NOT JSON AT ALL {{{")` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 208 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 229 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 232 | `groq` | `return make_mock_groq_response(429, headers={"retry-after": "0.1"})` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 233 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 235 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 244 | `stage` | `# Verify waiting_retry stage event was emitted` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 245 | `stage` | `waiting_stages = [e for e in events if e.get("event") == "stage" and e.get("stage") == "waiting_retry"]` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 246 | `stage` | `assert len(waiting_stages) == 1` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 252 | `cooldown` | `async def test_case_minute_429_over_15s_one_call_sets_cooldown():` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 253 | `cooldown` | `"""Verify minute-level 429 with wait > 15s does not retry (1 call), returns template and sets cooldown."""` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 256 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 258 | `groq` | `return make_mock_groq_response(429, headers={"retry-after": "40"})` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 260 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 272 | `cooldown` | `assert result["cooldown_s"] is not None and result["cooldown_s"] > 0` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 280 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 282 | `httpx` | `return httpx.Response(` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 288 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 303 | `cooldown` | `async def test_case_request_during_cooldown_makes_zero_calls():` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 304 | `groq` | `"""Verify request during active cooldown returns immediately with 0 Groq calls."""` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 307 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 309 | `groq` | `return make_mock_groq_response(429, headers={"retry-after": "45"})` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 311 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 312 | `cooldown` | `# First call sets cooldown` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 321 | `cooldown` | `# Second call during cooldown` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 340 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 342 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 344 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 371 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 373 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 375 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 398 | `groq` | `"""Verify force=True bypasses cache and triggers a second Groq call."""` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 401 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 403 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 405 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 429 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 431 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 433 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 448 | `groq` | `# 5th attempt must be rejected by client limit guard without calling Groq` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 463 | `groq` | `"""Verify when GROQ_API_KEY is missing or empty, 0 calls are made and template is returned."""` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 464 | `groq` | `monkeypatch.setenv("GROQ_API_KEY", "")` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 467 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 469 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 471 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 490 | `httpx` | `def handler(request: httpx.Request):` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 491 | `groq` | `return make_mock_groq_response(200)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_report_engine_single_call.py` | 493 | `httpx` | `transport = httpx.MockTransport(handler)` | **DELETE** | Replaced by tests without Groq / NDJSON / cooldown |
| `apps/api/tests/test_wizard_and_reports.py` | 14 | `llm` | `from apps.api.app.services.llm_service import (` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 231 | `llm` | `from apps.api.app.services.llm_service import (` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 232 | `groq` | `get_groq_config,` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 240 | `groq` | `"""Verify GET /reports/status conforms to zero-Groq diagnostic schema."""` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 248 | `cooldown` | `assert "cooldown_s" in data` | **EDIT** | Keyword 'cooldown' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 249 | `groq` | `assert "groq_calls_last_hour" in data` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 253 | `groq` | `assert "groq_api_key" not in data` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 256 | `groq` | `def test_get_groq_config_whitespace_and_quotes(monkeypatch):` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 257 | `groq` | `"""Verify Groq config strips whitespace, \\r, \\n, BOM, and surrounding quotes."""` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 258 | `groq` | `monkeypatch.setenv("GROQ_API_KEY", '\ufeff  "gsk_test123456789"\r\n  ')` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 259 | `groq` | `monkeypatch.setenv("GROQ_MODEL", " 'llama-3.3-70b-versatile'\r\n ")` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 260 | `groq` | `key, model = get_groq_config()` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 265 | `groq` | `monkeypatch.setenv("GROQ_API_KEY", "PASTE_YOUR_GROQ_API_KEY_HERE")` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 266 | `groq` | `key, model = get_groq_config()` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 269 | `groq` | `monkeypatch.setenv("GROQ_API_KEY", "PASTE_OTHER_KEY")` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 270 | `groq` | `key, model = get_groq_config()` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 306 | `groq` | `def test_groq_report_generation_with_banned_phrase(sample_patient_dict):` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 338 | `ndjson` | `"""Verify POST /api/v1/reports/generate streams valid NDJSON and falls back gracefully."""` | **EDIT** | Keyword 'ndjson' matched; update to reflect static report template architecture |
| `apps/api/tests/test_wizard_and_reports.py` | 343 | `stage` | `assert lines[0]["event"] == "stage"` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `apps/web/src/components/reports/GeneratingView.tsx` | 2 | `stage` | `import type { ReportStage } from '../../hooks/useReportGeneration';` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 6 | `stage` | `currentStage: ReportStage;` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 12 | `stage` | `const STAGES = [` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 16 | `stage` | `stageKey: 'preparing',` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 21 | `stage` | `stageKey: 'requesting', // also matches waiting_retry` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 26 | `stage` | `stageKey: 'checking',` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 31 | `stage` | `stageKey: 'building',` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 36 | `stage` | `currentStage,` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 46 | `stage` | `// Determine stage progression` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 47 | `stage` | `const getStageIndex = (stage: ReportStage): number => {` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 48 | `stage` | `switch (stage) {` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 63 | `stage` | `const activeStageIndex = getStageIndex(currentStage);` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 65 | `stage` | `// Screen reader stage text` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 66 | `stage` | `const currentStageTitle = STAGES[activeStageIndex]?.title \|\| 'Processing';` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 67 | `stage` | `const ariaAnnouncement = `Stage ${activeStageIndex + 1} of 4: ${currentStageTitle}${` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 68 | `rate limit` | `currentStage === 'waiting_retry' && retryInSeconds ? `. Rate limit reached. Retrying in ${retryInSeconds} seconds.` : ''` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 81 | `trace-loop` | `@keyframes ecg-trace-loop {` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 184 | `trace-loop` | `{/* ECG Trace-Loop Waveform Animation (Task 4.2) */}` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 223 | `trace-loop` | `animation: 'ecg-trace-loop 3.5s linear infinite',` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 229 | `stage` | `{/* 4-Stage Vertical Progress List (Task 4.2) */}` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 231 | `stage` | `{STAGES.map((step, idx) => {` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 232 | `stage` | `const isCompleted = idx < activeStageIndex;` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 233 | `stage` | `const isActive = idx === activeStageIndex;` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 234 | `stage` | `const isPending = idx > activeStageIndex;` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 310 | `stage` | `{step.id === 'requesting' && currentStage === 'waiting_retry' && (` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/components/reports/GeneratingView.tsx` | 332 | `rate limit` | `Minute rate limit reached. Retrying in{' '}` | **DELETE** | Streaming generating view removed in favor of static skeleton |
| `apps/web/src/config/featureSchema.ts` | 418 | `rate limit` | `{ value: '2', label: 'Class II: Moderate limitation with ordinary activity' },` | **EDIT** | Keyword 'rate limit' matched; update to reflect static report template architecture |
| `apps/web/src/hooks/useReportGeneration.ts` | 6 | `stage` | `export type ReportStage = 'preparing' \| 'requesting' \| 'waiting_retry' \| 'checking' \| 'building' \| null;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 10 | `groq` | `source: 'groq' \| 'template' \| 'mixed' \| string;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 13 | `cooldown` | `cooldown_s: number \| null;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 20 | `stage` | `currentStage: ReportStage;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 23 | `cooldown` | `cooldownRemaining: number \| null;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 39 | `stage` | `const [currentStage, setCurrentStage] = useState<ReportStage>(null);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 42 | `cooldown` | `const [cooldownRemaining, setCooldownRemaining] = useState<number \| null>(null);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 49 | `cooldown` | `const cooldownTimerRef = useRef<number \| null>(null);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 95 | `cooldown` | `// Cooldown countdown timer` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 97 | `cooldown` | `if (cooldownRemaining !== null && cooldownRemaining > 0) {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 98 | `cooldown` | `cooldownTimerRef.current = window.setInterval(() => {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 99 | `cooldown` | `setCooldownRemaining((prev) => {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 107 | `cooldown` | `if (cooldownTimerRef.current) {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 108 | `cooldown` | `window.clearInterval(cooldownTimerRef.current);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 109 | `cooldown` | `cooldownTimerRef.current = null;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 113 | `cooldown` | `if (cooldownTimerRef.current) {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 114 | `cooldown` | `window.clearInterval(cooldownTimerRef.current);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 117 | `cooldown` | `}, [cooldownRemaining]);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 130 | `stage` | `setCurrentStage('preparing');` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 139 | `ndjson` | `Accept: 'application/x-ndjson',` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 175 | `stage` | `if (eventData.event === 'stage') {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 176 | `stage` | `const stage = eventData.stage as ReportStage;` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 177 | `stage` | `setCurrentStage(stage);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 178 | `stage` | `if (stage === 'waiting_retry' && typeof eventData.retry_in_s === 'number') {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 180 | `stage` | `} else if (stage !== 'waiting_retry') {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 195 | `cooldown` | `cooldown_s: eventData.cooldown_s ?? null,` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 201 | `cooldown` | `if (metaData.cooldown_s && metaData.cooldown_s > 0) {` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 202 | `cooldown` | `setCooldownRemaining(metaData.cooldown_s);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 206 | `stage` | `setCurrentStage(null);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 210 | `ndjson` | `console.warn('[NDJSON Parse Error]', parseErr, trimmed);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 219 | `stage` | `setCurrentStage(null);` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 227 | `stage` | `currentStage,` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/hooks/useReportGeneration.ts` | 230 | `cooldown` | `cooldownRemaining,` | **DELETE** | Replaced by useReports.ts hook |
| `apps/web/src/pages/DataEntryPage.tsx` | 720 | `llm` | `scrollMarginTop: '80px',` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `apps/web/src/pages/ReportsPage.tsx` | 19 | `cooldown` | `cooldown_s?: number \| null;` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 20 | `groq` | `groq_calls_last_hour?: number;` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 52 | `stage` | `currentStage,` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 55 | `cooldown` | `cooldownRemaining,` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 68 | `groq` | `// Fetch zero-Groq configuration diagnostics on mount (Task 3.12)` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 109 | `groq` | `const source = meta?.source \|\| (technicalReport?.source === 'groq' ? 'groq' : 'template');` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 112 | `cooldown` | `const effectiveCooldown = cooldownRemaining ?? meta?.cooldown_s ?? diagnosticStatus?.cooldown_s;` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 115 | `groq` | `if (source === 'groq') {` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 116 | `groq` | `baseText = `Synthesized by Groq (${model})${elapsedSec ? ` in ${elapsedSec}s` : ''}`;` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 121 | `groq` | `baseText = `Synthesized by Groq with rule-based fallback for ${` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 126 | `groq` | `baseText = `Synthesized from clinical rules and TreeSHAP values (Groq offline or rate limited: ${errStatus})`;` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 129 | `cooldown` | `if (effectiveCooldown && effectiveCooldown > 0) {` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 130 | `cooldown` | `baseText += ` • Next AI generation available in ${effectiveCooldown}s`;` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 143 | `cooldown` | `const isRegenerateDisabled = isGenerating \|\| Boolean(cooldownRemaining && cooldownRemaining > 0);` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 165 | `regenerate` | `disabled={isRegenerateDisabled}` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 167 | `cooldown` | `cooldownRemaining && cooldownRemaining > 0` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 168 | `cooldown` | `? `Next AI generation available in ${cooldownRemaining}s`` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 169 | `regenerate` | `: 'Regenerate reports'` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 173 | `regenerate` | `{isGenerating ? 'Generating...' : 'Regenerate'}` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `apps/web/src/pages/ReportsPage.tsx` | 252 | `stage` | `currentStage={currentStage}` | **EDIT** | Integrate new useReports hook, remove status line Groq references |
| `docs/CONTRAST_REPORT.md` | 346 | `regenerate` | `\| /reports (clinician tab) \| Paper (Light) \| `span` ("Regenerate") \| 17.46:1 \| 4.5:1 \| **PASS** \|` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/CONTRAST_REPORT.md` | 367 | `regenerate` | `\| /reports (patient tab) \| Paper (Light) \| `span` ("Regenerate") \| 17.46:1 \| 4.5:1 \| **PASS** \|` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/CONTRAST_REPORT.md` | 813 | `regenerate` | `\| /reports (clinician tab) \| Monitor (Dark) \| `span` ("Regenerate") \| 15.43:1 \| 4.5:1 \| **PASS** \|` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/CONTRAST_REPORT.md` | 834 | `regenerate` | `\| /reports (patient tab) \| Monitor (Dark) \| `span` ("Regenerate") \| 15.43:1 \| 4.5:1 \| **PASS** \|` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 12 | `groq` | `Perfusion3D operates as a decoupled microservice application consisting of a React/TypeScript frontend (ECG paper design` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 17 | `groq` | `\| **API Backend** \| Docker Compose (`perfusion3d_api`) \| `8000` \| `8000` \| HTTP \| ML Inference (`/api/v1/predict`), Stre` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 45 | `ndjson` | `- `/api/`: Proxied upstream to `http://api:8000/api/` with streaming support (`proxy_buffering off`, `proxy_cache off`) ` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 56 | `groq` | `### 3.2 Key Forensics: Groq API Key & Rate Limits` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 60 | `groq` | `- *Symptom*: Live domain rendered "Groq API key not found. Using standard template."` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 61 | `.env` | `- *Cause*: Docker Compose does not automatically re-read modified `.env` files upon simple container restarts (`docker c` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 66 | `groq` | `- *Security Rule*: The key is loaded strictly into memory via environment variables (`GROQ_API_KEY`) and is never commit` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 69 | `rate limit` | `- *Symptom*: Rapid 429 rate limit errors when generating clinician and patient reports.` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 70 | `llm` | `- *Cause*: The legacy engine triggered up to 12 separate multi-thousand-token LLM calls with automatic 3x retries, backg` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 72 | `prompts` | `- **Single Unified Prompt**: Consolidates both Clinician (7 sections) and Patient (8 sections) reports into a single `<1` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 73 | `groq` | `- **Zero-Groq Diagnostics**: Replaced `/reports/status` polling with local configuration checks that make 0 network requ` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/DOMAIN_AND_PORTS.md` | 76 | `rate limit` | `- **Strict Rate Limiting**: Client IP rate limiting (4 requests / 10 minutes per client IP; 30 requests / hour global).` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/QUOTA_FORENSICS.md` | 3 | `groq` | `## 1. Code Path & Groq Request Count Per Click (Task 0.2 a)` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 7 | `groq` | `- On component mount, `useEffect` immediately fires `GET /api/v1/reports/status` (which calls Groq `/models` if cache >6` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 12 | `regenerate` | `- If the user clicks "Regenerate", `fetchActiveReport(force=true)` fires another POST and another status call.` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 13 | `llm` | `2. **Backend Execution (`routes.py` & `llm_service.py`)**:` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 16 | `groq` | `- If output validation fails (e.g. missing section, banned phrase, or number discrepancy), it loops and makes a 2nd and ` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 19 | `groq` | `- Server startup runs `verify_groq_startup()` in `main.py`, calling `GET https://api.groq.com/openai/v1/models`.` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 20 | `groq` | `- `/reports/status` calls `perform_live_groq_check()` hitting `/models` on cache expiration (60s).` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 22 | `groq` | `### Groq Requests Count Per User Generation Action:` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 23 | `groq` | `- **Best Case (Both valid on attempt 1, single tab, no StrictMode duplicate)**: 2 Groq completions calls + 2 status chec` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 24 | `groq` | `- **Normal Usage (User views technical then patient tab)**: 2 Groq completions calls + status calls.` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 64 | `groq` | `- *Comparison to Groq Free Tier*: Models such as `qwen/qwen3.8-27b` and `llama-3.3-70b-versatile` have Free-Tier TPM (to` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 68 | `groq` | `## 4. Tests and Scripts Capable of Calling Live Groq (Task 0.2 d)` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 70 | `groq` | `The following files were identified as capable of making live Groq requests:` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 71 | `groq` | `1. `scripts/test_live_groq.py`: Executes unmocked `call_groq()` and unmocked `perform_live_groq_check(force=True)`.` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 72 | `llm` | `2. `e2e/full_flow.spec.cjs`: Steps through the UI to `/reports` without intercepting `/api/v1/reports/*`, triggering rea` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 77 | `groq` | `*(Note: The unit test suite `apps/api/tests/test_wizard_and_reports.py` properly mocks `httpx.Client.get` and `call_groq` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 85 | `groq` | `2026-10-05 08:13:04 [WARNING] [cardio_api]: Groq HTTP error (attempt 2/3): Groq rate limit exceeded (HTTP 429: tokens)` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 86 | `groq` | `2026-10-05 08:13:09 [WARNING] [cardio_api]: Groq HTTP error (attempt 1/3): Groq rate limit exceeded (HTTP 429: tokens)` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 87 | `groq` | `2026-10-05 08:13:56 [WARNING] [cardio_api]: Groq HTTP error (attempt 1/3): Groq rate limit exceeded (HTTP 429: tokens)` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 93 | `groq` | `The 429 rate limit is caused by making two separate multi-thousand-token LLM calls per report generation with automatic ` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 103 | `groq` | `### b) API Container `GROQ_API_KEY` Status` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 105 | `groq` | `- `GROQ_API_KEY` present: `True`` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 108 | `groq` | `- `GROQ_API_KEY` present: `False` (as evidenced by the UI reporting "Groq API key not found. Using standard template." w` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 110 | `.env` | `### c) `.env` Location & Container Recreation` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 111 | `.env` | `- **Host `.env` Location**: `.env` is located directly adjacent to `docker-compose.yml` in the project root (`C:\Users\S` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 113 | `.env` | `- Running `docker compose restart` does **not** re-read or inject updated `.env` values into running containers.` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 114 | `.env` | `- To inject updated environment variables from `.env`, the container must be recreated using:` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/QUOTA_FORENSICS.md` | 118 | `groq` | `- On the host serving `perfusion.shreykansara.dev`, the API container was either launched without a `.env` file containi` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `docs/UI_MIGRATION_NOTES_2.md` | 69 | `stage` | `- **Resolution**: Multi-stage build updated with `ARG GIT_SHA`, writing `version.txt` and setting `LABEL org.opencontain` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `docs/UI_MIGRATION_NOTES_2.md` | 71 | `groq` | `- **Status Before**: Missing `ARG GIT_SHA`, missing `LABEL org.opencontainers.image.revision`, missing `src/prompts/` (r` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/UI_MIGRATION_NOTES_2.md` | 72 | `httpx` | `- **Resolution**: Added `ARG GIT_SHA`, revision label, non-root user `appuser`, `HEALTHCHECK` probe against `/api/v1/hea` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/UI_MIGRATION_NOTES_2.md` | 75 | `env_file` | `- **Resolution**: Added `args: GIT_SHA: ${GIT_SHA:-dev}` to both `api` and `web` services. Verified `env_file: .env` for` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/UI_MIGRATION_NOTES_2.md` | 82 | `.env` | `- **Resolution**: Added whitelist exception `!reports/validation_metrics.json`. Verified `.env` is excluded from all ima` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/print-samples/perfusion3d_clinician_monitor.pdf` | 156 | `llm` | `v0n^CS3Ǧai	L#1hn\!pt:]R	OS+;Vt*:l OΘMZ;t殌=3Vx=^llm掃55;NA_a6W7T5h<Eߛ3+}OB\sʸ)<I<ct3h;XW#_nܳc݊k<,[` | **EDIT** | Clean up Groq/LLM references in documentation |
| `docs/print-samples/perfusion3d_clinician_paper.pdf` | 156 | `llm` | `v0n^CS3Ǧai	L#1hn\!pt:]R	OS+;Vt*:l OΘMZ;t殌=3Vx=^llm掃55;NA_a6W7T5h<Eߛ3+}OB\sʸ)<I<ct3h;XW#_nܳc݊k<,[` | **EDIT** | Clean up Groq/LLM references in documentation |
| `e2e/contrast.spec.cjs` | 18 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:5173';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `e2e/design_conformance.spec.cjs` | 21 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:5173';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `e2e/full_flow.spec.cjs` | 22 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:5173';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 18 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:5173';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 231 | `groq` | `// Mock NDJSON generation endpoint to protect Groq quota` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 234 | `stage` | `JSON.stringify({ event: 'stage', stage: 'preparing' }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 235 | `stage` | `JSON.stringify({ event: 'stage', stage: 'building' }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 239 | `groq` | `source: 'groq',` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 240 | `qwen` | `model: 'qwen/qwen3.8-27b',` | **EDIT** | Keyword 'qwen' matched; update to reflect static report template architecture |
| `e2e/mobile_flow.spec.cjs` | 249 | `ndjson` | `'Content-Type': 'application/x-ndjson',` | **EDIT** | Keyword 'ndjson' matched; update to reflect static report template architecture |
| `e2e/print.spec.cjs` | 7 | `regenerate` | `* 3. A4 PDF generated has no navbar or chrome text ("Regenerate", "Download PDF", "Theme", "New assessment", "Step 4 of ` | **EDIT** | Keyword 'regenerate' matched; update to reflect static report template architecture |
| `e2e/print.spec.cjs` | 25 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:5173';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `e2e/print.spec.cjs` | 28 | `regenerate` | `'Regenerate',` | **EDIT** | Keyword 'regenerate' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 8 | `stage` | `* 3. Tests waiting_retry stage: countdown ticking down` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 134 | `ndjson` | `// Test 1, 2, 3: Streamed NDJSON with stage progression and waiting_retry countdown` | **EDIT** | Keyword 'ndjson' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 136 | `ndjson` | `console.log('1. Setting up mock NDJSON route with delayed stage events...');` | **EDIT** | Keyword 'ndjson' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 145 | `stage` | `JSON.stringify({ event: 'stage', stage: 'preparing' }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 146 | `stage` | `JSON.stringify({ event: 'stage', stage: 'requesting', model: 'llama-3.3-70b-versatile' }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 147 | `stage` | `JSON.stringify({ event: 'stage', stage: 'waiting_retry', retry_in_s: 3 }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 148 | `stage` | `JSON.stringify({ event: 'stage', stage: 'checking' }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 149 | `stage` | `JSON.stringify({ event: 'stage', stage: 'building' }) + '\n',` | **EDIT** | Keyword 'stage' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 153 | `groq` | `source: 'groq',` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 156 | `cooldown` | `cooldown_s: null,` | **EDIT** | Keyword 'cooldown' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 157 | `groq` | `section_sources: { clinician: 'groq', patient: 'groq' },` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 168 | `ndjson` | `'Content-Type': 'application/x-ndjson',` | **EDIT** | Keyword 'ndjson' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 202 | `groq` | `const statusLine = page.locator('text=Synthesized by Groq');` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 204 | `groq` | `console.log('  ✓ Status line rendered with Groq model info');` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 254 | `regenerate` | `// Click Regenerate` | **EDIT** | Keyword 'regenerate' matched; update to reflect static report template architecture |
| `e2e/report_generation_states.spec.cjs` | 255 | `regenerate` | `const regenBtn = page.locator('button:has-text("Regenerate")');` | **EDIT** | Keyword 'regenerate' matched; update to reflect static report template architecture |
| `e2e/test_scrolling.cjs` | 9 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:8080';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `scripts/check_style.py` | 49 | `trace-loop` | `KEYFRAME_PATTERN = re.compile(r"@keyframes\s+(?!wipe\b\|wipe-out\b\|grow\b\|draw\b\|feed\b\|head\b\|ecg-trace-loop\b\|pulse-dot` | **EDIT** | Keyword 'trace-loop' matched; update to reflect static report template architecture |
| `scripts/e2e_test.mjs` | 11 | `.env` | `const BASE_URL = process.argv[2] \|\| process.env.BASE_URL \|\| 'http://localhost:8080';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `scripts/e2e_test.mjs` | 221 | `groq` | `// Status line can say "Generated with Groq" or fallback if rate limited/offline` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/e2e_test.mjs` | 223 | `groq` | `if (!pageText.includes('Groq model not available. Using standard template.')) {` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/e2e_test.mjs` | 227 | `groq` | `if (!pageText.includes('Groq rate limit reached. Using standard template.')) {` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/e2e_test.mjs` | 231 | `groq` | `if (!pageText.includes('Groq blocked the request. Using standard template.')) {` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/e2e_test.mjs` | 235 | `groq` | `if (!pageText.includes('Groq denied access for this key. Using standard template.')) {` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 5 | `groq` | `'groq', 'llm', 'qwen', 'openai', 'httpx', 'dotenv', 'env_file', '.env',` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 6 | `prompts` | `'prompts', 'ndjson', 'cooldown', 'rate limit', 'standard template',` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 7 | `regenerate` | `'regenerate', 'stage', 'trace-loop', 'skeleton-sweep'` | **EDIT** | Keyword 'regenerate' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 36 | `groq` | `if rel_path in ['.env', '.env.example', 'docs/QUOTA_FORENSICS.md', 'scripts/test_live_groq_single.py']:` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 38 | `groq` | `reason = "Groq/env artifact removed in Phase 1"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 39 | `prompts` | `elif 'src/prompts' in rel_path:` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 41 | `prompts` | `reason = "Prompts folder removed for static templates"` | **EDIT** | Keyword 'prompts' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 42 | `llm` | `elif 'llm_service.py' in rel_path:` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 50 | `trace-loop` | `reason = "Removed skeleton animations (skeleton-sweep, trace-loop)"` | **EDIT** | Keyword 'trace-loop' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 56 | `groq` | `reason = "Replaced by tests without Groq / NDJSON / cooldown"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 57 | `.env` | `elif '.gitignore' in rel_path and '.env' in line:` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 59 | `.env` | `reason = "Harmless guard to prevent accidental commits of local .env"` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 60 | `env_file` | `elif 'docker-compose.yml' in rel_path and 'env_file' in line:` | **EDIT** | Keyword 'env_file' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 62 | `env_file` | `reason = "Remove env_file from compose services"` | **EDIT** | Keyword 'env_file' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 66 | `httpx` | `elif 'requirements.txt' in rel_path and ('httpx' in line or 'python-dotenv' in line):` | **EDIT** | Keyword 'httpx' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 68 | `groq` | `reason = "Dependency only used by Groq LLM service"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 69 | `stage` | `elif 'stage' in kw and ('multi-stage' in line_lower or 'stage 1' in line_lower or 'stage 2' in line_lower):` | **KEEP** | Docker multi-stage build terminology, unrelated to Groq |
| `scripts/generate_removal_inventory.py` | 71 | `groq` | `reason = "Docker multi-stage build terminology, unrelated to Groq"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 72 | `stage` | `elif 'stage' in kw and 'staging' in line_lower:` | **KEEP** | General workflow / Git staging reference |
| `scripts/generate_removal_inventory.py` | 77 | `groq` | `reason = "Clean up Groq/LLM references in documentation"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 80 | `groq` | `reason = "Remove Groq/LLM references and update run commands"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 83 | `groq` | `reason = "Remove Groq/LLM mentions from technical model details"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 86 | `groq` | `reason = "Integrate new useReports hook, remove status line Groq references"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 89 | `groq` | `reason = "Remove dotenv and Groq settings"` | **EDIT** | Keyword 'groq' matched; update to reflect static report template architecture |
| `scripts/generate_removal_inventory.py` | 95 | `llm` | `reason = "Remove llm_service startup call"` | **EDIT** | Keyword 'llm' matched; update to reflect static report template architecture |
| `scripts/preprocess.py` | 20 | `httpx` | `import httpx` | **EDIT** | Keyword 'httpx' matched; update to reflect static report template architecture |
| `scripts/preprocess.py` | 103 | `httpx` | `response = httpx.get(UCI_DATASET_ZIP_URL, follow_redirects=True, timeout=60.0)` | **EDIT** | Keyword 'httpx' matched; update to reflect static report template architecture |
| `scripts/test_live_groq_single.py` | 2 | `groq` | `Task 3.15: Live Groq Verification Script (Exactly ONE Live Call)` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 12 | `groq` | `If Groq returns 429, stops, does not retry, quotes Groq's message and reports when the limit resets.` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 26 | `llm` | `from apps.api.app.services.llm_service import (` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 28 | `groq` | `get_groq_config,` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 38 | `groq` | `print("TASK 3.15: LIVE GROQ GENERATION CHECK (EXACTLY ONE CALL)")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 43 | `groq` | `key, model = get_groq_config()` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 50 | `groq` | `print("\n[RESULT] No active Groq API key found. Skipping live check.")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 83 | `groq` | `# 4. Execute the ONE Live Groq Generation` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 84 | `groq` | `print("\nInitiating ONE live Groq generation request...")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 100 | `stage` | `if evt.get("event") == "stage":` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 101 | `stage` | `print(f"  -> Stage reached: {evt.get('stage')}")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 112 | `cooldown` | `cooldown_s = result_event.get("cooldown_s")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 117 | `cooldown` | `print(f"Cooldown:     {cooldown_s} s" if cooldown_s else "Cooldown:     None")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 120 | `rate limit` | `print("\n[RATE LIMIT TRIGGERED]")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_live_groq_single.py` | 122 | `cooldown` | `print(f"Cooldown wait: {cooldown_s} seconds until reset.")` | **DELETE** | Groq/env artifact removed in Phase 1 |
| `scripts/test_report_contrast_proof.cjs` | 32 | `.env` | `const BASE_URL = process.env.BASE_URL \|\| 'http://localhost:8080';` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
| `scripts/validate_docker_setup.py` | 92 | `.env` | `required = [".env", ".git", "node_modules", "apps/web/dist", "__pycache__"]` | **EDIT** | Keyword '.env' matched; update to reflect static report template architecture |
