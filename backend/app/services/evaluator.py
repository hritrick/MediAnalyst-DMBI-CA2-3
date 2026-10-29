import uuid
import json
import logging
import joblib
import numpy as np
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from fastapi import HTTPException

from app.config import settings
from app.schemas.requests import AnalysisRequest
from app.schemas.responses import (
    AnalysisResponse, ModelEvaluationResult, HeartDiseaseNotebookAdapterResults, PredictionResponse
)
from app.services.loader import load_dataset_as_dataframe
from app.services.preprocessing import build_pipeline
from app.models.classification import train_classification_suite
from app.models.regression import train_regression_suite
from app.models.clustering import train_clustering_suite
from app.adapters.heart_disease import run_heart_disease_specialized_analysis

logger = logging.getLogger(__name__)

# Storage for executed analyses
ANALYSES_DIR = settings.BASE_DIR / "analyses_storage"
ANALYSES_DIR.mkdir(parents=True, exist_ok=True)

ACTIVE_BUNDLES: Dict[str, Dict[str, Any]] = {}

def get_bundle_path(analysis_id: str) -> Path:
    return ANALYSES_DIR / f"{analysis_id}.bundle.joblib"

def save_bundle(analysis_id: str, bundle: Dict[str, Any]):
    ACTIVE_BUNDLES[analysis_id] = bundle
    p = get_bundle_path(analysis_id)
    try:
        joblib.dump(bundle, p)
    except Exception as e:
        logger.warning(f"Could not persist model bundle to disk: {e}")

def load_bundle(analysis_id: str) -> Dict[str, Any]:
    if analysis_id in ACTIVE_BUNDLES:
        return ACTIVE_BUNDLES[analysis_id]
    p = get_bundle_path(analysis_id)
    if p.exists():
        try:
            bundle = joblib.load(p)
            ACTIVE_BUNDLES[analysis_id] = bundle
            return bundle
        except Exception as e:
            logger.error(f"Failed to load bundle {p}: {e}")
    raise HTTPException(status_code=404, detail=f"No active trained model bundle found for analysis '{analysis_id}'.")

