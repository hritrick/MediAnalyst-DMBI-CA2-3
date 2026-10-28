import time
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, _tree
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve
)
from app.schemas.responses import ModelEvaluationResult, ConfusionMatrixData, CurvePoint

logger = logging.getLogger(__name__)

def extract_tree_structure(tree_model: DecisionTreeClassifier, feature_names: List[str], class_names: List[str], max_depth: int = 4) -> Dict[str, Any]:
    tree_ = tree_model.tree_
    
    def recurse(node, depth):
        if depth > max_depth:
            return None
        
        is_leaf = tree_.children_left[node] == _tree.TREE_LEAF
        node_value = tree_.value[node][0].tolist()
        predicted_class_idx = int(np.argmax(node_value))
        predicted_label = class_names[predicted_class_idx] if class_names and predicted_class_idx < len(class_names) else f"Class {predicted_class_idx}"
        
        node_info = {
            "node_id": int(node),
            "samples": int(tree_.n_node_samples[node]),
            "impurity": round(float(tree_.impurity[node]), 4),
            "distribution": [int(v) for v in node_value],
            "prediction": predicted_label,
            "is_leaf": bool(is_leaf)
        }
        
        if not is_leaf:
            feature_idx = tree_.feature[node]
            feature_name = feature_names[feature_idx] if feature_idx < len(feature_names) else f"Feature_{feature_idx}"
            threshold = round(float(tree_.threshold[node]), 3)
            
            node_info["rule"] = f"{feature_name} <= {threshold}"
            node_info["feature"] = feature_name
            node_info["threshold"] = threshold
            node_info["left"] = recurse(tree_.children_left[node], depth + 1)
            node_info["right"] = recurse(tree_.children_right[node], depth + 1)
            
        return node_info

    return recurse(0, 1)

