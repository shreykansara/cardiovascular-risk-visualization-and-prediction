# GitHub Copilot & Coding Assistant Instructions
# Track A: Cardiovascular Risk Visualization & Prediction

These instructions apply to all code generated for this repository. Adhere strictly to the design patterns and clinical safety requirements specified below.

---

## 1. Architectural Guardrails & Invariants

1. **Strict Target Leakage Prevention**:
   - The dataset contains ground-truth catheterization (`Cath`) and coronary stenosis indicators (`LAD`, `LCX`, `RCA`, `CAD`).
   - Under no circumstances may `Cath` or any target vessel label be included in the training feature matrix $X$ or inference input schemas.
   - When generating or modifying data pipelines, ensure `StrictFeatureFilter` drops these columns and raises `DataLeakageException` if detected.

2. **Decoupled Multi-Target Modeling**:
   - We utilize 4 separate calibrated binary classification heads (`model_CAD`, `model_LAD`, `model_LCX`, `model_RCA`).
   - Probabilities must be calibrated using `CalibratedClassifierCV` (isotonic regression or Platt scaling) so that probabilities represent true empirical risk suitable for continuous 3D color mapping.

3. **TreeSHAP Explainability**:
   - For every inference prediction, compute local feature attributions using `shap.TreeExplainer`.
   - Explanations must be returned with the base value, top-k contributing features, and directional risk labels (`INCREASES_RISK` vs `DECREASES_RISK`).

4. **3D WebGL / React Three Fiber Standards**:
   - Target meshes in glTF/GLB models must be named: `vessel_LAD`, `vessel_LCX`, and `vessel_RCA`.
   - Map probabilities $[0.0, 1.0]$ to color uniforms: Green ($[0.0, 0.4]$) $\rightarrow$ Amber ($[0.4, 0.7]$) $\rightarrow$ Red ($[0.7, 1.0]$).
   - If risk $> 0.75$, add an emissive pulse effect in `useFrame`.
   - Never instantiate new Three.js objects inside `useFrame` animation loops.
   - Always call `.dispose()` on geometries and materials when components unmount.

5. **Clinical Safety & Legal Compliance**:
   - The UI must always display a visible disclaimer stating that predictions are for decision support / educational purposes only and not a substitute for clinical angiography or formal diagnostic imaging.

---

## 2. Code Style & Stack Requirements

- **Backend**: FastAPI, Python 3.11+, Pydantic v2, Scikit-Learn, LightGBM, XGBoost, SHAP.
- **Frontend**: React 19, TypeScript (strict mode, zero `any`), React Three Fiber, `@react-three/drei`, Three.js, Tailwind CSS, Zustand, TanStack Query.
- **Formatting**: PEP 8 for Python; ESLint + Prettier for TypeScript.
