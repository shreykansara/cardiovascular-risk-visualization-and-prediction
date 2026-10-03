# Model Validation & Calibration Report (Ensemble Optimized)
**Track A: Cardiovascular Risk Visualization & Prediction**  
**Validation Methodology:** Stratified 5-Fold Cross-Validation with Nested Imputation/Scaling  
**Target Leakage Safeguard:** Absolute exclusion of `Cath`, `CAD`, `LAD`, `LCX`, `RCA` from feature matrix $X$.

## 1. Cross-Validation Performance Summary

| Target Head | Winning Architecture | ROC-AUC (Mean ± Std) | PR-AUC | Brier Score | Opt. Threshold | Sensitivity (Recall) | Specificity | F1-Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CAD** | `RandomForest-120 (Balanced Subsample)` | **0.923 ± 0.043** | 0.966 | 0.101 | 0.48 | **0.944** | 0.690 | 0.913 |
| **LAD** | `RandomForest-120 (Balanced Subsample)` | **0.853 ± 0.066** | 0.883 | 0.152 | 0.43 | **0.915** | 0.643 | 0.844 |
| **LCX** | `RandomForest-120 (Balanced Subsample)` | **0.735 ± 0.073** | 0.615 | 0.208 | 0.31 | **0.916** | 0.413 | 0.649 |
| **RCA** | `SoftVoting (LGBM + XGB + RF)` | **0.738 ± 0.064** | 0.627 | 0.202 | 0.29 | **0.895** | 0.455 | 0.639 |

## 2. Global Feature Attributions (Top-5 TreeSHAP)

### CAD Key Risk Drivers
1. **Typical Chest Pain 0** (Mean |SHAP|: 0.0834)
2. **Typical Chest Pain 1** (Mean |SHAP|: 0.0651)
3. **Age** (Mean |SHAP|: 0.0367)
4. **Atypical N** (Mean |SHAP|: 0.0294)
5. **Region RWMA 0** (Mean |SHAP|: 0.0287)

### LAD Key Risk Drivers
1. **Typical Chest Pain 0** (Mean |SHAP|: 0.0654)
2. **Typical Chest Pain 1** (Mean |SHAP|: 0.0497)
3. **Region RWMA 0** (Mean |SHAP|: 0.0357)
4. **EF-TTE** (Mean |SHAP|: 0.0328)
5. **Age** (Mean |SHAP|: 0.0296)

### LCX Key Risk Drivers
1. **Age** (Mean |SHAP|: 0.0452)
2. **Typical Chest Pain 0** (Mean |SHAP|: 0.0382)
3. **Typical Chest Pain 1** (Mean |SHAP|: 0.0359)
4. **PLT** (Mean |SHAP|: 0.0233)
5. **TG** (Mean |SHAP|: 0.0218)

### RCA Key Risk Drivers
1. **Typical Chest Pain 0** (Mean |SHAP|: 0.3065)
2. **DM 0** (Mean |SHAP|: 0.2777)
3. **Neut** (Mean |SHAP|: 0.2163)
4. **Age** (Mean |SHAP|: 0.2066)
5. **ESR** (Mean |SHAP|: 0.1931)