def save_analysis(analysis_id: str, data: Dict[str, Any]):
    p = ANALYSES_DIR / f"{analysis_id}.json"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def load_analysis(analysis_id: str) -> Dict[str, Any]:
    p = ANALYSES_DIR / f"{analysis_id}.json"
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def run_dataset_analysis(dataset_id: str, req: AnalysisRequest) -> AnalysisResponse:
    df = load_dataset_as_dataframe(dataset_id)
    analysis_id = str(uuid.uuid4())[:8]
    created_at = datetime.now(timezone.utc).isoformat()
    
    # Preprocess dataset
    preprocessed = build_pipeline(
        df=df,
        target_column=req.target_column,
        feature_columns=req.feature_columns,
        excluded_columns=req.excluded_columns,
        task_type=req.task_type,
        test_size=req.test_size,
        random_state=req.random_state,
        stratify=req.stratify,
        imputer_strategy=req.imputer_strategy,
        scaler_type=req.scaler,
        target_binarize=bool(req.target_binarize)
    )

    model_results: Dict[str, ModelEvaluationResult] = {}
    comparison_table = []
    best_model = None
    interpretation = ""
    clinical_rec = None
    warnings = []
    if preprocessed.summary.get("dropped_identifiers"):
        dropped_ids = preprocessed.summary["dropped_identifiers"]
        warnings.append(f"Excluded identifier column(s) {dropped_ids} from predictor set to prevent identity leakage.")

    fitted_models = {}
    if req.task_type == "classification":
        model_results, fitted_models = train_classification_suite(
            X_train=preprocessed.X_train,
            X_test=preprocessed.X_test,
            y_train=preprocessed.y_train,
            y_test=preprocessed.y_test,
            feature_names=preprocessed.feature_names,
            selected_models=req.models,
            random_state=req.random_state,
            target_labels=preprocessed.target_labels,
            threshold_goal=req.target_precision_goal or 0.80,
            return_models=True
        )
        
        # Build comparison table
        for m_name, res in model_results.items():
            row = {"Model": m_name, **res.formatted_metrics, "Training Time": f"{res.training_time_ms} ms"}
            comparison_table.append(row)
            
        # Select best model based on F1-score (or ROC-AUC if tied)
        best_f1 = -1.0
        best_name = None
        for m_name, res in model_results.items():
            f1 = res.metrics.get("F1-score", 0.0)
            if f1 > best_f1:
                best_f1 = f1
                best_name = m_name
                
        if best_name:
            best_model = {
                "name": best_name,
                "primary_metric": "F1-score",
                "score": round(best_f1, 4),
                "accuracy": round(model_results[best_name].metrics.get("Accuracy", 0.0), 4)
            }
            
        # Scientific Interpretation
        rf_res = model_results.get("Random Forest")
        dt_res = model_results.get("Decision Tree")
        lr_res = model_results.get("Logistic Regression")
        
        notes = []
        if rf_res and dt_res:
            diff = (rf_res.metrics.get("F1-score", 0) - dt_res.metrics.get("F1-score", 0)) * 100
            notes.append(
                f"Ensemble Random Forest achieved {rf_res.formatted_metrics.get('F1-score')} F1-score "
                f"({abs(diff):.1f}% {'higher' if diff >= 0 else 'lower'} than single Decision Tree), "
                "reducing test-set variance across bagged bootstrap samples."
            )
        if lr_res:
            notes.append(
                f"Logistic Regression provides a linear baseline with {lr_res.formatted_metrics.get('Accuracy')} accuracy, "
                "offering interpretable log-odds coefficients for clinical factor auditing."
            )
        if dt_res:
            notes.append(
                "The Decision Tree yields transparent rule splits (max_depth=4) suitable for clinical audit trail and bedside triage."
            )
        interpretation = " ".join(notes)
        clinical_rec = (
            "Model predictions must be interpreted as statistical risk indicators alongside clinician evaluation. "
            "In high-acuity screening, decision thresholds should be calibrated to avoid false negatives."
        )

    elif req.task_type == "regression":
        model_results, fitted_models = train_regression_suite(
            X_train=preprocessed.X_train,
            X_test=preprocessed.X_test,
            y_train=preprocessed.y_train,
            y_test=preprocessed.y_test,
            feature_names=preprocessed.feature_names,
            selected_models=req.models,
            random_state=req.random_state,
            return_models=True
        )
        
        for m_name, res in model_results.items():
            row = {"Model": m_name, **res.formatted_metrics, "Training Time": f"{res.training_time_ms} ms"}
            comparison_table.append(row)
            
        # Select best model based on lowest RMSE
        best_rmse = float("inf")
        best_name = None
        for m_name, res in model_results.items():
            rmse = res.metrics.get("RMSE", float("inf"))
            if rmse < best_rmse:
                best_rmse = rmse
                best_name = m_name
                
        if best_name:
            best_model = {
                "name": best_name,
                "primary_metric": "RMSE",
                "score": round(best_rmse, 3),
                "r2": round(model_results[best_name].metrics.get("R-squared", 0.0), 4)
            }
        interpretation = (
            f"Regression evaluation shows {best_name} yields the lowest prediction deviation with RMSE = {best_rmse:.3f}. "
            "Residual patterns should be checked for homoscedasticity across the measurement scale."
        )

    elif req.task_type == "clustering":
        model_results = train_clustering_suite(
            X=preprocessed.X_train,
            feature_names=preprocessed.feature_names,
            selected_models=req.models,
            random_state=req.random_state
        )
        
        for m_name, res in model_results.items():
            row = {"Model": m_name, **res.formatted_metrics, "Training Time": f"{res.training_time_ms} ms"}
            comparison_table.append(row)
            
        best_sil = -2.0
        best_name = None
        for m_name, res in model_results.items():
            sil = res.metrics.get("Silhouette Score", -2.0)
            if sil > best_sil:
                best_sil = sil
                best_name = m_name
                
        if best_name:
            best_model = {
                "name": best_name,
                "primary_metric": "Silhouette Score",
                "score": round(best_sil, 4)
            }
        interpretation = (
            f"Unsupervised clustering separated samples with a silhouette coefficient of {best_sil:.3f} using {best_name}. "
            "Clusters correspond to exploratory patient phenotypic subgroups."
        )

    # Check for Heart Disease adapter
    hd_adapter_results = run_heart_disease_specialized_analysis(df)

    response = AnalysisResponse(
        analysis_id=analysis_id,
        dataset_id=dataset_id,
        task_type=req.task_type,
        target_column=req.target_column,
        created_at=created_at,
        dataset_summary=preprocessed.summary,
        model_results=model_results,
        comparison_table=comparison_table,
        best_model=best_model,
        interpretation=interpretation,
        clinical_recommendation=clinical_rec,
        warnings=warnings,
        heart_disease_adapter=hd_adapter_results
    )

    # Save to disk for reporting
    save_analysis(analysis_id, response.model_dump())

    # Save active model bundle for live predictions
    opt_thresh = 0.50
    if req.task_type == "classification":
        for m_res in model_results.values():
            if m_res.threshold_analysis and "optimal_threshold" in m_res.threshold_analysis:
                opt_thresh = float(m_res.threshold_analysis["optimal_threshold"])
                break

    bundle = {
        "analysis_id": analysis_id,
        "dataset_id": dataset_id,
        "task_type": req.task_type,
        "target_column": req.target_column,
        "target_labels": preprocessed.target_labels,
        "preprocessor": preprocessed.preprocessor,
        "fitted_models": fitted_models,
        "original_features": preprocessed.summary.get("feature_columns", []),
        "numeric_features": preprocessed.summary.get("numeric_features", []),
        "categorical_features": preprocessed.summary.get("categorical_features", []),
        "optimal_threshold": opt_thresh
    }
    save_bundle(analysis_id, bundle)

    return response

