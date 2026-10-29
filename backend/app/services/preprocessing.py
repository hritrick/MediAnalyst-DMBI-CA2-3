import logging
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder

logger = logging.getLogger(__name__)

class PreprocessedDataset:
    def __init__(
        self,
        X_train: np.ndarray,
        X_test: np.ndarray,
        y_train: Optional[np.ndarray],
        y_test: Optional[np.ndarray],
        feature_names: List[str],
        preprocessor: ColumnTransformer,
        summary: Dict[str, Any],
        raw_X_test: Optional[pd.DataFrame] = None,
        target_labels: Optional[List[str]] = None
    ):
        self.X_train = X_train
        self.X_test = X_test
        self.y_train = y_train
        self.y_test = y_test
        self.feature_names = feature_names
        self.preprocessor = preprocessor
        self.summary = summary
        self.raw_X_test = raw_X_test
        self.target_labels = target_labels

def build_pipeline(
    df: pd.DataFrame,
    target_column: Optional[str] = None,
    feature_columns: Optional[List[str]] = None,
    excluded_columns: Optional[List[str]] = None,
    task_type: str = "classification",
    test_size: float = 0.20,
    random_state: int = 42,
    stratify: bool = True,
    imputer_strategy: str = "median",
    scaler_type: str = "standard",
    target_binarize: bool = False
) -> PreprocessedDataset:
    
    clean_df = df.copy()
    excluded = set(excluded_columns or [])
    
    # Identify target if required
    y = None
    target_labels = None
    if task_type in ["classification", "regression"]:
        if not target_column or target_column not in clean_df.columns:
            raise ValueError(f"Target column '{target_column}' is required for {task_type} and must exist in dataset.")
        
        # Drop rows where target itself is missing
        initial_count = len(clean_df)
        clean_df = clean_df.dropna(subset=[target_column]).reset_index(drop=True)
        dropped_target_na = initial_count - len(clean_df)
        
        y_raw = clean_df[target_column]
        
        if task_type == "classification":
            if target_binarize:
                # Binarize like notebook: >0 becomes 1
                y_series = (pd.to_numeric(y_raw, errors='coerce').fillna(0) > 0).astype(int)
                target_labels = ["Absence (0)", "Presence (1)"]
            else:
                # Auto-encode labels to clean integers 0..K-1
                unique_classes = sorted(y_raw.unique(), key=lambda x: str(x))
                if len(unique_classes) < 2:
                    raise ValueError(f"Target '{target_column}' has only 1 unique class ({unique_classes}). At least 2 classes are required.")
                class_map = {cls: idx for idx, cls in enumerate(unique_classes)}
                y_series = y_raw.map(class_map).astype(int)
                target_labels = [str(cls) for cls in unique_classes]
            y = y_series.values
        else: # regression
            y_series = pd.to_numeric(y_raw, errors='coerce')
            valid_idx = y_series.notna()
            clean_df = clean_df[valid_idx].reset_index(drop=True)
            y = y_series[valid_idx].values
            
        excluded.add(target_column)

        # Prevent target leakage across related outcome columns or aliases
        related_target_aliases = {'target', 'num', 'target_binary', 'target_bin'}
        if target_column.lower() in related_target_aliases:
            for alias in clean_df.columns:
                if alias.lower() in related_target_aliases:
                    excluded.add(alias)

    # Identify and exclude identifier columns by default if not explicitly selected
    dropped_identifiers = []
    if not feature_columns:
        for c in clean_df.columns:
            if c in excluded:
                continue
            c_low = c.lower()
            if c_low in ['id', 'patient_id', 'subject_id', 'mrn', 'record_id', 'uuid', 'index'] or (
                len(clean_df) > 30 and clean_df[c].nunique(dropna=True) == len(clean_df) and not pd.api.types.is_float_dtype(clean_df[c])
            ):
                excluded.add(c)
                dropped_identifiers.append(c)

    # Determine candidate feature columns
    if feature_columns:
        features = [c for c in feature_columns if c in clean_df.columns and c not in excluded]
    else:
        features = [c for c in clean_df.columns if c not in excluded]

    if not features:
        raise ValueError("No valid predictive features selected.")

    # Filter out constant features
    valid_features = []
    dropped_constant = []
    for f in features:
        if clean_df[f].nunique(dropna=True) <= 1:
            dropped_constant.append(f)
        else:
            valid_features.append(f)

    if not valid_features:
        raise ValueError("All selected features have zero variance (constant values).")

    X_df = clean_df[valid_features]

    # Partition columns into numeric vs categorical
    numeric_cols = [c for c in valid_features if pd.api.types.is_numeric_dtype(X_df[c])]
    categorical_cols = [c for c in valid_features if c not in numeric_cols]

    # Create transformers
    transformers = []
    if numeric_cols:
        num_steps = [
            ("imputer", SimpleImputer(strategy=imputer_strategy if imputer_strategy in ["mean", "median"] else "median"))
        ]
        if scaler_type == "standard":
            num_steps.append(("scaler", StandardScaler()))
        elif scaler_type == "minmax":
            num_steps.append(("scaler", MinMaxScaler()))
        transformers.append(("num", Pipeline(steps=num_steps), numeric_cols))

    if categorical_cols:
        cat_steps = [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ]
        transformers.append(("cat", Pipeline(steps=cat_steps), categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

    # Train-test split
    stratify_target = None
    if task_type == "classification" and stratify and y is not None:
        # Check minimum class count for stratification
        unique, counts = np.unique(y, return_counts=True)
        if all(c >= 2 for c in counts):
            stratify_target = y
        else:
            logger.warning("Class counts too small for stratification. Falling back to non-stratified split.")

    if task_type in ["classification", "regression"]:
        X_train_df, X_test_df, y_train, y_test = train_test_split(
            X_df, y, test_size=test_size, random_state=random_state, stratify=stratify_target
        )
    else:
        # Unsupervised clustering: use entire or train/test split
        X_train_df, X_test_df = train_test_split(X_df, test_size=test_size, random_state=random_state)
        y_train, y_test = None, None

    # Fit preprocessor strictly on training data
    X_train_trans = preprocessor.fit_transform(X_train_df)
    X_test_trans = preprocessor.transform(X_test_df)

    # Derive feature names after encoding
    out_feature_names = []
    if numeric_cols:
        out_feature_names.extend(numeric_cols)
    if categorical_cols:
        try:
            cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
            encoded_names = cat_encoder.get_feature_names_out(categorical_cols).tolist()
            out_feature_names.extend(encoded_names)
        except Exception:
            out_feature_names.extend([f"{c}_encoded" for c in categorical_cols])

    # Class balance summary
    class_balance = {}
    if y_train is not None and task_type == "classification":
        u, c = np.unique(y_train, return_counts=True)
        class_balance = {str(k): int(v) for k, v in zip(u, c)}

    summary = {
        "total_records": len(df),
        "usable_records": len(clean_df),
        "train_samples": int(X_train_trans.shape[0]),
        "test_samples": int(X_test_trans.shape[0]),
        "original_features": len(valid_features),
        "feature_columns": valid_features,
        "engineered_features": int(X_train_trans.shape[1]),
        "numeric_features": numeric_cols,
        "categorical_features": categorical_cols,
        "dropped_constant_features": dropped_constant,
        "dropped_identifiers": dropped_identifiers,
        "class_balance": class_balance,
        "scaler_applied": scaler_type
    }

    return PreprocessedDataset(
        X_train=X_train_trans,
        X_test=X_test_trans,
        y_train=y_train,
        y_test=y_test,
        feature_names=out_feature_names,
        preprocessor=preprocessor,
        summary=summary,
        raw_X_test=X_test_df,
        target_labels=target_labels
    )
