import pytest
import pandas as pd
import numpy as np
from app.services.profiler import profile_dataframe
from app.services.recommender import generate_recommendations
from app.services.preprocessing import build_pipeline
from app.models.classification import train_classification_suite
from app.models.regression import train_regression_suite
from app.models.clustering import train_clustering_suite

def test_profiler_with_sample_data():
    df = pd.DataFrame({
        "age": [45, 52, 60, 38, 71, 55, 62, 48, 50, 58],
        "chol": [230, 245, 290, 180, 310, 220, 260, 240, 250, 280],
        "sex": [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
        "target": [0, 1, 1, 0, 1, 0, 1, 0, 0, 1],
        "constant_col": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    })
    profile = profile_dataframe(df, "test-id", "test.csv")
    assert profile.row_count == 10
    assert profile.column_count == 5
    assert profile.missing_cells == 0
    
    # Check constant column identification
    const_col = next(c for c in profile.columns if c.name == "constant_col")
    assert const_col.is_constant is True
    assert const_col.suggested_role == "ignore"

def test_classification_suite():
    np.random.seed(42)
    n = 100
    df = pd.DataFrame({
        "f1": np.random.randn(n),
        "f2": np.random.randn(n) * 2,
        "f3": np.random.choice(["A", "B", "C"], size=n),
        "target": np.random.choice([0, 1], size=n)
    })
    
    prep = build_pipeline(
        df=df,
        target_column="target",
        task_type="classification",
        test_size=0.25,
        random_state=42
    )
    assert prep.X_train.shape[0] == 75
    assert prep.X_test.shape[0] == 25
    
    results = train_classification_suite(
        X_train=prep.X_train,
        X_test=prep.X_test,
        y_train=prep.y_train,
        y_test=prep.y_test,
        feature_names=prep.feature_names,
        random_state=42
    )
    assert "Logistic Regression" in results
    assert "Decision Tree" in results
    assert "Random Forest" in results
    assert "Accuracy" in results["Logistic Regression"].metrics
    assert results["Decision Tree"].tree_rules is not None

def test_regression_suite():
    np.random.seed(42)
    n = 80
    df = pd.DataFrame({
        "x1": np.random.randn(n),
        "x2": np.random.randn(n),
        "target": np.random.randn(n) * 5 + 10
    })
    prep = build_pipeline(
        df=df,
        target_column="target",
        task_type="regression",
        test_size=0.20,
        random_state=42
    )
    results = train_regression_suite(
        X_train=prep.X_train,
        X_test=prep.X_test,
        y_train=prep.y_train,
        y_test=prep.y_test,
        feature_names=prep.feature_names
    )
    assert "Linear Regression" in results
    assert "RMSE" in results["Linear Regression"].metrics

def test_clustering_suite():
    np.random.seed(42)
    n = 60
    df = pd.DataFrame({
        "v1": np.random.randn(n),
        "v2": np.random.randn(n),
        "v3": np.random.randn(n)
    })
    prep = build_pipeline(
        df=df,
        task_type="clustering",
        test_size=0.20,
        random_state=42
    )
    results = train_clustering_suite(
        X=prep.X_train,
        feature_names=prep.feature_names,
        n_clusters=3
    )
    assert "K-Means" in results
    assert "Silhouette Score" in results["K-Means"].metrics
