# Perfusion3D: Spatial Hemodynamic Ischemia & Coronary Twin
> **Real-Time Spatial Coronary Digital Twin & Multi-Vessel Ischemia Telemetry**  
> *Track A: Cardiovascular Risk Visualization & Prediction — Multimodal AI Hackathon 2026*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![SaMD Category](https://img.shields.io/badge/SaMD-Class%20IIa%20Prototype-blue?style=flat-square)](#clinical-safety--regulatory-boundary)

---

## Executive Overview

**Perfusion3D** is a state-of-the-art clinical decision-support platform uniting **high-throughput multi-target machine learning**, **sub-4ms TreeSHAP explainability**, and an **interactive 3D WebGL spatial coronary digital twin**.

Rather than presenting clinicians and patients with abstract, non-localized risk numbers, Perfusion3D projects calibrated stenosis probabilities $[0.0, 1.0]$ directly onto an anatomically continuous 3D myocardial mesh. Clinicians can interactively manipulate physiological parameters, inspect vessel-specific ischemic vulnerabilities across the **LAD**, **LCX**, and **RCA**, and understand exact local feature attributions in real time.

```
                     ┌───────────────────────────────────────────────┐
                     │          Patient Clinical Parameters          │
                     │  (Demographics, Symptoms, ECG, Labs, Echo)    │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │     Strict Leakage Guard (Cath Dropped)       │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │    Perfusion3D Multi-Head Inference Engine    │
                     │    • CAD Classifier   • LAD Stenosis Head     │
                     │    • LCX Stenosis Head • RCA Stenosis Head    │
                     │    • Sub-4ms TreeSHAP Attribution Engine      │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │          Perfusion3D Clinical DLS             │
                     │  • Continuous 3D WebGL Coronary Architecture  │
                     │  • Dynamic Risk Shaders (Emerald/Amber/Red)   │
                     │  • Real-Time TreeSHAP Waterfall Telemetry     │
                     └───────────────────────────────────────────────┘
```

---

## Architectural Highlights

### 1. Multi-Target Gradient-Boosted Classification
- **4 Dedicated Binary Heads**: Independent calibrated engines predicting **CAD** (Overall Coronary Artery Disease), **LAD** (Left Anterior Descending Stenosis), **LCX** (Left Circumflex Stenosis), and **RCA** (Right Coronary Artery Stenosis).
- **Strict Target Leakage Prevention**: Ground-truth catheterization (`Cath`) and target vessel stenosis columns are strictly isolated and removed prior to feature processing.
- **Sigmoid Probability Calibration**: Outputs are rigorously mapped to empirical probabilities $P \in [0.0, 1.0]$ to drive continuous GPU shader color uniforms.

### 2. Sub-4ms TreeSHAP Explainability
- Real-time local feature attribution vectors ($\phi_i$) for every patient prediction.
- Identifies top-k physiological drivers with directional risk impact (`INCREASES_RISK` vs `DECREASES_RISK`).

### 3. Spatial Coronary Digital Twin (Three.js / WebGL)
- High-fidelity myocardial surface and solid, continuous tubular coronary conduits generated via cubic Catmull-Rom splines conforming to the atrioventricular and interventricular sulci.
- Dynamic color-mapped shader uniforms:
  - **Low Risk** ($P \le 0.40$): Emerald Green (`#10B981`)
  - **Borderline Risk** ($0.40 < P \le 0.70$): Amber (`#F59E0B`)
  - **High Risk** ($P > 0.70$): Crimson Red (`#EF4444`)
  - **Critical Stenosis** ($P > 0.75$): Dynamic pulsating emissive ischemia warning.

### 4. Perfusion3D Clinical Design Language System (DLS)
- Responsive dark-mode glassmorphic interface with reactive parameter inputs, instant debounced re-scoring (250ms), and interactive focal camera targeting.

---

## Quickstart & Local Execution

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- (Optional) Docker & Docker Compose

### Option A: Local Development Stack

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shreykansara/cardiovascular-risk-visualization-and-prediction.git
   cd cardiovascular-risk-visualization-and-prediction
   ```

2. **Install dependencies**:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. **Start the FastAPI backend**:
   ```bash
   python -m uvicorn apps.api.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

4. **Start the React frontend** (in a separate terminal):
   ```bash
   npm run dev:web
   ```
   Open `http://localhost:5173` in your browser.

---

### Option B: Production Container (Docker Compose)

Launch the unified production image hosting both the React 19 spatial frontend and FastAPI inference backend:

```bash
docker compose up --build
```

Access the application:
- **Web UI & 3D Visualizer**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`
- **OpenAPI / Swagger Docs**: `http://localhost:8000/docs`

To stop:
```bash
docker compose down
```

---

## Test Suite & Verification

Run the full automated verification test suite:

```bash
# Run backend API & inference tests (25/25 passing)
python -m pytest apps/api/tests/ -v

# Run production web build verification
npm run build:web
```

---

## Clinical Safety & Regulatory Boundary

> **IMPORTANT CLINICAL NOTICE**  
> Perfusion3D is an educational and clinical decision-support prototype (SaMD Class IIa boundary). It is designed to assist clinicians in visualizing hemodynamic risk patterns and understanding machine learning model interpretations. It is **NOT** a replacement for formal coronary angiography, computed tomography coronary angiography (CTCA), or direct physician assessment. All clinical decisions must be confirmed by qualified medical professionals.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
