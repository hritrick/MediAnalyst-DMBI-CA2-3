import uuid
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from fastapi import HTTPException

from app.config import settings
from app.schemas.requests import AnalysisRequest
from app.schemas.responses import (
    AnalysisResponse, ModelEvaluationResult, HeartDiseaseNotebookAdapterResults
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

    if req.task_type == "classification":
        model_results = train_classification_suite(
            X_train=preprocessed.X_train,
            X_test=preprocessed.X_test,
            y_train=preprocessed.y_train,
            y_test=preprocessed.y_test,
            feature_names=preprocessed.feature_names,
            selected_models=req.models,
            random_state=req.random_state,
            target_labels=preprocessed.target_labels,
            threshold_goal=req.target_precision_goal or 0.80
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
        model_results = train_regression_suite(
            X_train=preprocessed.X_train,
            X_test=preprocessed.X_test,
            y_train=preprocessed.y_train,
            y_test=preprocessed.y_test,
            feature_names=preprocessed.feature_names,
            selected_models=req.models,
            random_state=req.random_state
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
    return response
