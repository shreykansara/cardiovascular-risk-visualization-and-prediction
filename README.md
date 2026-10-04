# Perfusion3D: Spatial Hemodynamic Ischemia & Coronary Twin
> **Real-Time Spatial Coronary Digital Twin & Multi-Vessel Ischemia Telemetry**  
> *Track A: Cardiovascular Risk Visualization & Prediction — Multimodal AI Hackathon 2026*

[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-Ready%20(:8080)-2496ED?style=flat-square&logo=docker&logoColor=white)](#quickstart-docker-recommended)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org)
[![Groq LLM](https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-orange?style=flat-square)](https://groq.com)
[![SaMD Category](https://img.shields.io/badge/SaMD-Class%20IIa%20Prototype-blue?style=flat-square)](#clinical-safety--regulatory-boundary)

---

## Quickstart: Docker (Recommended)

To run Perfusion3D with Docker Compose in 3 simple steps:

1. **Configure Environment** (Optional: add your Groq key for LLM reports; deterministic fallback activates automatically if omitted):
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```
2. **Build and Launch Containers**:
   ```bash
   docker compose up --build
   ```
   > **Note on Environment Configuration**: `.env` must use LF line endings (no CRLF). After editing `.env`, run `docker compose up -d --force-recreate api`; a plain restart or `up` does not reload it.
3. **Open the Web Interface**:
   ```
   http://localhost:8080
   ```

*Direct FastAPI backend docs and health endpoints are accessible at `http://localhost:8000/docs` and `http://localhost:8000/api/v1/health`.*

---

## Quickstart: Local Development (Non-Docker)

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+
- Git

### 1. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI inference backend on port 8000
python -m uvicorn apps.api.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
# In a separate terminal:
npm install
npm run dev:web
```
Open **`http://localhost:5173`** in your browser.

---

## System Architecture

Perfusion3D integrates high-throughput machine learning with an interactive 3D WebGL anatomical twin and an automated clinical reporting engine:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Perfusion3D Architecture                        │
└────────────────────────────────────────────────────────────────────────┘

  [ Web Client / Nginx Container ] (:8080)
     │
     ├── /welcome         Clinical safety consent & preset selectors
     ├── /enter-data      55-feature verified clinical input catalog
     ├── /results         3D anatomical digital twin & TreeSHAP waterfalls
     ├── /reports         Clinician technical report & patient plain-language report
     └── /design-system   Clinical Design System showcase & token reference
     │
     ▼ (Reverse Proxy /api/ -> http://api:8000)
  [ FastAPI Inference Engine ] (:8000)
     │
     ├── POST /api/v1/analyze
     │    ├── Strict Leakage Guard (Cath, CAD, LAD, LCX, RCA isolated)
     │    ├── 4 Calibrated Multi-Head Gradient Boosters (CAD, LAD, LCX, RCA)
     │    └── Sub-4ms TreeSHAP Local Explainer Pool
     │
     └── POST /api/v1/reports/{technical,patient}
          ├── Groq Llama 3.3 70B Versatile Adapter
          ├── Strict Clinical Anti-Hallucination & Section Validator
          └── Zero-Downtime Deterministic Fallback Engine
```

### Container Services Topology
- **`web` (`Dockerfile.web`, port 8080)**: Production Nginx Alpine server hosting the optimized React 18 + Three.js build. Handles client-side SPA routing (`try_files $uri /index.html`) and reverse-proxies `/api/` traffic directly to the backend.
- **`api` (`Dockerfile.api`, port 8000)**: Non-root Python 3.11-slim container running Uvicorn with OpenMP support (`libgomp1`) and pre-warmed TreeSHAP explainers. Includes active Docker healthchecks (`/api/v1/health`).
- **`docker-compose.dev.yml`**: Hot-reloading development overlay with live directory volume mounts for real-time frontend and backend iteration.

---

## 4-Step Clinical Assessment Workflow

1. **Step 1: Clinical Consent & Baseline Selection (`/welcome`)**
   - Overview of the spatial digital twin.
   - Mandatory affirmative acknowledgment of clinical decision-support boundary.
   - 4 pre-configured clinical phenotypes (Low-Risk, LAD Ischemia, RCA Ischemia, Multivessel CAD).

2. **Step 2: 55-Feature Clinical Data Entry (`/enter-data`)**
   - 5 anatomical/diagnostic panels: Demographics, Clinical Examination, ECG, Laboratory, and Echocardiography.
   - Real-time physiological range bounds, non-judgmental out-of-range indicators, and completion counters.
   - Field provenance tags (`manual` | `extracted` | `unverified`).

3. **Step 3: 3D Spatial Digital Twin & TreeSHAP Drivers (`/results`)**
   - **Continuous 3D Coronary Anatomy**: Left Anterior Descending (LAD), Left Circumflex (LCX), and Right Coronary (RCA) arteries rendered with calibrated hemodynamic risk shaders.
   - **Standardized Risk Bands**:
     - **Low Risk** ($\le 40\%$): Green (`#2F7D5B`)
     - **Moderate Risk** ($41\% - 70\%$): Amber (`#C07D2B`)
     - **High Risk** ($> 70\%$): Red (`#B83A3A`)
   - **Interactive Vessel Isolation**: Clicking any vessel card or 3D pin focuses the camera rig on that arterial territory.
   - **TreeSHAP Waterfalls & Physiological Table**: Real-time breakdown of patient factors driving or mitigating ischemic risk.
   - **Model Performance Metrics**: Empirically validated cross-validation metrics (Accuracy, Precision, Recall, F1, ROC-AUC) across all 4 target heads.

4. **Step 4: Clinical & Patient AI Report Synthesis (`/reports`)**
   - **Technical Report (Clinician)**: Formatted clinical summary with 8 standardized sections, diagnostic codes, hemodynamic findings, and evidence references.
   - **Patient Report (Plain Language)**: Educational summary at Grade 6-8 reading level, avoiding alarmist terminology and explaining what the numbers mean.
   - **Groq Llama 3.3 70B Integration**: Ultra-fast synthesis with automated number validation against model predictions.
   - **Deterministic Fallback**: Automatically synthesizes verified clinical reports from model context if Groq API key is unconfigured or rate-limited.
   - **Export Tools**: Instant Print and PDF generation.

---

## 5 Validated Clinical Test Cases

Use these 5 clinical profiles to evaluate and demonstrate the platform's multi-vessel prediction accuracy:

| # | Profile Name | Patient Key | Expected Risk Band | Key Clinical Findings & Drivers |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Low-Risk Baseline** | `normal` | **Low ($\le 40\%$)** across all vessels | Age 38-45, BP 110/70, Preserved EF 60%, Normal ECG, Normal Troponin. All vessels render green. |
| **2** | **Isolated LAD Ischemia** | `high_risk_lad` | **LAD High ($> 70\%$)**, RCA/LCX Low | Age 47-58, Typical Exertional Angina, Anterior ST Elevation (V2-V4), Anterior RWMA (1), EF 45-50%. LAD turns red. |
| **3** | **Inferior RCA Ischemia** | `rca_ischemia` | **RCA Moderate/High ($41-70\%+$)** | Age 64, Atypical Angina, Inferior Wall RWMA (2), Dyslipidemia. RCA conduit displays elevated risk coloration. |
| **4** | **Triple-Vessel Critical CAD** | `triple_vessel` | **High ($> 70\%$)** on CAD, LAD, LCX, RCA | Age 72, Severe Angina, Diabetes, HTN, Diffuse ST depression/elevation, EF 35%, Multi-wall RWMA (4). Diffuse high risk. |
| **5** | **Intermediate Diagnostic Case** | Custom / Sliders | **CAD Moderate ($41-70\%$)** | Age 55-65, Dyslipidemia, borderline BP 138/88, non-anginal chest pain, normal ECG. Demonstrates calibrated threshold sensitivity. |

---

## Environment Variables & LLM Configuration

Create `.env` in the project root:

```bash
# Copy the verified template
Copy-Item .env.example .env   # PowerShell
# or: cp .env.example .env    # Bash
```

Configure `.env`:
```ini
# Groq Cloud API Key (LLM Reports)
# Obtain a key at: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_api_key_here

# Model identifier (Locked to Groq Llama 3.3 70B Versatile)
GROQ_MODEL=llama-3.3-70b-versatile

# Host and Port settings (defaults)
PORT=8000
PYTHONUNBUFFERED=1
```

> **Zero-Downtime Resilience**: If `GROQ_API_KEY` is omitted, left empty, or invalid, the backend automatically logs `"Groq API key not configured in environment. Using verified deterministic fallback template."` and serves complete, medically accurate reports without any crashes or degraded functionality.

---

## Troubleshooting

### 1. Port Conflicts (8080 or 8000 already in use)
- If port 8080 is already allocated by another service, map to another port in `docker-compose.yml`:
  ```yaml
  ports:
    - "3000:80"
  ```
- If port 8000 is occupied, stop existing processes:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
  Stop-Process -Id <PID>
  ```

### 2. Groq LLM Key Missing or Expired
- Symptom: Banner appears on `/reports` saying *"Groq API key not configured in environment. Displaying verified deterministic clinical template derived directly from model context."*
- Resolution: This is the intended graceful fallback behavior. The report displays all calibrated metrics and SHAP factors deterministically. To enable LLM prose, add a valid `GROQ_API_KEY` to `.env` and restart the backend.

### 3. Docker Daemon Not Running on Windows
- If running `docker compose up` outputs `failed to connect to the docker API at ...dockerDesktopLinuxEngine`:
  - Open **Docker Desktop** from the Windows Start menu and wait for the engine to initialize.
  - Alternatively, run locally using the quickstart instructions: `npm run dev:api` and `npm run dev:web`.

### 4. 3D Model Rendering or Canvas Black Screen
- Ensure WebGL is enabled in your browser (`chrome://gpu`).
- The 3D heart asset is statically served at `/models/heart_coronary_optimized.glb` and cached in the client bundle.

---

## Automated Verification Suite

Run the full automated test suite locally:

```bash
# 1. Run all 41 backend API, leakage guard, and report tests:
python -m pytest apps/api/tests/ -v

# 2. Run TypeScript check and Vite production build:
npm run build:web

# 3. Validate Docker container configuration:
python scripts/validate_docker_setup.py

# 4. Run End-to-End Playwright flow:
node e2e/full_flow.spec.cjs
```

---

## Clinical Safety & Regulatory Boundary

> **IMPORTANT CLINICAL NOTICE**  
> *"Predictions are for decision-support and educational purposes only and are not a substitute for formal diagnostic imaging or professional medical evaluation."*  
> Perfusion3D does NOT diagnose, treat, or replace professional cardiovascular examination or invasive coronary angiography (Cath). All predictions represent statistical machine-learning estimates based on training cohorts.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
