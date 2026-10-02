# Operational Skills & Execution Runbooks
**Track A: Multimodal AI Hackathon 2026**
**Document Version:** 1.0.0 | **Status:** Approved Execution Recipes

---

## 1. Overview of Operational Skills

This document defines the production recipes, operational runbooks, and automation scripts required to execute all phases of the Cardiovascular Risk Visualization & Prediction system. Each skill can be executed directly by human developers or orchestrated by autonomous coding agents.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE OPERATIONAL RECIPES                        │
├───────────────────────────────┬────────────────────────────────────────┤
│ Skill Name                    │ Primary Purpose                        │
├───────────────────────────────┼────────────────────────────────────────┤
│ preprocess_and_validate_data  │ ETL, categorical encoding, leakage ban │
│ train_and_export_models       │ 5-fold CV, 4-target training, TreeSHAP │
│ inspect_and_optimize_mesh     │ 3D glTF node rigging & Draco compress  │
│ run_local_stack               │ Single-command local dev orchestration │
└───────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. Skill: `preprocess_and_validate_data`

### 2.1 Description & Objectives
Ingests the raw UCI Extension of Z-Alizadeh Sani dataset (`data/raw/z_alizadeh_sani.csv`), separates input features $X$ from target labels $y = [\text{CAD}, \text{LAD}, \text{LCX}, \text{RCA}]$, strictly excludes invasive angiography features (`Cath`), performs clinical sanity checks, and exports clean Parquet feature matrices and metadata.

### 2.2 Execution Command
```bash
python scripts/preprocess.py \
  --input-path data/raw/z_alizadeh_sani.csv \
  --output-dir data/processed \
  --strict-leakage-check \
  --export-metadata
```

### 2.3 Step-by-Step Procedure
1. **Raw Ingestion**: Load CSV into pandas DataFrame. Standardize column names (strip whitespace, lowercase conversion for internal checks, preserve medical case for display).
2. **Target Isolation**:
   - Extract `CAD` (Binary: 1 for CAD, 0 for Normal).
   - Extract `LAD` (Binary: 1 for Stenosis $\ge 50\%$, 0 for Normal).
   - Extract `LCX` (Binary: 1 for Stenosis $\ge 50\%$, 0 for Normal).
   - Extract `RCA` (Binary: 1 for Stenosis $\ge 50\%$, 0 for Normal).
3. **Strict Leakage Guard Enforcement**:
   - Check for existence of forbidden tokens: `cath`, `catheterization`, `stenosis`, `target`.
   - Explicitly drop `Cath` from the candidate feature list.
   - Assert that no target column exists in $X$:
     ```python
     forbidden = {"cath", "cad", "lad", "lcx", "rca"}
     found = [col for col in X.columns if col.lower() in forbidden]
     assert len(found) == 0, f"FATAL DATA LEAKAGE: Found {found} in feature matrix X!"
     ```
4. **Physiological Sanity Audit**:
   - Check Age: $[20, 100]$.
   - Check Systolic BP: $[60, 260]$.
   - Check Ejection Fraction: $[10, 80]$.
   - Check BMI: $[12, 60]$.
5. **Metadata Generation**:
   - Generate `data/processed/feature_metadata.json` containing:
     - Numerical feature list, medians, IQRs, min/max bounds.
     - Categorical feature list and unique permissible levels.
     - Target class distributions (positive/negative counts).
6. **Parquet Export**: Write `X_features.parquet` and `y_targets.parquet`.

### 2.4 Expected Artifacts
- `data/processed/X_features.parquet`
- `data/processed/y_targets.parquet`
- `data/processed/feature_metadata.json`

### 2.5 Failure Recovery
- **If `AssertionError: FATAL DATA LEAKAGE` triggers**: Inspect raw dataset headers for newly added angiography columns. Add them to `FORBIDDEN_COLUMNS` in `scripts/preprocess.py`.
- **If missing values exceed 20% in any column**: Ensure continuous columns use median imputation and categorical use mode; log warning in `preprocess.log`.

---

## 3. Skill: `train_and_export_models`

