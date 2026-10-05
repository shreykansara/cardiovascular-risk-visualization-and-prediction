# ==============================================================================
# Multi-Stage Production Dockerfile: Perfusion3D
# Multimodal AI Hackathon 2026 - Track A: Cardiovascular Risk Platform
# ==============================================================================

# --- Stage 1: Build React 19 + Three.js WebGL Frontend ---
FROM node:20-slim AS builder-web
WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and build production bundle
COPY apps/web ./apps/web
RUN npm run build:web

# --- Stage 2: Production Python Runtime ---
FROM python:3.11-slim AS runner
WORKDIR /app

# Install system dependencies:
# - libgomp1: required by LightGBM OpenMP runtime
# - curl: for container healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, ML model artifacts, data, and reports
COPY apps/api ./apps/api
COPY models ./models
COPY data/processed ./data/processed
COPY reports ./reports

# Copy built frontend SPA assets from Stage 1
COPY --from=builder-web /app/apps/web/dist ./apps/web/dist

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# Container health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

EXPOSE 8000

# Start Uvicorn serving both API and static WebGL frontend
CMD ["sh", "-c", "uvicorn apps.api.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
