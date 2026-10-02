# Perfusion3D Deployment Guide
**Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Visualization & Prediction**

Perfusion3D is packaged as an **All-in-One Multi-Stage Docker Container** uniting the React 19 + Three.js WebGL spatial frontend and the FastAPI + TreeSHAP machine learning inference engine into a single unified service with zero CORS complexity.

---

## Architecture Summary

- **Single URL**: The web application and REST API are served together from one host and port.
  - `/`: React 19 + Three.js WebGL Spatial Clinical Dashboard
  - `/models/...`: Static 3D anatomical digital twin assets (`heart_coronary_optimized.glb`)
  - `/api/v1/...`: FastAPI machine learning endpoints (inference, local TreeSHAP explanations)
  - `/health`: Container health check & readiness probe
  - `/docs`: Interactive OpenAPI / Swagger documentation
- **Zero Target Leakage**: Validated models (`cad`, `lad`, `lcx`, `rca`) are embedded into the container image (`models/`).

---

## Option 1: Deploy on Render (Recommended Free Cloud Hosting)

Render provides free hosting with automatic continuous deployment from your GitHub repository.

### Step-by-Step:
1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Navigate to [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository: `cardiovascular-risk-visualization-and-prediction`.
5. Render will automatically detect the `Dockerfile` and `render.yaml`.
6. Configure:
   - **Environment**: `Docker`
   - **Branch**: `main`
   - **Plan**: `Free`
   - **Health Check Path**: `/health`
7. Click **Create Web Service**.
8. In ~3 minutes, your live URL will be active (e.g., `https://perfusion3d-app.onrender.com`).

---

## Option 2: Deploy on Railway

Railway offers frictionless Docker container deployments with automatic SSL.

### Step-by-Step:
1. Go to [railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Railway will automatically detect the `Dockerfile` and `railway.json`.
5. Once built, go to **Settings** -> **Networking** -> click **Generate Domain** to get your public HTTPS URL.

---

## Option 3: Deploy on Hugging Face Spaces (Free Community GPU/CPU)

Hugging Face Spaces provides permanent free hosting for ML applications.

### Step-by-Step:
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Name your space (e.g., `perfusion3d-app`).
3. Select **Docker** as the Space SDK (Blank template).
4. Clone the Hugging Face repo or set this GitHub repo as a remote:
   ```bash
   git remote add hf https://huggingface.co/spaces/YOUR_USERNAME/perfusion3d-app
   git push hf main
   ```
5. Hugging Face builds the Docker container and exposes port `7860` automatically (or respects `PORT=7860`).

---

## Option 4: Deploy on Google Cloud Run (Serverless Production)

For enterprise-grade auto-scaling on Google Cloud:

```bash
# 1. Build and tag the image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/perfusion3d-app

# 2. Deploy to Cloud Run
gcloud run deploy perfusion3d-app \
  --image gcr.io/YOUR_PROJECT_ID/perfusion3d-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 8000
```

---

## Option 5: Local Production Container (Docker / Docker Compose)

To test the production container locally on your machine:

```bash
# Build and launch using Docker Compose
docker compose up --build
```

Access the application at:
- **Web UI**: `http://localhost:8000`
- **Health Probe**: `http://localhost:8000/health`
- **API Documentation**: `http://localhost:8000/docs`

To stop:
```bash
docker compose down
```

---

## Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | Port for the Uvicorn server (automatically injected by Render, Railway, Cloud Run). |
| `PYTHONUNBUFFERED` | `1` | Ensures real-time console log streaming without buffering. |
| `DEBUG` | `False` | Enables verbose debug mode when set to `True`. |
