import pandas as pd
from typing import List, Dict, Any
from app.schemas.responses import RecommendationItem, RecommendationsResponse, DatasetProfileResponse

def generate_recommendations(profile: DatasetProfileResponse, df: pd.DataFrame) -> RecommendationsResponse:
    recs: List[RecommendationItem] = []
    
    n_rows = profile.row_count
    num_cols = [c.name for c in profile.columns if c.inferred_type in ["numeric", "binary"] and not c.is_id and not c.is_constant]
    cat_cols = [c.name for c in profile.columns if c.inferred_type in ["categorical", "binary"] and not c.is_id and not c.is_constant]
    
    # 1. Exploratory Data Analysis
    recs.append(RecommendationItem(
        task_type="eda",
        title="Exploratory Clinical Data Analysis",
        is_recommended=True,
        confidence="high",
        reason=f"Always essential before statistical modeling. Current dataset has {n_rows} patient records and {profile.column_count} attributes with {profile.missing_percentage}% missing values.",
        candidate_features=[c.name for c in profile.columns if not c.is_constant and not c.is_id][:10],
        suggested_models=["Summary Statistics", "Outlier Screening (IQR)", "Correlation Matrix", "Cohort Stratification"]
    ))
    
    # 2. Classification
    classification_targets = []
    non_target_tokens = {'sex', 'gender', 'is_male', 'is_female', 'fbs', 'exang'}
    for c in profile.columns:
        if c.is_constant or c.is_id or c.name.lower() in non_target_tokens:
            continue
        # Check unique count and class sizes
        if 2 <= c.unique_count <= 10:
            classification_targets.append(c.name)

    # Sort priority: target, outcome, diagnosis, disease, num first
    priority_keys = ['target', 'target_binary', 'num', 'diagnosis', 'disease', 'outcome', 'class', 'risk']
    classification_targets.sort(
        key=lambda col: 0 if any(k == col.lower() or f"{k}_" in col.lower() for k in priority_keys) else 1
    )
            
    is_class_recommended = len(classification_targets) > 0 and n_rows >= 30
    class_reason = ""
    if is_class_recommended:
        top_cand = classification_targets[0]
        class_reason = (
            f"Primary outcome candidate identified: '{top_cand}'. "
            f"Allows predicting clinical diagnosis, presence/absence of disease, or risk stratum."
        )
    else:
        class_reason = "No obvious discrete categorical outcome with 2-10 classes detected. Classification requires selecting or discretizing a target."
        
    recs.append(RecommendationItem(
        task_type="classification",
        title="Supervised Classification (Disease Prediction)",
        is_recommended=is_class_recommended,
        confidence="high" if any("target" in c.lower() or "diagnosis" in c.lower() or "outcome" in c.lower() for c in classification_targets) else "moderate",
        reason=class_reason,
        candidate_targets=classification_targets,
        candidate_features=[c for c in num_cols + cat_cols if c not in classification_targets],
        suggested_models=["Logistic Regression", "Decision Tree Classifier", "Random Forest Classifier"]
    ))
    
    # 3. Regression
    regression_targets = []
    for c in profile.columns:
        if c.is_constant or c.is_id:
            continue
        if c.inferred_type == "numeric" and c.unique_count > 10:
            regression_targets.append(c.name)
            
    is_reg_recommended = len(regression_targets) > 0 and len(num_cols) >= 2
    reg_reason = ""
    if is_reg_recommended:
        top_reg = regression_targets[0]
        reg_reason = (
            f"Found continuous clinical parameters (e.g., '{top_reg}') with sufficient numeric variance. "
            f"Suitable for estimating quantitative physiological measures (blood pressure, cholesterol, recovery index)."
        )
    else:
        reg_reason = "Insufficient continuous numeric variables with variance to perform predictive regression."
        
    recs.append(RecommendationItem(
        task_type="regression",
        title="Supervised Regression (Quantitative Estimation)",
        is_recommended=is_reg_recommended,
        confidence="moderate" if is_reg_recommended else "low",
        reason=reg_reason,
        candidate_targets=regression_targets,
        candidate_features=[c for c in num_cols if c not in regression_targets],
        suggested_models=["Linear Regression", "Decision Tree Regressor", "Random Forest Regressor"]
    ))
    
    # 4. Clustering
    is_clust_recommended = len(num_cols) >= 2 and n_rows >= 20
    clust_reason = (
        f"Unsupervised discovery of latent patient subgroups or phenotypic clusters across {len(num_cols)} numeric markers. "
        "Useful when diagnostic ground truth is unavailable or when seeking novel disease sub-types."
    ) if is_clust_recommended else "Requires at least 2 non-constant numeric features to cluster."
    
    recs.append(RecommendationItem(
        task_type="clustering",
        title="Unsupervised Patient Clustering (Phenotyping)",
        is_recommended=is_clust_recommended,
        confidence="moderate" if is_clust_recommended else "low",
        reason=clust_reason,
        candidate_targets=[],
        candidate_features=num_cols[:10],
        suggested_models=["K-Means Clustering", "Hierarchical Agglomerative Clustering"]
    ))
    
    # 5. Association Rule Mining / Discretization
    recs.append(RecommendationItem(
        task_type="association",
        title="Clinical Cohort & Association Analysis",
        is_recommended=True,
        confidence="moderate",
        reason="Discretize continuous markers (e.g., age cohorts, blood pressure tiers) to evaluate clinical co-occurrence patterns and risk rates.",
        candidate_targets=[],
        candidate_features=cat_cols + num_cols[:4],
        suggested_models=["Age-Cohort Prevalence Analysis", "Clinical Risk Stratification"]
    ))

    inferred_domain = "Cardiovascular / Cardiology" if profile.is_cleveland_heart_disease else "General Medical Analytics"

    return RecommendationsResponse(
        dataset_id=profile.dataset_id,
        recommendations=recs,
        inferred_domain=inferred_domain
    )
