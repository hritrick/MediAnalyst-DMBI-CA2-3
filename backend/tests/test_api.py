import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["project"] == "MediAnalytics"

def test_load_cleveland_example():
    res = client.post("/api/datasets/example/heart-disease")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_id"] == "cleveland-heart"
    assert data["row_count"] > 250
    assert data["column_count"] == 14

def test_dataset_profile():
    res = client.get("/api/datasets/cleveland-heart/profile")
    assert res.status_code == 200
    profile = res.json()
    assert profile["row_count"] > 250
    assert profile["is_cleveland_heart_disease"] is True
    assert len(profile["columns"]) == 14
    assert len(profile["outliers"]) > 0

def test_dataset_recommendations():
    res = client.post("/api/datasets/cleveland-heart/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs["recommendations"]) >= 4
    class_rec = next(r for r in recs["recommendations"] if r["task_type"] == "classification")
    assert class_rec["is_recommended"] is True

def test_dataset_analysis_classification():
    payload = {
        "task_type": "classification",
        "target_column": "target",
        "target_binarize": True,
        "test_size": 0.20,
        "random_state": 42,
        "models": ["Logistic Regression", "Decision Tree", "Random Forest"]
    }
    res = client.post("/api/datasets/cleveland-heart/analyze", json=payload)
    assert res.status_code == 200
    analysis = res.json()
    assert "analysis_id" in analysis
    assert "Random Forest" in analysis["model_results"]
    assert "Logistic Regression" in analysis["model_results"]
    assert "Decision Tree" in analysis["model_results"]
    assert analysis["heart_disease_adapter"] is not None
    
    # Check that report endpoint works
    analysis_id = analysis["analysis_id"]
    rep_res = client.get(f"/api/analyses/{analysis_id}/report")
    assert rep_res.status_code == 200
    
    # Check that PDF report endpoint works
    pdf_res = client.get(f"/api/analyses/{analysis_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    
    # Check that clean CSV export works
    csv_res = client.get(f"/api/analyses/{analysis_id}/export/clean-csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