def evaluate_classification_model(
    model_name: str,
    model: Any,
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
    target_labels: Optional[List[str]] = None,
    threshold_goal: float = 0.80
) -> ModelEvaluationResult:
    
    warnings = []
    start_t = time.perf_counter()
    model.fit(X_train, y_train)
    train_time = round((time.perf_counter() - start_t) * 1000, 2)
    
    y_pred = model.predict(X_test)
    
    unique_classes = np.unique(y_test)
    is_binary = len(unique_classes) == 2 and set(unique_classes).issubset({0, 1})
    
    has_proba = hasattr(model, "predict_proba")
    y_proba = None
    if has_proba:
        try:
            y_proba = model.predict_proba(X_test)
        except Exception as e:
            logger.warning(f"Failed to get predict_proba for {model_name}: {e}")
            
    # Metrics
    avg_mode = "binary" if is_binary else "weighted"
    
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average=avg_mode, zero_division=0))
    rec = float(recall_score(y_test, y_pred, average=avg_mode, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average=avg_mode, zero_division=0))
    
    roc_auc = None
    roc_points = None
    pr_points = None
    threshold_analysis = None
    
    if is_binary and y_proba is not None:
        try:
            p_pos = y_proba[:, 1]
            roc_auc = float(roc_auc_score(y_test, p_pos))
            
            # ROC Curve
            fpr, tpr, _ = roc_curve(y_test, p_pos)
            step = max(1, len(fpr) // 30)
            roc_points = [
                CurvePoint(x=round(float(fpr[i]), 4), y=round(float(tpr[i]), 4))
                for i in range(0, len(fpr), step)
            ]
            if roc_points[-1].x != 1.0 or roc_points[-1].y != 1.0:
                roc_points.append(CurvePoint(x=1.0, y=1.0))
                
            # PR Curve
            p, r, thresh = precision_recall_curve(y_test, p_pos)
            pr_step = max(1, len(r) // 30)
            pr_points = [
                CurvePoint(x=round(float(r[i]), 4), y=round(float(p[i]), 4))
                for i in range(0, len(r), pr_step)
            ]
            
            # Threshold optimization (Notebook Cell 16 logic)
            valid_idx = np.where(p[:-1] >= threshold_goal)[0]
            if len(valid_idx) > 0:
                best_idx = valid_idx[np.argmax(r[valid_idx])]
                opt_thresh = float(thresh[best_idx])
            else:
                opt_thresh = 0.50
                warnings.append(f"Could not reach {threshold_goal*100}% precision on test set; defaulted to 0.50.")
                
            adjusted_preds = (p_pos >= opt_thresh).astype(int)
            adj_cm = confusion_matrix(y_test, adjusted_preds)
            
            threshold_analysis = {
                "default_threshold": 0.50,
                "optimal_threshold": round(opt_thresh, 3),
                "goal_precision": threshold_goal,
                "adjusted_precision": round(float(precision_score(y_test, adjusted_preds, zero_division=0)), 4),
                "adjusted_recall": round(float(recall_score(y_test, adjusted_preds, zero_division=0)), 4),
                "adjusted_f1": round(float(f1_score(y_test, adjusted_preds, zero_division=0)), 4),
                "confusion_matrix": adj_cm.tolist(),
                "clinical_rationale": (
                    f"Calibrated decision boundary to tau={opt_thresh:.3f} to prioritize clinical sensitivity (Recall: "
                    f"{round(float(recall_score(y_test, adjusted_preds, zero_division=0))*100, 1)}%) while preserving target precision."
                )
            }
        except Exception as e:
            logger.warning(f"Error computing ROC/PR for {model_name}: {e}")
            warnings.append(f"ROC/PR curves could not be calculated: {str(e)}")

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    display_labels = target_labels or [f"Class {i}" for i in range(len(cm))]
    cm_data = ConfusionMatrixData(
        labels=display_labels,
        matrix=cm.tolist()
    )
    
    # Feature Importances
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
        coef = np.abs(model.coef_[0]) if model.coef_.ndim > 1 else np.abs(model.coef_)
        sorted_idx = np.argsort(coef)[::-1]
        feat_importances = [
            {"feature": feature_names[i], "importance": round(float(coef[i]), 4)}
            for i in sorted_idx[:15]
            if i < len(feature_names)
        ]
        
    # Decision tree inspection
    tree_rules = None
    if isinstance(model, DecisionTreeClassifier):
        tree_rules = extract_tree_structure(model, feature_names, display_labels, max_depth=4)

    metrics = {
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1-score": f1,
    }
    if roc_auc is not None:
        metrics["ROC-AUC"] = roc_auc

    formatted_metrics = {k: f"{v:.4f}" for k, v in metrics.items()}

    return ModelEvaluationResult(
        model_name=model_name,
        training_time_ms=train_time,
        metrics=metrics,
        formatted_metrics=formatted_metrics,
        confusion_matrix=cm_data,
        roc_curve=roc_points,
        pr_curve=pr_points,
        roc_auc=roc_auc,
        feature_importances=feat_importances,
        tree_rules=tree_rules,
        threshold_analysis=threshold_analysis,
        warnings=warnings
    )

def train_classification_suite(
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
    selected_models: Optional[List[str]] = None,
    random_state: int = 42,
    target_labels: Optional[List[str]] = None,
    threshold_goal: float = 0.80
) -> Dict[str, ModelEvaluationResult]:
    
    available_models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=random_state),
        "Decision Tree": DecisionTreeClassifier(max_depth=4, random_state=random_state),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=6, random_state=random_state)
    }
    
    to_run = selected_models if selected_models else list(available_models.keys())
    
    results = {}
    for name in to_run:
        if name in available_models:
            model = available_models[name]
            res = evaluate_classification_model(
                model_name=name,
                model=model,
                X_train=X_train,
                X_test=X_test,
                y_train=y_train,
                y_test=y_test,
                feature_names=feature_names,
                target_labels=target_labels,
                threshold_goal=threshold_goal
            )
            results[name] = res
            
    return results
