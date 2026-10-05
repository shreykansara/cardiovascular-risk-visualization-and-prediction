# Domain & Port Mapping Specification

**Product**: Perfusion3D — Multimodal Coronary Artery Disease Risk Assessment  
**Document**: Port Architecture & Live Domain Forensics Report  
**Date**: October 5, 2026  
**Status**: Verified & Production-Ready  

---

## 1. Port Architecture & Mapping Table

Perfusion3D operates as a decoupled microservice application consisting of a React/TypeScript frontend (ECG paper design language) and a high-performance Python 3.11 FastAPI backend (LightGBM, XGBoost, and CatBoost inference with TreeSHAP explanations and unified Groq report synthesis).

| Service | Environment | Port (Host) | Port (Container) | Protocol | Purpose / Routes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **API Backend** | Local Development | `8000` | N/A | HTTP | Uvicorn server (`apps.api.app.main:app`), `/health`, `/api/v1/*` |
| **API Backend** | Docker Compose (`perfusion3d_api`) | `8000` | `8000` | HTTP | ML Inference (`/api/v1/predict`), Streaming NDJSON (`/api/v1/reports/generate`), Zero-Groq config diagnostics (`/api/v1/reports/status`) |
| **Web Dev Server** | Local Vite Dev / Preview | `5173` | N/A | HTTP | Vite development & preview server for UI testing |
| **Web Production** | Docker Compose (`perfusion3d_web`) | `8080` | `80` | HTTP | Nginx serving static SPA assets and proxying `/api/` upstream to `http://api:8000/` |
| **Public Live Domain** | Production Ingress | `443` | `80` / `8080` | HTTPS | `https://perfusion.shreykansara.dev` (Cloudflare edge proxy with SSL termination) |

---

## 2. Ingress & Reverse Proxy Routing

In production, client requests flow through the following topological path:

```
[Browser / Mobile Client]
          │
          ▼ HTTPS (:443)
[Cloudflare Edge Proxy (perfusion.shreykansara.dev)]
          │
          ▼ HTTP (:80 / :8080)
[Nginx Web Container (perfusion3d_web)]
     │                           │
     │ / (SPA Static Assets)     │ /api/v1/* (Reverse Proxy)
     ▼                           ▼
[Static Files & Fonts]    [FastAPI Container (perfusion3d_api:8000)]
```

### Nginx Routing Rules (`docker/nginx.conf`):
- `/`: Serves bundled React SPA application from `/usr/share/nginx/html`.
- `/version.txt`: Serves build stamp containing `GIT_SHA`.
- `/api/`: Proxied upstream to `http://api:8000/api/` with streaming support (`proxy_buffering off`, `proxy_cache off`) to enable realtime NDJSON stage events.

---

## 3. Live Domain Diagnostics (`perfusion.shreykansara.dev`)

### 3.1 DNS & Ingress Forensics
- **Hostname**: `perfusion.shreykansara.dev`
- **DNS Resolution**: Resolves to Cloudflare CDN edge nodes (`216.24.57.18`, `216.24.57.16`).
- **SSL**: Managed automatically via Cloudflare Universal SSL.

### 3.2 Key Forensics: Groq API Key & Rate Limits
During forensic analysis of the live deployment, two critical failure modes were identified and eliminated:

1. **Missing Key in Production Container**:
   - *Symptom*: Live domain rendered "Groq API key not found. Using standard template."
   - *Cause*: Docker Compose does not automatically re-read modified `.env` files upon simple container restarts (`docker compose restart`).
   - *Resolution*: The container must be recreated with environment injection:
     ```bash
     docker compose up -d --force-recreate
     ```
   - *Security Rule*: The key is loaded strictly into memory via environment variables (`GROQ_API_KEY`) and is never committed to Git, logged, or exposed in client bundles.

2. **429 (Tokens Per Minute) Exhaustion**:
   - *Symptom*: Rapid 429 rate limit errors when generating clinician and patient reports.
   - *Cause*: The legacy engine triggered up to 12 separate multi-thousand-token LLM calls with automatic 3x retries, background `/models` polling, and double tab mounts.
   - *Resolution*:
     - **Single Unified Prompt**: Consolidates both Clinician (7 sections) and Patient (8 sections) reports into a single `<1,200` token prompt (`src/prompts/reports_combined.md`).
     - **Zero-Groq Diagnostics**: Replaced `/reports/status` polling with local configuration checks that make 0 network requests to Groq.
     - **Local Tab Switching**: Both reports return in one JSON response and are cached in `useWizardStore`, ensuring switching between Clinician and Patient report views triggers **zero** additional network calls.
     - **In-Memory Cache & Lock**: 60-minute in-memory cache and single-flight lock prevent duplicate calls for identical patient inputs.
     - **Strict Rate Limiting**: Client IP rate limiting (4 requests / 10 minutes per client IP; 30 requests / hour global).

---

## 4. Build Stamping & Image Verification

Production Docker images enforce strict provenance tracking using `ARG GIT_SHA`:

1. **Build Argument**:
   ```bash
   docker build --build-arg GIT_SHA=$(git rev-parse HEAD) -t perfusion3d:test -f Dockerfile.api .
   ```
2. **OCI Image Label**:
   ```dockerfile
   LABEL org.opencontainers.image.revision=$GIT_SHA
   ```
3. **Version Stamp Verification**:
   ```bash
   docker run --rm perfusion3d:test cat /version.txt
   ```
   Outputs the exact commit SHA matching the deployed branch.
