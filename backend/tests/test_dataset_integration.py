import json
import hashlib
from pathlib import Path
import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services.catalog import get_dataset_catalog, load_catalog_dataset
from app.services.loader import load_dataset_as_dataframe, load_metadata
from app.services.profiler import profile_dataframe
from app.services.recommender import generate_recommendations
from app.services.preprocessing import build_pipeline
from app.services.evaluator import run_dataset_analysis
from app.schemas.requests import AnalysisRequest

client = TestClient(app)

def test_download_manifest_and_checksum_integrity():
    """Verify that download_manifest.json exists and sha256 checksums match real files."""
    assert settings.MANIFEST_PATH.exists(), "Download manifest must exist"
    with open(settings.MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert "datasets" in manifest
    datasets = manifest["datasets"]
    
    expected_datasets = [
        "heart_disease", "diabetes", "breast_cancer",
        "kidney_disease", "maternal_health"
    ]
    for name in expected_datasets:
        assert name in datasets, f"Dataset '{name}' must be in download manifest"
        entry = datasets[name]
        assert entry["status"] == "verified"
        assert entry["raw_sha256"] is not None
        assert entry["processed_sha256"] is not None

        # Check that processed file exists on disk and verify its sha256
        proc_path = settings.ROOT_DIR / entry["processed_file"]
        assert proc_path.exists(), f"Processed file {proc_path} must exist"
        h = hashlib.sha256()
        with open(proc_path, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        assert h.hexdigest() == entry["processed_sha256"], f"Checksum mismatch for {name}"

def test_catalog_endpoint_metadata():
    """Test GET /api/datasets/catalog returns all verified datasets with real properties."""
    res = client.get("/api/datasets/catalog")
    assert res.status_code == 200
    catalog = res.json()
    assert len(catalog) == 5

    catalog_map = {item["id"]: item for item in catalog}
    
    # Verify Heart Disease
    hd = catalog_map["heart-disease"]
    assert hd["name"] == "UCI Cleveland Heart Disease"
    assert hd["domain"] == "Cardiology"
    assert hd["row_count"] == 303
    assert hd["column_count"] >= 14
    assert hd["status"] == "ready"
    assert hd["is_dmbi_benchmark"] is True
    assert "target_binary" in hd["target_candidates"]

    # Verify Breast Cancer
    bc = catalog_map["breast-cancer-wisconsin"]
    assert bc["domain"] == "Oncology"
    assert bc["row_count"] == 569
    assert bc["column_count"] == 32
    assert "ID" in bc.get("identifier_columns", [])
    assert bc["default_target"] == "Diagnosis"

    # Verify Kidney Disease
    kd = catalog_map["chronic-kidney-disease"]
    assert kd["domain"] == "Nephrology"
    assert kd["row_count"] == 400
    assert kd["column_count"] == 25
    assert kd["has_missing_values"] is True
    assert kd["default_target"] == "class"

    # Verify Maternal Health
    mh = catalog_map["maternal-health-risk"]
    assert mh["domain"] == "Obstetrics & Maternal Health"
    assert mh["row_count"] == 1014
    assert mh["column_count"] == 7
    assert mh["supports_multiclass"] is True
    assert mh["default_target"] == "RiskLevel"

    # Verify CDC Diabetes
    diab = catalog_map["cdc-diabetes"]
    assert diab["row_count"] == 253680
    assert diab["column_count"] == 23
    assert diab["default_target"] == "Diabetes_binary"

def test_catalog_dataset_loading_api():
    """Test POST /api/datasets/catalog/{id}/load loads files and metadata."""
    res = client.post("/api/datasets/catalog/breast-cancer-wisconsin/load")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_id"] == "breast-cancer-wisconsin"
    assert data["row_count"] == 569
    assert data["column_count"] == 32

    # Verify that profile endpoint now works
    prof_res = client.get("/api/datasets/breast-cancer-wisconsin/profile")
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["row_count"] == 569

def test_heart_disease_binary_and_multiclass_classification():
    """
    Test Cleveland Heart Disease:
    1. Binary classification on target_binary (matching notebook)
    2. Multiclass classification on original num (0, 1, 2, 3, 4)
    3. Specialized notebook adapter results
    """
    load_catalog_dataset("heart-disease")

    # 1. Binary classification
    req_bin = AnalysisRequest(
        task_type="classification",
        target_column="target_binary",
        models=["Logistic Regression", "Decision Tree", "Random Forest"],
        random_state=42
    )
    res_bin = run_dataset_analysis("heart-disease", req_bin)
    assert res_bin.model_results["Logistic Regression"].metrics["Accuracy"] > 0.80
    assert res_bin.model_results["Random Forest"].metrics["F1-score"] > 0.80
    assert res_bin.heart_disease_adapter is not None
    assert len(res_bin.heart_disease_adapter.age_cohort_summary) == 4
    assert res_bin.heart_disease_adapter.chol_outlier_analysis["outlier_count"] > 0

    # 2. Multiclass classification without binarization
    req_multi = AnalysisRequest(
        task_type="classification",
        target_column="num",
        models=["Logistic Regression", "Random Forest"],
        random_state=42
    )
    res_multi = run_dataset_analysis("heart-disease", req_multi)
    assert res_multi.model_results["Random Forest"].metrics["ROC-AUC"] is not None
    assert len(res_multi.model_results["Random Forest"].confusion_matrix.labels) >= 4

def test_breast_cancer_wisconsin_classification_and_id_exclusion():
    """
    Test Breast Cancer Wisconsin:
    - Auto-detect and exclude ID column to prevent leakage.
    - Classify Diagnosis ('M' vs 'B').
    - Achieve high clinical accuracy (>90%).
    """
    load_catalog_dataset("breast-cancer-wisconsin")
    req = AnalysisRequest(
        task_type="classification",
        target_column="Diagnosis",
        models=["Logistic Regression", "Random Forest"],
        random_state=42
    )
    res = run_dataset_analysis("breast-cancer-wisconsin", req)
    
    # ID should be excluded from predictors
    assert "ID" not in res.dataset_summary["numeric_features"]
    assert "ID" in res.dataset_summary.get("dropped_identifiers", [])
    
    # Models should achieve high accuracy
    rf = res.model_results["Random Forest"]
    assert rf.metrics["Accuracy"] > 0.90
    assert rf.metrics["ROC-AUC"] > 0.95
    assert rf.confusion_matrix is not None
    assert rf.confusion_matrix.labels == ["B", "M"]

def test_chronic_kidney_disease_mixed_preprocessing():
    """
    Test Chronic Kidney Disease:
    - Handles mixed numeric & categorical columns.
    - Handles missing values via median/mode imputation.
    - Successfully cleans and classifies target 'class' ('ckd' vs 'notckd').
    """
    load_catalog_dataset("chronic-kidney-disease")
    df = load_dataset_as_dataframe("chronic-kidney-disease")
    assert df["class"].nunique() == 2, "String whitespace typos must be cleaned to 2 unique classes"

    req = AnalysisRequest(
        task_type="classification",
        target_column="class",
        models=["Logistic Regression", "Decision Tree"],
        imputer_strategy="median",
        random_state=42
    )
    res = run_dataset_analysis("chronic-kidney-disease", req)
    assert res.dataset_summary["usable_records"] == 400
    assert len(res.dataset_summary["categorical_features"]) > 5
    assert res.model_results["Logistic Regression"].metrics["Accuracy"] > 0.85

def test_maternal_health_multiclass_classification():
    """
    Test Maternal Health Risk:
    - Multiclass target 'RiskLevel' with 3 classes ('low risk', 'mid risk', 'high risk').
    - Generates 3x3 confusion matrix and weighted metrics.
    """
    load_catalog_dataset("maternal-health-risk")
    req = AnalysisRequest(
        task_type="classification",
        target_column="RiskLevel",
        models=["Decision Tree", "Random Forest"],
        random_state=42
    )
    res = run_dataset_analysis("maternal-health-risk", req)
    cm = res.model_results["Random Forest"].confusion_matrix
    assert len(cm.labels) == 3
    assert len(cm.matrix) == 3
    assert len(cm.matrix[0]) == 3
    assert res.model_results["Random Forest"].metrics["Accuracy"] > 0.60

def test_cdc_diabetes_classification_and_id_handling():
    """
    Test CDC Diabetes Health Indicators:
    - 253,680 records.
    - Verify 'ID' is identified as an identifier and excluded.
    - Run Logistic Regression classification on 'Diabetes_binary'.
    """
    load_catalog_dataset("cdc-diabetes")
    req = AnalysisRequest(
        task_type="classification",
        target_column="Diabetes_binary",
        models=["Logistic Regression"],
        random_state=42
    )
    res = run_dataset_analysis("cdc-diabetes", req)
    assert res.dataset_summary["total_records"] == 253680
    assert "ID" in res.dataset_summary.get("dropped_identifiers", [])
    assert "Logistic Regression" in res.model_results
    assert res.model_results["Logistic Regression"].metrics["Accuracy"] > 0.80

def test_data_leakage_prevention():
    """
    Verify that preprocessing transformers are fitted ONLY on training partition.
    X_train and X_test shapes and transformations must respect independent partitions.
    """
    load_catalog_dataset("heart-disease")
    df = load_dataset_as_dataframe("heart-disease")
    
    prep = build_pipeline(
        df=df,
        target_column="target_binary",
        task_type="classification",
        test_size=0.25,
        random_state=42,
        scaler_type="standard"
    )
    
    # Train mean of scaled features should be close to 0
    train_num_idx = [i for i, f in enumerate(prep.feature_names) if f in prep.summary["numeric_features"]]
    if train_num_idx:
        train_means = np.mean(prep.X_train[:, train_num_idx], axis=0)
        assert np.all(np.abs(train_means) < 1e-10), "StandardScaler must be centered on training data"

def test_unavailable_catalog_item_handling():
    """Verify appropriate 404 response when requesting an unknown catalog item."""
    res = client.post("/api/datasets/catalog/non-existent-dataset/load")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_invalid_upload_handling():
    """Verify 400 error when uploading non-tabular / invalid format."""
    files = {"file": ("test.txt", b"plain text content", "text/plain")}
    res = client.post("/api/datasets/upload", files=files)
    assert res.status_code == 400
    assert "unsupported" in res.json()["detail"].lower()
