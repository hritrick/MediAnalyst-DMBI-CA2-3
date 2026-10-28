# MediAnalytics — Multi-Dataset Medical Data Analytics Platform

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-234B43.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-315F62.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-627D98.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-315F62.svg)](https://www.typescriptlang.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9-234B43.svg)](https://scikit-learn.org/)
[![Academic Viva Ready](https://img.shields.io/badge/Academic%20Project-DMBI%20CA2-234B43.svg)](#)

**MediAnalytics** is a full-stack clinical data mining and machine learning web platform built for academic research and college-level viva demonstration (**DMBI CA2**). It enables researchers and clinicians to upload arbitrary medical datasets (CSV/Excel), automatically profile their statistical and structural characteristics, screen for Tukey outliers and missingness, and evaluate machine learning models (Classification, Regression, Clustering) with strict data leakage safeguards and clinical threshold optimization.

---

## Key Highlights

- **Designed for Academic Rigor & Viva Presentation**: Minimalist, calm, trustworthy aesthetic adhering strictly to medical analytics principles with deep green (`#234B43`), muted teal (`#315F62`), and warm slate (`#627D98`).
- **Google Colab Notebook Integration**: Directly operationalizes the methodology from `DMBI_CA2.ipynb`, including:
  - UCI Cleveland Heart Disease benchmark data loading with offline local fallback.
  - Stratified 80:20 training/test splits.
  - Continuous variable standardization with `StandardScaler` fitted strictly on training data.
  - Core models: **Logistic Regression**, **Decision Tree (depth=4)**, and **Random Forest (100 estimators)**.
  - Empirical metrics: Accuracy, Precision, Recall, F1-score, ROC-AUC, and Confusion Matrix.
  - Clinical age cohort discretization (`<45`, `45-54`, `55-64`, `65+`).
  - Serum cholesterol outlier analysis via Tukey's IQR fences ($Q3 + 1.5 \times IQR$).
  - Decision tree rule extraction and hierarchy inspection.
  - Clinical decision threshold calibration ($\tau$ optimizing Recall with Precision $\ge 80\%$).
- **Multi-Dataset Versatility**: Supports any custom medical CSV or Excel spreadsheet with automatic column type inference, role detection (features vs targets vs identifiers), and data quality alerts.
- **Publication-Quality Reports**: Generates downloadable PDF reports with ReportLab and exports sanitized, deduplicated CSV datasets.

---

## Architecture

```
DMBI-CA2/
├── DMBI_CA2.ipynb               # Original Google Colab notebook
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & CORS
│   │   ├── config.py            # Pydantic v2 application settings
│   │   ├── api/
│   │   │   ├── datasets.py      # Uploads, profiling & recommendations
│   │   │   ├── analysis.py      # Model training & evaluation execution
│   │   │   └── reports.py       # PDF generator & clean CSV download
│   │   ├── services/
│   │   │   ├── loader.py        # CSV/XLSX parser & Cleveland benchmark
│   │   │   ├── profiler.py      # Statistical profiling & Tukey outliers
│   │   │   ├── recommender.py   # Machine learning recommendation engine
│   │   │   ├── preprocessing.py # Scikit-learn ColumnTransformer & Pipeline
│   │   │   ├── evaluator.py     # Evaluation orchestrator
│   │   │   └── report_generator.py # ReportLab PDF & CSV builder
│   │   ├── models/
│   │   │   ├── classification.py # LogReg, Decision Tree, Random Forest
│   │   │   ├── regression.py     # Linear, Decision Tree Regressor, RF
│   │   │   └── clustering.py     # K-Means, Hierarchical Clustering
│   │   ├── adapters/
│   │   │   └── heart_disease.py # Cleveland notebook adapter
│   │   └── schemas/
│   │       ├── requests.py      # Pydantic request models
│   │       └── responses.py     # Pydantic response models
│   ├── sample_data/
│   │   └── processed_cleveland_heart_disease.csv # Offline benchmark backup
│   ├── tests/
│   │   ├── test_profiler.py     # Unit tests for profiling & models
│   │   └── test_api.py          # FastAPI testclient integration tests
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header
│   │   │   ├── common/          # Card, StatCard, Badge, EmptyState
│   │   │   └── charts/          # BarMetric, ROC, PR, Heatmap, ConfusionMatrix,
│   │   │                        # FeatureImportance, DecisionTreeViewer,
│   │   │                        # ThresholdOptimizer, HeartDiseaseCohortViewer
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx    # Dashboard with workflow steps
│   │   │   ├── DatasetsPage.tsx    # Upload & profiling with pagination
│   │   │   ├── ExplorationPage.tsx # EDA, histograms, heatmap & cohorts
│   │   │   ├── AnalysisPage.tsx    # Model configuration & deep-dive
│   │   │   ├── ReportsPage.tsx     # PDF report & clean CSV download
│   │   │   └── SettingsPage.tsx    # Project documentation & disclaimer
│   │   ├── services/api.ts      # Fetch API service
│   │   └── types/index.ts       # TypeScript definitions
│   └── package.json
└── README.md
```

---

## Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run automated test suite
PYTHONPATH=app pytest -v tests/

# Launch FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API documentation will be accessible at `http://localhost:8000/docs`.

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend

# Install npm dependencies
npm install

# Run Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and uptime |
| `GET` | `/api/datasets` | List all available / previously uploaded datasets |
| `POST` | `/api/datasets/upload` | Ingest new CSV or Excel medical dataset |
| `POST` | `/api/datasets/example/heart-disease` | Load UCI Cleveland Heart Disease benchmark |
| `GET` | `/api/datasets/{id}/profile` | Retrieve structural, statistical & outlier profile |
| `POST` | `/api/datasets/{id}/recommendations` | Get task recommendations & feature guidance |
| `POST` | `/api/datasets/{id}/analyze` | Train models (Classification, Regression, Clustering) |
| `GET` | `/api/analyses/{id}` | Retrieve completed analysis payload |
| `GET` | `/api/analyses/{id}/report` | Retrieve structured report summary JSON |
| `GET` | `/api/analyses/{id}/pdf` | Download official publication-style PDF report |
| `GET` | `/api/analyses/{id}/export/clean-csv` | Download preprocessed, clean CSV dataset |

---

## Machine Learning & Statistical Safeguards

1. **Zero Data Leakage**:
   All imputation statistics (medians for numericals, modes for categoricals) and feature scalers (`StandardScaler`, `MinMaxScaler`) are fitted strictly on training subsets and subsequently transformed onto unseen test partitions.
2. **Stratification**:
   Classification holdouts utilize stratified sampling preserving real-world disease incidence ratios.
3. **Threshold Optimization**:
   Calibrates decision boundary probability $\tau$ to maximize clinical sensitivity (Recall) while preserving $\ge 80\%$ Precision, directly addressing clinical alarm fatigue.
4. **Transparent Decision Rules**:
   Decision trees extract interpretable node splits (Gini impurity, sample counts, threshold criteria) for clinical audit trails.

---

## Academic & Ethical Disclaimer

MediAnalytics is engineered exclusively for educational and academic research demonstration (**DMBI CA2**). The algorithmic classifications, continuous predictions, and cluster assignments represent mathematical approximations and do not constitute clinical diagnostic guidance or therapeutic recommendations.
