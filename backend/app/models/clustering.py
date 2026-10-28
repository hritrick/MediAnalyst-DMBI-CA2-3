import time
import logging
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.decomposition import PCA
from app.schemas.responses import ModelEvaluationResult

logger = logging.getLogger(__name__)

def evaluate_clustering_model(
    model_name: str,
    model: Any,
    X: np.ndarray,
    feature_names: List[str],
    n_clusters: int = 3
) -> ModelEvaluationResult:
    
    warnings = [
        "Unsupervised exploratory clusters reflect statistical data geometry and phenotypic similarities, not clinical diagnoses."
    ]
    start_t = time.perf_counter()
    labels = model.fit_predict(X)
    train_time = round((time.perf_counter() - start_t) * 1000, 2)
    
    n_unique_labels = len(np.unique(labels))
    if n_unique_labels < 2:
        warnings.append("Model clustered all samples into a single group. No meaningful separation achieved.")
        return ModelEvaluationResult(
            model_name=model_name,
            training_time_ms=train_time,
            metrics={"Clusters": 1.0},
            formatted_metrics={"Clusters": "1"},
            warnings=warnings
        )
        
    sil = float(silhouette_score(X, labels))
    db = float(davies_bouldin_score(X, labels))
    ch = float(calinski_harabasz_score(X, labels))
    
    # 2D PCA projection for cluster visualization
    pca_points = []
    try:
        pca = PCA(n_components=2, random_state=42)
        X_2d = pca.fit_transform(X)
        step = max(1, len(labels) // 100)  # at most 100 sample points for crisp display
        pca_points = [
            {
                "x": round(float(X_2d[i, 0]), 3),
                "y": round(float(X_2d[i, 1]), 3),
                "cluster": int(labels[i])
            }
            for i in range(0, len(labels), step)
        ]
    except Exception as e:
        logger.warning(f"PCA calculation error: {e}")

    # Cluster distribution
    cluster_centers = None
    if hasattr(model, "cluster_centers_"):
        cluster_centers = []
        for c_idx, center in enumerate(model.cluster_centers_):
            c_dict = {"cluster": c_idx}
            for f_idx, val in enumerate(center[:8]):
                if f_idx < len(feature_names):
                    c_dict[feature_names[f_idx]] = round(float(val), 3)
            cluster_centers.append(c_dict)

    metrics = {
        "Silhouette Score": sil,
        "Davies-Bouldin Index": db,
        "Calinski-Harabasz": ch
    }
    formatted = {
        "Silhouette Score": f"{sil:.4f}",
        "Davies-Bouldin Index": f"{db:.4f}",
        "Calinski-Harabasz": f"{ch:.1f}"
    }

    return ModelEvaluationResult(
        model_name=model_name,
        training_time_ms=train_time,
        metrics=metrics,
        formatted_metrics=formatted,
        cluster_labels=[int(x) for x in labels[:50]],
        cluster_centers=cluster_centers,
        pca_2d=pca_points,
        warnings=warnings
    )

def train_clustering_suite(
    X: np.ndarray,
    feature_names: List[str],
    selected_models: Optional[List[str]] = None,
    n_clusters: int = 3,
    random_state: int = 42
) -> Dict[str, ModelEvaluationResult]:
    
    available_models = {
        "K-Means": KMeans(n_clusters=n_clusters, random_state=random_state, n_init="auto"),
        "Hierarchical Clustering": AgglomerativeClustering(n_clusters=n_clusters)
    }
    
    to_run = selected_models if selected_models else list(available_models.keys())
    results = {}
    for name in to_run:
        if name in available_models:
            res = evaluate_clustering_model(
                model_name=name,
                model=available_models[name],
                X=X,
                feature_names=feature_names,
                n_clusters=n_clusters
            )
            results[name] = res
    return results
