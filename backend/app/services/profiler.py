import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.schemas.responses import DatasetProfileResponse, ColumnProfile, OutlierSummary

logger = logging.getLogger(__name__)

CLEVELAND_COLUMNS = {
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target'
}

def is_id_column(col_name: str, series: pd.Series, n_rows: int) -> bool:
    name_lower = col_name.lower()
    id_tokens = ['id', 'patient_id', 'subject_id', 'mrn', 'record_id', 'uuid', 'index']
    if any(tok == name_lower or name_lower.endswith(f"_{tok}") or name_lower.startswith(f"{tok}_") for tok in id_tokens):
        return True
    # If almost 100% unique strings or integers with no repetition
    if n_rows > 30 and series.nunique(dropna=True) == n_rows:
        if pd.api.types.is_string_dtype(series) or pd.api.types.is_integer_dtype(series):
            return True
    return False

def is_target_candidate(col_name: str, series: pd.Series) -> bool:
    name_lower = col_name.lower()
    target_names = [
        'target', 'outcome', 'diagnosis', 'label', 'condition', 'disease',
        'class', 'status', 'has_disease', 'diabetes', 'risk', 'risklevel',
        'quality', 'num'
    ]
    if any(t in name_lower for t in target_names):
        return True
    # Also if binary (2 unique values) and not an obvious ID/flag
    if series.nunique(dropna=True) == 2:
        return True
    return False

