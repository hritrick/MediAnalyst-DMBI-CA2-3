import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DatasetProfile,
  RecommendationsResponse,
  AnalysisRequest,
  AnalysisResponse
} from '../types';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BarMetricChart } from '../components/charts/BarMetricChart';
import { RocCurveChart } from '../components/charts/RocCurveChart';
import { PrecisionRecallChart } from '../components/charts/PrecisionRecallChart';
import { ConfusionMatrixDisplay } from '../components/charts/ConfusionMatrixDisplay';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { DecisionTreeViewer } from '../components/charts/DecisionTreeViewer';
import { ThresholdOptimizerViewer } from '../components/charts/ThresholdOptimizerViewer';
import { LivePredictor } from '../components/predictor/LivePredictor';
import {
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Database
} from 'lucide-react';

interface AnalysisPageProps {
  profile: DatasetProfile | null;
  recommendations: RecommendationsResponse | null;
  currentAnalysis: AnalysisResponse | null;
  isAnalyzing: boolean;
  onRunAnalysis: (req: AnalysisRequest) => Promise<void>;
  onLoadExample: () => Promise<void>;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  profile,
  recommendations,
  currentAnalysis,
  isAnalyzing,
  onRunAnalysis,
  onLoadExample
}) => {
  const navigate = useNavigate();

  // Form State
  const [taskType, setTaskType] = useState<'classification' | 'regression' | 'clustering'>('classification');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [testSize, setTestSize] = useState<number>(0.20);
  const [randomState, setRandomState] = useState<number>(42);
  const [targetBinarize, setTargetBinarize] = useState<boolean>(false);
  const [thresholdTuning, setThresholdTuning] = useState<boolean>(true);
  const [precisionGoal, setPrecisionGoal] = useState<number>(0.80);
  const [selectedModelInspect, setSelectedModelInspect] = useState<string>('Random Forest');

  // Initialize defaults based on profile & recommendations
  useEffect(() => {
    if (!profile) return;

    // Default target: Prioritize clinical disease outcomes (target, disease, diagnosis, num) over demographic binary flags like sex
    const priorityTargets = ['target', 'target_binary', 'num', 'diagnosis', 'disease', 'outcome', 'class', 'risk'];
    const exactTarget = profile.columns.find((c) =>
      priorityTargets.includes(c.name.toLowerCase())
    );
    const targetCand = exactTarget || profile.columns.find((c) => c.suggested_role === 'target_candidate' && !['sex', 'gender'].includes(c.name.toLowerCase()));
    const defaultTarget = exactTarget ? exactTarget.name : targetCand ? targetCand.name : profile.columns[profile.columns.length - 1]?.name || '';
    setTargetColumn(defaultTarget);

    // Default features: exclude constant, id, and target
    const validFeatures = profile.columns
      .filter((c) => !c.is_constant && !c.is_id && c.name !== defaultTarget)
      .map((c) => c.name);
    setSelectedFeatures(validFeatures);

    // Cleveland defaults
    if (profile.is_cleveland_heart_disease) {
      setTargetBinarize(true);
      setTaskType('classification');
      setTargetColumn('target');
      setSelectedModels(['Logistic Regression', 'Decision Tree', 'Random Forest']);
    } else {
      setSelectedModels(['Logistic Regression', 'Decision Tree', 'Random Forest']);
    }
  }, [profile]);

  // Update selected models when task type changes
  const handleTaskChange = (newTask: 'classification' | 'regression' | 'clustering') => {
    setTaskType(newTask);
    if (newTask === 'classification') {
      setSelectedModels(['Logistic Regression', 'Decision Tree', 'Random Forest']);
    } else if (newTask === 'regression') {
      setSelectedModels(['Linear Regression', 'Decision Tree Regressor', 'Random Forest Regressor']);
    } else {
      setSelectedModels(['K-Means', 'Hierarchical Clustering']);
    }
  };

  const toggleFeature = (col: string) => {
    if (selectedFeatures.includes(col)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  const selectAllFeatures = () => {
    if (!profile) return;
    const all = profile.columns
      .filter((c) => !c.is_constant && !c.is_id && c.name !== targetColumn)
      .map((c) => c.name);
    setSelectedFeatures(all);
  };

  const clearAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const toggleModel = (modelName: string) => {
    if (selectedModels.includes(modelName)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter((m) => m !== modelName));
      }
    } else {
      setSelectedModels([...selectedModels, modelName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const req: AnalysisRequest = {
      task_type: taskType,
      target_column: taskType !== 'clustering' ? targetColumn : null,
      feature_columns: selectedFeatures,
      models: selectedModels,
      test_size: testSize,
      random_state: randomState,
      stratify: true,
      imputer_strategy: 'median',
      scaler: 'standard',
      target_binarize: targetBinarize,
      threshold_tuning: thresholdTuning,
      target_precision_goal: precisionGoal
    };
    await onRunAnalysis(req);
  };

  if (!profile) {
    return (
      <EmptyState
        title="No Dataset Loaded for Analysis"
        description="Please load or upload a medical dataset to configure machine-learning models and evaluation metrics."
        actionText="Load Cleveland Heart Disease Benchmark"
        onAction={onLoadExample}
        icon={<Database className="w-6 h-6" />}
      />
    );
  }

  const activeRec = recommendations?.recommendations.find((r) => r.task_type === taskType);
  const targetColProfile = profile.columns.find((c) => c.name === targetColumn);

  // Model inspection list
  const availableModelsInResult = currentAnalysis?.model_results ? Object.keys(currentAnalysis.model_results) : [];
  const inspectModelData = currentAnalysis?.model_results?.[selectedModelInspect] || 
    (availableModelsInResult.length > 0 ? currentAnalysis?.model_results[availableModelsInResult[0]] : null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Configuration Form Card */}
      <Card
        title="Configure Clinical Analysis & Model Pipeline"
        subtitle={`Dataset: ${profile.filename} (${profile.row_count} records)`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Task Type Selector */}
          <div>
            <label className="text-xs font-semibold text-maintext uppercase tracking-wider block mb-2">
              1. Analytical Problem Formulation
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { type: 'classification', title: 'Classification (Diagnosis)', desc: 'Predict discrete disease state or risk class' },
                { type: 'regression', title: 'Regression (Biomarker)', desc: 'Predict continuous clinical or recovery metric' },
                { type: 'clustering', title: 'Clustering (Phenotyping)', desc: 'Unsupervised patient cohort discovery' },
              ].map((t) => (
                <div
                  key={t.type}
                  onClick={() => handleTaskChange(t.type as any)}
                  className={`p-3.5 rounded-md border cursor-pointer transition-all ${
                    taskType === t.type
                      ? 'bg-forest-50/70 border-forest-600 shadow-sm'
                      : 'bg-warmbg/40 border-lineborder hover:border-forest-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-maintext">{t.title}</span>
                    <input
                      type="radio"
                      checked={taskType === t.type}
                      onChange={() => handleTaskChange(t.type as any)}
                      className="text-forest-700"
                    />
                  </div>
                  <p className="text-[11px] text-subtext">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Rationale Callout */}
          {activeRec && (
            <div className="p-3 bg-forest-50/80 rounded border border-forest-200/70 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-forest-900">
                  Automated Recommendation ({activeRec.confidence} confidence):{' '}
                </span>
                <span className="text-forest-800">{activeRec.reason}</span>
              </div>
            </div>
          )}

          {/* 2. Target Column Selection (for Supervised Tasks) */}
          {taskType !== 'clustering' && (
            <div className="bg-warmbg/40 rounded-md border border-lineborder p-4 space-y-3">
              <label className="text-xs font-semibold text-maintext uppercase tracking-wider block">
                2. Target / Outcome Clinical Variable
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <select
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    className="w-full text-xs bg-cardbg border border-lineborder rounded-md px-3 py-2 text-maintext font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 font-mono"
                  >
                    {profile.columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.inferred_type}, {c.unique_count} unique) {c.suggested_role === 'target_candidate' ? '★ recommended' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Binarization Toggle for Classification */}
                {taskType === 'classification' && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-maintext">
                    <input
                      type="checkbox"
                      checked={targetBinarize}
                      onChange={(e) => setTargetBinarize(e.target.checked)}
                      className="rounded text-forest-700 focus:ring-forest-600"
                    />
                    <span className="font-medium">
                      Binarize Target (target &gt; 0 = 1, presence vs absence)
                    </span>
                  </label>
                )}
              </div>

              {/* Target Diagnostics */}
              {targetColProfile && (
                <div className="text-[11px] text-subtext font-mono flex items-center gap-4 pt-1">
                  <span>Unique Classes: <b>{targetColProfile.unique_count}</b></span>
                  <span>Missing Values: <b>{targetColProfile.missing_count}</b></span>
                  <span>Inferred Type: <b>{targetColProfile.inferred_type}</b></span>
                </div>
              )}
            </div>
          )}

          {/* 3. Feature Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-maintext uppercase tracking-wider">
                3. Clinical Predictor Features ({selectedFeatures.length} Selected)
              </label>
              <div className="space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllFeatures}
                  className="text-forest-700 font-semibold hover:underline"
                >
                  Select All
                </button>
                <span className="text-subtext">|</span>
                <button
                  type="button"
                  onClick={clearAllFeatures}
                  className="text-subtext hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-warmbg/30 rounded border border-lineborder">
              {profile.columns
                .filter((c) => !c.is_constant && !c.is_id && c.name !== targetColumn)
                .map((c) => {
                  const isChecked = selectedFeatures.includes(c.name);
                  return (
                    <label
                      key={c.name}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-cardbg border-forest-300 font-medium text-maintext'
                          : 'bg-warmbg/60 border-lineborder text-subtext'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeature(c.name)}
                        className="rounded text-forest-700"
                      />
                      <span className="truncate" title={c.name}>
                        {c.name}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* 4. Model Suite Selection */}
          <div>
            <label className="text-xs font-semibold text-maintext uppercase tracking-wider block mb-2">
              4. Algorithms to Train & Benchmark
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(taskType === 'classification'
                ? ['Logistic Regression', 'Decision Tree', 'Random Forest']
                : taskType === 'regression'
                ? ['Linear Regression', 'Decision Tree Regressor', 'Random Forest Regressor']
                : ['K-Means', 'Hierarchical Clustering']
              ).map((mName) => {
                const isSelected = selectedModels.includes(mName);
                return (
                  <label
                    key={mName}
                    className={`flex items-center gap-2.5 p-3 rounded-md border cursor-pointer ${
                      isSelected
                        ? 'bg-forest-50/60 border-forest-400 font-medium text-forest-900'
                        : 'bg-warmbg/40 border-lineborder text-subtext'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModel(mName)}
                      className="rounded text-forest-700"
                    />
                    <span className="text-xs">{mName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 5. Preprocessing & Partitioning Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-lineborder">
            <div>
              <label className="text-[11px] font-semibold text-maintext block mb-1">
                Train-Test Partition (Test Ratio)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.10"
                  max="0.40"
                  step="0.05"
                  value={testSize}
                  onChange={(e) => setTestSize(parseFloat(e.target.value))}
                  className="w-full accent-forest-700"
                />
                <span className="text-xs font-mono font-semibold text-maintext w-12">
                  {(testSize * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-maintext block mb-1">
                Reproducibility Seed
              </label>
              <input
                type="number"
                value={randomState}
                onChange={(e) => setRandomState(parseInt(e.target.value) || 42)}
                className="w-full text-xs bg-cardbg border border-lineborder rounded px-2.5 py-1.5 font-mono text-maintext"
              />
            </div>

            {taskType === 'classification' && (
              <div>
                <label className="text-[11px] font-semibold text-maintext block mb-1">
                  Clinical Threshold Tuning
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={thresholdTuning}
                    onChange={(e) => setThresholdTuning(e.target.checked)}
                    className="rounded text-forest-700"
                  />
                  <span className="text-xs text-subtext">Calibrate τ for ≥80% Precision</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-lineborder">
            <button
              type="submit"
              disabled={isAnalyzing || selectedFeatures.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isAnalyzing ? 'Executing Model Suite...' : 'Run Clinical Models & Analysis'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Execution Results View */}
      {isAnalyzing ? (
        <LoadingSpinner label="Fitting preprocessing transformations and training model estimators..." />
      ) : currentAnalysis ? (
        <div className="space-y-8">
          {/* Results Summary Banner */}
          <div className="bg-cardbg rounded-lg border border-lineborder p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-clinicsuccess" />
                <span>Evaluation Completed Successfully</span>
              </div>
              <h3 className="text-lg font-bold text-maintext tracking-tight">
                Model Benchmarking Results — Analysis {currentAnalysis.analysis_id}
              </h3>
              <p className="text-xs text-subtext mt-1">
                Evaluated on {currentAnalysis.dataset_summary?.train_samples} training patients and{' '}
                {currentAnalysis.dataset_summary?.test_samples} independent test samples across{' '}
                {currentAnalysis.dataset_summary?.engineered_features} features.
              </p>
            </div>

            {currentAnalysis.best_model && (
              <div className="p-3 bg-forest-50 border border-forest-200 rounded-md text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-forest-800 tracking-wider block">
                  Top Performing Model
                </span>
                <span className="text-base font-bold text-maintext font-mono block">
                  {currentAnalysis.best_model.name}
                </span>
                <span className="text-xs text-subtext font-mono">
                  {currentAnalysis.best_model.primary_metric}: <b>{currentAnalysis.best_model.score}</b>
                </span>
              </div>
            )}
          </div>

          {/* Model Comparison Table */}
          <Card
            title="Model Performance Comparison Table"
            subtitle="Side-by-side empirical metrics computed on the unseen test partition"
            action={
              <button
                onClick={() => navigate('/reports')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-warmbg border border-lineborder text-forest-800 text-xs font-semibold hover:bg-forest-50/80 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Official Report</span>
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-lineborder bg-warmbg/60 text-subtext uppercase text-[10px] font-sans">
                    {currentAnalysis.comparison_table.length > 0 &&
                      Object.keys(currentAnalysis.comparison_table[0]).map((h) => (
                        <th key={h} className="py-2.5 px-3">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-lineborder">
                  {currentAnalysis.comparison_table.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-warmbg/30 ${
                        row.Model === currentAnalysis.best_model?.name ? 'bg-forest-50/50 font-semibold' : ''
                      }`}
                    >
                      {Object.entries(row).map(([k, v]) => (
                        <td key={k} className="py-2.5 px-3 text-maintext">
                          {String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Scientific Interpretation */}
            <div className="mt-4 p-3.5 bg-warmbg/50 rounded-md border border-lineborder text-xs text-maintext leading-relaxed font-sans">
              <b>Statistical & Clinical Interpretation:</b> {currentAnalysis.interpretation}
            </div>
          </Card>

          {/* Metric Comparison Bar Chart */}
          {(() => {
            const executedTask = currentAnalysis.task_type || taskType;
            return (
              <>
                <Card
                  title="Empirical Metric Comparison"
                  subtitle={
                    executedTask === 'classification'
                      ? "Comparing Accuracy, Precision, Recall, F1, and ROC-AUC across models"
                      : executedTask === 'regression'
                      ? "Comparing RMSE, MAE, and R-squared across models"
                      : "Comparing Silhouette Score and Davies-Bouldin Index across clustering algorithms"
                  }
                >
                  <BarMetricChart
                    data={currentAnalysis.comparison_table}
                    metrics={
                      executedTask === 'classification'
                        ? ['Accuracy', 'Precision', 'Recall', 'F1-score', 'ROC-AUC']
                        : executedTask === 'regression'
                        ? ['RMSE', 'MAE', 'R-squared']
                        : ['Silhouette Score', 'Davies-Bouldin Index']
                    }
                  />
                </Card>

                {/* Classification Specific Diagnostic Curves */}
                {executedTask === 'classification' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card
                      title="Receiver Operating Characteristic (ROC)"
                      subtitle="True Positive Rate vs False Positive Rate trade-off across varying decision cutoffs"
                    >
                      <RocCurveChart models={currentAnalysis.model_results} />
                    </Card>

                    <Card
                      title="Precision-Recall Curve"
                      subtitle="Precision vs Sensitivity curve (especially critical for clinical class imbalance)"
                    >
                      <PrecisionRecallChart models={currentAnalysis.model_results} />
                    </Card>
                  </div>
                )}
              </>
            );
          })()}

          {/* Live Patient Risk Predictor (Interactive Clinical Inference) */}
          <LivePredictor
            analysis={currentAnalysis}
            profile={{
              columns: profile.columns,
              filename: profile.filename,
              is_cleveland_heart_disease: profile.is_cleveland_heart_disease
            }}
          />

          {/* Model Deep-Dive Inspector (Confusion Matrix, Tree Rules, Feature Importances) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-maintext uppercase tracking-wider">
                Individual Model Diagnostic Inspection
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-subtext">Inspect Model:</span>
                <select
                  value={selectedModelInspect}
                  onChange={(e) => setSelectedModelInspect(e.target.value)}
                  className="text-xs bg-warmbg border border-lineborder rounded px-2.5 py-1 text-maintext font-medium font-mono"
                >
                  {availableModelsInResult.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {inspectModelData && (
              <div className="space-y-6">
                {/* Confusion Matrix and Feature Importances */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inspectModelData.confusion_matrix && (
                    <ConfusionMatrixDisplay
                      data={inspectModelData.confusion_matrix}
                      modelName={inspectModelData.model_name}
                    />
                  )}

                  {inspectModelData.feature_importances && (
                    <Card
                      title={`Feature Importance — ${inspectModelData.model_name}`}
                      subtitle="Top clinical attributes contributing to predictive decisions"
                    >
                      <FeatureImportanceChart
                        data={inspectModelData.feature_importances}
                        modelName={inspectModelData.model_name}
                      />
                    </Card>
                  )}
                </div>

                {/* Threshold Calibration (Notebook Cell 16) */}
                {inspectModelData.threshold_analysis && (
                  <ThresholdOptimizerViewer
                    analysis={inspectModelData.threshold_analysis}
                    modelName={inspectModelData.model_name}
                  />
                )}

                {/* Decision Tree Rule Hierarchy (Notebook Cell 15) */}
                {inspectModelData.tree_rules && (
                  <Card
                    title="Decision Tree Splitting Logic & Diagnostic Pathways"
                    subtitle="Interpretable clinical audit trail showing patient triage branching"
                  >
                    <DecisionTreeViewer rules={inspectModelData.tree_rules} />
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