def predict_with_analysis(analysis_id: str, model_name: Optional[str], inputs: Dict[str, Any]) -> PredictionResponse:
    bundle = load_bundle(analysis_id)
    fitted_models = bundle.get("fitted_models", {})
    if not fitted_models:
        raise HTTPException(status_code=400, detail="No trained models available in this analysis bundle for prediction.")

    # Pick chosen model
    chosen_model = None
    chosen_name = None
    if model_name and model_name in fitted_models:
        chosen_name = model_name
        chosen_model = fitted_models[model_name]
    else:
        if "Random Forest" in fitted_models:
            chosen_name = "Random Forest"
            chosen_model = fitted_models["Random Forest"]
        elif "Logistic Regression" in fitted_models:
            chosen_name = "Logistic Regression"
            chosen_model = fitted_models["Logistic Regression"]
        else:
            chosen_name = list(fitted_models.keys())[0]
            chosen_model = fitted_models[chosen_name]

    orig_cols = bundle.get("original_features", [])
    preprocessor = bundle["preprocessor"]
    task_type = bundle.get("task_type", "classification")
    target_labels = bundle.get("target_labels") or ["Absence (0)", "Presence (1)"]

    # Build 1-row DataFrame matching the exact original features
    row_data = {}
    for col in orig_cols:
        val = inputs.get(col)
        if col in bundle.get("numeric_features", []):
            try:
                row_data[col] = float(val) if val is not None and str(val).strip() != "" else np.nan
            except (ValueError, TypeError):
                row_data[col] = np.nan
        else:
            row_data[col] = str(val) if val is not None else np.nan

    df_single = pd.DataFrame([row_data], columns=orig_cols)
    try:
        X_trans = preprocessor.transform(df_single)
    except Exception as e:
        logger.error(f"Preprocessor transform failed: {e}")
        raise HTTPException(status_code=400, detail=f"Input transformation error: {str(e)}")

    if task_type == "classification":
        pred_idx = int(chosen_model.predict(X_trans)[0])
        pred_label = target_labels[pred_idx] if pred_idx < len(target_labels) else f"Class {pred_idx}"

        prob = None
        prob_str = None
        risk_tier = "Moderate Risk"
        risk_color = "warning"
        rec = "Patient biometrics evaluate to an intermediate clinical boundary."

        opt_thresh = bundle.get("optimal_threshold") or 0.35

        if hasattr(chosen_model, "predict_proba"):
            probas = chosen_model.predict_proba(X_trans)[0]
            prob = float(probas[1]) if len(probas) > 1 else float(probas[0])
            prob_str = f"{prob * 100:.1f}%"

            if prob >= 0.65:
                risk_tier = "High Risk"
                risk_color = "danger"
                rec = "High disease probability (≥65%). Immediate cardiology specialist referral and prioritized diagnostic workup recommended."
            elif prob >= opt_thresh:
                risk_tier = "Moderate Risk"
                risk_color = "warning"
                rec = f"Moderate disease probability (≥{opt_thresh*100:.1f}% clinical threshold). Secondary non-invasive monitoring (stress test/echo) recommended."
            else:
                risk_tier = "Low Risk"
                risk_color = "success"
                rec = "Low disease probability below clinical risk threshold. Cleared for routine outpatient lifestyle care and annual follow-up."
        else:
            if pred_idx == 1:
                risk_tier = "High Risk"
                risk_color = "danger"
                rec = "Positive class indicated by decision rule path. Diagnostic confirmation recommended."
            else:
                risk_tier = "Low Risk"
                risk_color = "success"
                rec = "Negative class indicated by decision rule path."

        return PredictionResponse(
            analysis_id=analysis_id,
            model_name=chosen_name,
            task_type=task_type,
            prediction=pred_idx,
            prediction_label=pred_label,
            probability=round(prob, 4) if prob is not None else None,
            probability_formatted=prob_str,
            risk_tier=risk_tier,
            risk_color=risk_color,
            recommendation=rec,
            inputs_evaluated=inputs
        )
    else:
        pred_val = float(chosen_model.predict(X_trans)[0])
        return PredictionResponse(
            analysis_id=analysis_id,
            model_name=chosen_name,
            task_type=task_type,
            prediction=round(pred_val, 4),
            prediction_label=f"Predicted Value: {round(pred_val, 3)}",
            recommendation="Continuous biomarker value predicted using the trained regression model.",
            inputs_evaluated=inputs
        )