### 3.1 Description & Objectives
Trains four separate calibrated binary classification models (Overall CAD, LAD Stenosis, LCX Stenosis, RCA Stenosis) using Stratified 5-Fold Cross-Validation. Evaluates ROC-AUC, PR-AUC, F1-Score, Balanced Accuracy, and Brier Score. Fits probability calibrators and compiles TreeSHAP explainers, exporting all artifacts to `models/`.

### 3.2 Execution Command
```bash
python scripts/train.py \
  --data-dir data/processed \
  --models-dir models \
  --cv-folds 5 \
  --calibrate isotonic \
  --compute-shap \
  --export-metrics reports/validation_metrics.json
```

### 3.3 Step-by-Step Procedure
1. **Load Processed Parquets**: Ingest `X_features.parquet` and `y_targets.parquet`.
2. **Build Preprocessing Transformer**:
   - `ColumnTransformer` with `RobustScaler` for continuous features and `OneHotEncoder(handle_unknown='ignore')` for categorical features.
   - Fit transformer exclusively on training splits during CV.
3. **Cross-Validation Training Loop**:
   - For each target $t \in \{\text{CAD}, \text{LAD}, \text{LCX}, \text{RCA}\}$:
     - Instantiate `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`.
     - Compute `scale_pos_weight = (y == 0).sum() / (y == 1).sum()`.
     - Train candidate estimators: LightGBM, XGBoost, and Scikit-Learn Random Forest.
     - Select best booster based on ROC-AUC and Sensitivity.
     - Apply `CalibratedClassifierCV(estimator=best_model, method='isotonic', cv=3)`.
     - Record validation fold predictions and compute Brier score, ROC-AUC, Sensitivity, Specificity, F1.
4. **Final Model Retraining**:
   - Fit the full preprocessor and calibrated classifiers on the complete dataset.
5. **TreeSHAP Explainer Generation**:
   - Fit `shap.TreeExplainer(model.calibrated_classifiers_[0].estimator)` for each target.
   - Verify local attribution computation speed ($< 15\text{ ms}$ per sample).
6. **Serialization & Metric Report**:
   - Export `.joblib` checkpoints: `cad_model.joblib`, `lad_model.joblib`, `lcx_model.joblib`, `rca_model.joblib`, `preprocessor.joblib`, `shap_explainers.joblib`.
   - Export `reports/validation_metrics.json` and `models/model_metadata.json`.

### 3.4 Expected Artifacts
- `models/cad_model.joblib`
- `models/lad_model.joblib`
- `models/lcx_model.joblib`
- `models/rca_model.joblib`
- `models/preprocessor.joblib`
- `models/shap_explainers.joblib`
- `models/model_metadata.json`
- `reports/validation_metrics.json`

### 3.5 Failure Recovery
- **If ROC-AUC on LAD is below 0.80**: Increase tree depth from 4 to 6, tune `learning_rate` to 0.03, and verify that `Region with RWMA` and ECG ST elevation features are properly encoded.
- **If calibration degrades Brier score**: Switch `--calibrate` method from `isotonic` to `sigmoid` (Platt scaling is less prone to overfitting on small sample sizes $N=303$).

---

## 4. Skill: `inspect_and_optimize_mesh`

### 4.1 Description & Objectives
Inspects anatomical glTF/GLB models to verify proper node hierarchy and naming conventions (`vessel_LAD`, `vessel_LCX`, `vessel_RCA`), applies Draco geometry compression, eliminates redundant material slots, and exports web-optimized assets to the frontend public directory.

### 4.2 Execution Command
```bash
# Node.js glTF-Transform Pipeline
node scripts/optimize_mesh.mjs \
  --input assets/3d/raw/heart_anatomy_source.gltf \
  --output assets/3d/optimized/heart_coronary_optimized.glb \
  --target-dir apps/web/public/models \
  --draco \
  --verify-nodes vessel_LAD,vessel_LCX,vessel_RCA
```

### 4.3 Step-by-Step Procedure
1. **Scene Graph Inspection**:
   - Read glTF node hierarchy using `@gltf-transform/core`.
   - Print all node names and mesh primitives.
   - Assert presence of target vessel meshes:
     - `vessel_LAD` (Left Anterior Descending Artery)
     - `vessel_LCX` (Left Circumflex Artery)
     - `vessel_RCA` (Right Coronary Artery)
     - `myocardium` (Heart muscle body)
