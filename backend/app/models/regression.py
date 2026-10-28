import time
import logging
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from app.schemas.responses import ModelEvaluationResult

logger = logging.getLogger(__name__)

def evaluate_regression_model(
    model_name: str,
    model: Any,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str]
) -> ModelEvaluationResult:
    
    warnings = []
    start_t = time.perf_counter()
    model.fit(X_train, y_train)
    train_time = round((time.perf_counter() - start_t) * 1000, 2)
    
    y_pred = model.predict(X_test)
    
    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))
    
    if r2 < 0:
        warnings.append("R² is negative, indicating model performs worse than a simple horizontal line predicting the mean.")
    elif r2 < 0.2:
        warnings.append("Low R² value indicates low proportion of variance explained by selected predictors.")

    # Feature importances
    feat_importances = None
    if hasattr(model, "feature_importances_"):
        fi = model.feature_importances_
        sorted_idx = np.argsort(fi)[::-1]
        feat_importances = [
            {"feature": feature_names[i], "importance": round(float(fi[i]), 4)}
            for i in sorted_idx[:15]
            if i < len(feature_names)
        ]
    elif hasattr(model, "coef_"):
        coef = np.abs(model.coef_)
        sorted_idx = np.argsort(coef)[::-1]
        feat_importances = [
            {"feature": feature_names[i], "importance": round(float(coef[i]), 4)}
            for i in sorted_idx[:15]
            if i < len(feature_names)
        ]

    metrics = {
        "MAE": mae,
        "RMSE": rmse,
        "R-squared": r2
    }
    formatted = {
        "MAE": f"{mae:.3f}",
        "RMSE": f"{rmse:.3f}",
        "R-squared": f"{r2:.4f}"
    }

    return ModelEvaluationResult(
        model_name=model_name,
        training_time_ms=train_time,
        metrics=metrics,
        formatted_metrics=formatted,
        feature_importances=feat_importances,
        warnings=warnings
    )

def train_regression_suite(
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
    selected_models: Optional[List[str]] = None,
    random_state: int = 42
) -> Dict[str, ModelEvaluationResult]:
    
    available_models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree Regressor": DecisionTreeRegressor(max_depth=4, random_state=random_state),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=6, random_state=random_state)
    }
    
    to_run = selected_models if selected_models else list(available_models.keys())
    results = {}
    for name in to_run:
        if name in available_models:
            res = evaluate_regression_model(
                model_name=name,
                model=available_models[name],
                X_train=X_train,
                X_test=X_test,
                y_train=y_train,
                y_test=y_test,
                feature_names=feature_names
            )
            results[name] = res
    return results