def profile_dataframe(df: pd.DataFrame, dataset_id: str, filename: str) -> DatasetProfileResponse:
    n_rows, n_cols = df.shape
    total_cells = n_rows * n_cols
    missing_cells = int(df.isna().sum().sum())
    missing_pct = round((missing_cells / total_cells * 100), 2) if total_cells > 0 else 0.0
    
    dup_rows = int(df.duplicated().sum())
    dup_pct = round((dup_rows / n_rows * 100), 2) if n_rows > 0 else 0.0
    
    col_profiles: List[ColumnProfile] = []
    numeric_cols = []
    warnings: List[str] = []
    
    if n_rows < 50:
        warnings.append(f"Small dataset size ({n_rows} rows). Statistical metrics may have high variance.")
    if dup_rows > 0:
        warnings.append(f"Detected {dup_rows} ({dup_pct}%) duplicate rows. Note: in medical data, repeated visits may be clinically valid.")
    
    outliers_list: List[OutlierSummary] = []
    
    for col in df.columns:
        s = df[col]
        missing_count = int(s.isna().sum())
        missing_p = round((missing_count / n_rows * 100), 2) if n_rows > 0 else 0.0
        unique_c = int(s.nunique(dropna=True))
        
        is_const = unique_c <= 1
        is_id = is_id_column(col, s, n_rows)
        is_high_miss = missing_p > 30.0
        
        if is_const:
            warnings.append(f"Column '{col}' is constant (zero variance). It will provide no predictive value.")
        if is_high_miss:
            warnings.append(f"Column '{col}' has {missing_p}% missing data. Imputation should be considered carefully.")
            
        # Determine inferred type
        is_numeric = pd.api.types.is_numeric_dtype(s)
        inferred_type = "numeric"
        
        if is_const:
            inferred_type = "constant"
        elif is_id:
            inferred_type = "id"
        elif is_numeric:
            if unique_c == 2:
                inferred_type = "binary"
            elif unique_c <= 10 and pd.api.types.is_integer_dtype(s):
                inferred_type = "categorical"
            else:
                inferred_type = "numeric"
                numeric_cols.append(col)
        else:
            if unique_c == 2:
                inferred_type = "binary"
            elif unique_c <= 25:
                inferred_type = "categorical"
            else:
                inferred_type = "text"
                
        # Suggested role
        if is_id:
            suggested_role = "identifier"
        elif is_const:
            suggested_role = "ignore"
        elif is_target_candidate(col, s):
            suggested_role = "target_candidate"
        else:
            suggested_role = "feature"
            
        # Samples
        non_null_samples = s.dropna().head(5).tolist()
        # Clean numpy types for JSON serialization
        sample_values = [
            int(x) if isinstance(x, (np.integer, np.int64))
            else float(x) if isinstance(x, (np.floating, np.float64))
            else str(x)
            for x in non_null_samples
        ]
        
        min_v = float(s.min()) if is_numeric and not s.dropna().empty else None
        max_v = float(s.max()) if is_numeric and not s.dropna().empty else None
        mean_v = float(s.mean()) if is_numeric and not s.dropna().empty else None
        std_v = float(s.std()) if is_numeric and not s.dropna().empty else None
        median_v = float(s.median()) if is_numeric and not s.dropna().empty else None
        skew_v = float(s.skew()) if is_numeric and not s.dropna().empty and s.nunique() > 2 else None
        
        top_cats = None
        if inferred_type in ["categorical", "binary", "text"] and unique_c > 0:
            vc = s.value_counts(dropna=True).head(8)
            top_cats = [
                {
                    "category": str(k),
                    "count": int(v),
                    "percentage": round(float(v / n_rows * 100), 2)
                }
                for k, v in vc.items()
            ]
            
        # Outlier calculation for continuous numeric columns
        if is_numeric and unique_c > 10:
            clean_s = s.dropna()
            if len(clean_s) >= 10:
                q1 = float(clean_s.quantile(0.25))
                q3 = float(clean_s.quantile(0.75))
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outliers = clean_s[(clean_s < lower) | (clean_s > upper)]
                if len(outliers) > 0:
                    outliers_list.append(OutlierSummary(
                        column=col,
                        outlier_count=int(len(outliers)),
                        outlier_percentage=round(float(len(outliers) / len(clean_s) * 100), 2),
                        lower_bound=round(lower, 2),
                        upper_bound=round(upper, 2),
                        outlier_values=[float(x) for x in outliers.head(10).tolist()]
                    ))

        col_profiles.append(ColumnProfile(
            name=col,
            original_dtype=str(s.dtype),
            inferred_type=inferred_type,
            missing_count=missing_count,
            missing_percentage=missing_p,
            unique_count=unique_c,
            sample_values=sample_values,
            suggested_role=suggested_role,
            is_constant=is_const,
            is_id=is_id,
            is_high_missing=is_high_miss,
            min_value=round(min_v, 3) if min_v is not None else None,
            max_value=round(max_v, 3) if max_value_check(max_v) else None,
            mean_value=round(mean_v, 3) if mean_v is not None else None,
            std_value=round(std_v, 3) if std_v is not None else None,
            median_value=round(median_v, 3) if median_v is not None else None,
            skewness=round(skew_v, 3) if skew_v is not None else None,
            top_categories=top_cats
        ))

    num_count = sum(1 for c in col_profiles if c.inferred_type in ["numeric", "binary"])
    cat_count = sum(1 for c in col_profiles if c.inferred_type in ["categorical", "text"])

    # Correlation Matrix for numeric features
    corr_matrix = None
    if len(numeric_cols) >= 2:
        try:
            num_df = df[numeric_cols].dropna()
            if not num_df.empty:
                corr = num_df.corr().round(3)
                corr_matrix = {
                    "columns": numeric_cols,
                    "matrix": corr.where(pd.notnull(corr), 0.0).values.tolist()
                }
        except Exception as e:
            logger.warning(f"Could not compute correlation matrix: {e}")

    # Preview rows (first 50) with NaN safely converted
    preview = []
    for row in df.head(50).to_dict(orient="records"):
        clean_row = {}
        for k, v in row.items():
            if pd.isna(v):
                clean_row[k] = None
            elif isinstance(v, (np.integer, np.int64)):
                clean_row[k] = int(v)
            elif isinstance(v, (np.floating, np.float64)):
                clean_row[k] = round(float(v), 4)
            else:
                clean_row[k] = str(v)
        preview.append(clean_row)

    # Check if Cleveland heart disease dataset
    cols_set = set(c.lower() for c in df.columns)
    is_cleveland = {'age', 'chol', 'trestbps', 'cp', 'thalach'}.issubset(cols_set) and any(
        t in cols_set for t in ['num', 'target', 'target_binary']
    )

    return DatasetProfileResponse(
        dataset_id=dataset_id,
        filename=filename,
        row_count=n_rows,
        column_count=n_cols,
        total_cells=total_cells,
        missing_cells=missing_cells,
        missing_percentage=missing_pct,
        duplicate_rows=dup_rows,
        duplicate_percentage=dup_pct,
        numeric_column_count=num_count,
        categorical_column_count=cat_count,
        columns=col_profiles,
        preview_rows=preview,
        correlation_matrix=corr_matrix,
        outliers=outliers_list,
        warnings=warnings,
        is_cleveland_heart_disease=is_cleveland
    )

def max_value_check(v):
    return v is not None and not np.isinf(v) and not np.isnan(v)