2. **Semantic Renaming & Re-parenting**:
   - If source model names differ (e.g. `Mesh_001_coronary_left`), rename to standardized identifiers `vessel_LAD`, etc.
3. **Geometry Optimization**:
   - Deduplicate shared vertex buffers (`dedup`).
   - Reorder vertex cache for GPU rendering (`vertex-cache`).
   - Prune unused materials, accessors, and animations (`prune`).
4. **Draco Compression**:
   - Apply Draco mesh compression (compression level 7).
   - Verify output file size $< 5\text{ MB}$.
5. **Asset Deployment**:
   - Copy optimized `.glb` to `apps/web/public/models/heart_coronary_optimized.glb`.
   - Generate `assets/3d/optimized/mesh_manifest.json` containing vertex counts, bounding boxes, and material indices.

### 4.4 Expected Artifacts
- `assets/3d/optimized/heart_coronary_optimized.glb`
- `assets/3d/optimized/mesh_manifest.json`
- `apps/web/public/models/heart_coronary_optimized.glb`

### 4.5 Failure Recovery
- **If missing vessel nodes**: Open the model in Blender, split the coronary tree into three distinct vertex groups (`vessel_LAD`, `vessel_LCX`, `vessel_RCA`), export as glTF 2.0 with "Custom Properties" enabled, and re-run optimization.
- **If Draco decompression fails in browser**: Ensure `@react-three/drei`'s `useGLTF` points to the correct Google Draco decoder CDN or public local `/draco/` worker path.

---

## 5. Skill: `run_local_stack`

### 5.1 Description & Objectives
Orchestrates the local development environment, spinning up the FastAPI inference backend (port 8000) and the React 19 + React Three Fiber frontend (port 5173) with hot reloading and environment verification.

### 5.2 Execution Commands

#### Option A: Unified Full-Stack Launch (Root)
```bash
npm run dev
```

#### Option B: Decoupled Service Execution

**Terminal 1 — FastAPI Inference Backend**:
```bash
# Activate Python Virtual Environment
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
cd apps/api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — React 19 + Vite 3D Web Visualizer**:
```bash
cd apps/web
npm run dev
```

### 5.3 Step-by-Step Procedure
1. **Environment Sanity Check**:
   - Check Python version: $\ge 3.11$.
   - Verify `models/*.joblib` exist; if absent, automatically trigger `python scripts/train.py`.
   - Check Node.js version: $\ge 20.0$.
   - Check port availability for 8000 and 5173.
2. **Backend Spin-up**:
   - FastAPI initializes, loads `.joblib` models and SHAP explainers into memory.
   - Healthcheck `/api/v1/health` reports status `READY`.
3. **Frontend Spin-up**:
   - Vite builds module graph with HMR enabled.
   - React Three Fiber Canvas loads `heart_coronary_optimized.glb`.
   - Browser displays clinical dashboard at `http://localhost:5173`.
4. **End-to-End Handshake**:
   - Web application issues an initial inference probe to `http://localhost:8000/api/v1/predict` using default patient baseline parameters.
   - Risk gauges and 3D vessel colors update reactively.

### 5.4 Expected Outputs & Verification
- Swagger API Docs accessible at `http://localhost:8000/docs`.
- Web Visualizer accessible at `http://localhost:5173`.
- Console outputs show:
  ```
  [INFO] FastAPI: 4 model heads and TreeSHAP explainers loaded successfully.
  [INFO] Vite: Local development server running at http://localhost:5173/
  [INFO] WebGL: Heart mesh loaded with nodes [vessel_LAD, vessel_LCX, vessel_RCA].
  ```

### 5.5 Failure Recovery
- **Port Conflict (Port 8000 or 5173 in use)**:
  ```bash
  # Windows Powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
  # Unix / macOS
  lsof -ti:8000 | xargs kill -9
  ```
- **CORS Network Error**: Confirm `apps/api/app/main.py` contains `CORSMiddleware` with `allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]`.
