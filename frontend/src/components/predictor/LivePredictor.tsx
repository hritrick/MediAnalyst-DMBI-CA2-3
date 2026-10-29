import React, { useState, useEffect } from 'react';
import { ColumnProfile, AnalysisResponse, PredictionResponse } from '../../types';
import { predictRecord } from '../../services/api';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Heart,
  ShieldAlert,
  Sliders,
  ChevronDown
} from 'lucide-react';

interface LivePredictorProps {
  analysis: AnalysisResponse;
  profile: {
    columns: ColumnProfile[];
    filename: string;
    is_cleveland_heart_disease?: boolean;
  };
}

// Friendly clinical metadata for Cleveland Heart Disease attributes
const CLEVELAND_METADATA: Record<string, { label: string; unit?: string; options?: { val: any; label: string }[] }> = {
  age: { label: 'Patient Age', unit: 'years' },
  sex: {
    label: 'Biological Sex',
    options: [
      { val: 1, label: '1 - Male' },
      { val: 0, label: '0 - Female' }
    ]
  },
  cp: {
    label: 'Chest Pain Type (cp)',
    options: [
      { val: 1, label: '1 - Typical Angina' },
      { val: 2, label: '2 - Atypical Angina' },
      { val: 3, label: '3 - Non-Anginal Pain' },
      { val: 4, label: '4 - Asymptomatic (High Risk)' }
    ]
  },
  trestbps: { label: 'Resting Blood Pressure', unit: 'mm Hg' },
  chol: { label: 'Serum Cholesterol', unit: 'mg/dl' },
  fbs: {
    label: 'Fasting Blood Sugar > 120 mg/dl',
    options: [
      { val: 1, label: '1 - True (> 120 mg/dl)' },
      { val: 0, label: '0 - False (<= 120 mg/dl)' }
    ]
  },
  restecg: {
    label: 'Resting ECG Results',
    options: [
      { val: 0, label: '0 - Normal' },
      { val: 1, label: '1 - ST-T Wave Abnormality' },
      { val: 2, label: '2 - Left Ventricular Hypertrophy' }
    ]
  },
  thalach: { label: 'Max Heart Rate Achieved', unit: 'bpm' },
  exang: {
    label: 'Exercise-Induced Angina',
    options: [
      { val: 1, label: '1 - Yes' },
      { val: 0, label: '0 - No' }
    ]
  },
  oldpeak: { label: 'ST Depression (oldpeak)', unit: 'mm' },
  slope: {
    label: 'Peak Exercise ST Slope',
    options: [
      { val: 1, label: '1 - Upsloping' },
      { val: 2, label: '2 - Flat' },
      { val: 3, label: '3 - Downsloping' }
    ]
  },
  ca: {
    label: 'Fluoroscopy Major Vessels (ca)',
    options: [
      { val: 0, label: '0 - No vessels colored' },
      { val: 1, label: '1 - One vessel' },
      { val: 2, label: '2 - Two vessels' },
      { val: 3, label: '3 - Three vessels' }
    ]
  },
  thal: {
    label: 'Thallium Stress Test (thal)',
    options: [
      { val: 3, label: '3 - Normal' },
      { val: 6, label: '6 - Fixed Defect' },
      { val: 7, label: '7 - Reversible Defect (Ischemia)' }
    ]
  }
};

export const LivePredictor: React.FC<LivePredictorProps> = ({ analysis, profile }) => {
  const availableModels = Object.keys(analysis.model_results || {});
  const [selectedModel, setSelectedModel] = useState<string>(
    analysis.best_model?.name || availableModels[0] || 'Random Forest'
  );

  // Determine predictor columns from the trained analysis summary
  const targetCol = analysis.target_column || '';
  const featureCols = profile.columns.filter(
    (c) => !c.is_id && !c.is_constant && c.name !== targetCol
  );

  // Form input state initialized with dataset medians/defaults
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset to dataset median/mode defaults
  const resetToMedians = () => {
    const initial: Record<string, any> = {};
    featureCols.forEach((col) => {
      if (col.inferred_type === 'numeric') {
        initial[col.name] = col.median_value ?? col.mean_value ?? 0;
      } else if (col.top_categories && col.top_categories.length > 0) {
        initial[col.name] = col.top_categories[0].category;
      } else if (col.sample_values && col.sample_values.length > 0) {
        initial[col.name] = col.sample_values[0];
      } else {
        initial[col.name] = 0;
      }
    });
    setInputValues(initial);
    setPredictionResult(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    resetToMedians();
  }, [analysis.analysis_id]);

  const handleInputChange = (colName: string, value: any) => {
    setInputValues((prev) => ({
      ...prev,
      [colName]: value
    }));
  };

  // Quick Presets for Cleveland Heart Disease
  const applyPreset = (presetType: 'high' | 'low') => {
    if (presetType === 'high') {
      setInputValues({
        age: 63,
        sex: 1,
        cp: 4, // asymptomatic angina
        trestbps: 160,
        chol: 286,
        fbs: 1,
        restecg: 2,
        thalach: 108, // low max heart rate
        exang: 1, // exercise induced angina
        oldpeak: 2.6, // elevated ST depression
        slope: 2,
        ca: 2, // 2 major vessels colored
        thal: 7 // reversible defect
      });
    } else {
      setInputValues({
        age: 38,
        sex: 0,
        cp: 2,
        trestbps: 118,
        chol: 195,
        fbs: 0,
        restecg: 0,
        thalach: 178, // healthy elevated heart rate
        exang: 0,
        oldpeak: 0.2, // minimal ST depression
        slope: 1,
        ca: 0, // 0 vessels colored
        thal: 3 // normal
      });
    }
    setPredictionResult(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setErrorMsg(null);

    try {
      const res = await predictRecord(analysis.analysis_id, {
        model_name: selectedModel,
        inputs: inputValues
      });
      setPredictionResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Prediction failed. Ensure the backend model bundle is available.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <Card
      title="Live Patient Risk Predictor & Clinical Decision Triage"
      subtitle={`Interactive inference engine dynamically configured from the active ${profile.filename} schema`}
    >
      <div className="space-y-6">
        {/* Preset & Model Selector Banner */}
        <div className="bg-warmbg/40 border border-lineborder rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-forest-700" />
            <div>
              <span className="text-xs font-bold text-maintext uppercase tracking-wider block">
                Model for Inference:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="mt-1 text-xs bg-cardbg border border-lineborder rounded px-3 py-1.5 font-medium text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === analysis.best_model?.name ? '★ (Best Performer)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {profile.is_cleveland_heart_disease && (
              <>
                <button
                  type="button"
                  onClick={() => applyPreset('high')}
                  className="px-3 py-1.5 rounded bg-red-50 text-red-800 border border-red-200 font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5 text-[11px]"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>High-Risk Case</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('low')}
                  className="px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-[11px]"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Low-Risk Case</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={resetToMedians}
              className="px-3 py-1.5 rounded bg-cardbg text-subtext border border-lineborder hover:text-maintext hover:bg-warmbg transition-colors flex items-center gap-1.5 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Medians</span>
            </button>
          </div>
        </div>

        {/* Dynamic Patient Input Form */}
        <form onSubmit={handlePredict} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featureCols.map((col) => {
              const clevelandMeta = profile.is_cleveland_heart_disease ? CLEVELAND_METADATA[col.name] : null;
              const fieldLabel = clevelandMeta?.label || col.name;
              const isNumeric = col.inferred_type === 'numeric';
              const options = clevelandMeta?.options || (col.top_categories ? col.top_categories.map((c) => ({ val: c.category, label: `${c.category} (${c.percentage}%)` })) : null);

              return (
                <div key={col.name} className="bg-cardbg border border-lineborder rounded-md p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-maintext truncate" title={fieldLabel}>
                      {fieldLabel}
                    </label>
                    {clevelandMeta?.unit && (
                      <span className="text-[10px] text-subtext font-mono">{clevelandMeta.unit}</span>
                    )}
                  </div>

                  {options && options.length > 0 ? (
                    <select
                      value={inputValues[col.name] !== undefined ? String(inputValues[col.name]) : ''}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
                      className="w-full text-xs bg-warmbg/40 border border-lineborder rounded px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
                    >
                      {options.map((opt) => (
                        <option key={String(opt.val)} value={String(opt.val)}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      step={isNumeric && col.min_value != null && col.min_value % 1 !== 0 ? '0.1' : '1'}
                      value={inputValues[col.name] !== undefined ? inputValues[col.name] : ''}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
                      className="w-full text-xs bg-warmbg/40 border border-lineborder rounded px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
                    />
                  )}

                  <div className="flex items-center justify-between text-[10px] text-subtext font-mono pt-0.5">
                    {col.min_value !== undefined && col.max_value !== undefined ? (
                      <span>Range: {col.min_value}–{col.max_value}</span>
                    ) : (
                      <span>{col.inferred_type}</span>
                    )}
                    {col.median_value !== undefined && <span>Med: {col.median_value}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-subtext">
              Predicting for target outcome: <b className="text-maintext font-mono">{targetCol || 'Class'}</b>
            </span>

            <button
              type="submit"
              disabled={isPredicting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPredicting ? 'Calculating Risk Probability...' : 'Predict Patient Risk'}</span>
            </button>
          </div>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded">
            {errorMsg}
          </div>
        )}

        {/* Prediction Results Banner */}
        {predictionResult && (
          <div className="mt-6 border border-lineborder rounded-lg bg-cardbg overflow-hidden shadow-sm animate-in fade-in duration-300">
            {/* Top Risk Header */}
            <div
              className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                predictionResult.risk_color === 'danger'
                  ? 'bg-red-50/80 border-red-200 text-red-950'
                  : predictionResult.risk_color === 'warning'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                    predictionResult.risk_color === 'danger'
                      ? 'bg-red-600'
                      : predictionResult.risk_color === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase block opacity-80">
                    Clinical Triage Evaluation — {predictionResult.model_name}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight">
                    {predictionResult.risk_tier || predictionResult.prediction_label}
                  </h3>
                </div>
              </div>

              {predictionResult.probability_formatted && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Disease Probability Score
                  </span>
                  <span className="text-2xl font-black font-mono">
                    {predictionResult.probability_formatted}
                  </span>
                </div>
              )}
            </div>

            {/* Recommendation & Clinical Action Policy */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-warmbg/60 rounded-md border border-lineborder">
                <span className="text-xs font-bold text-maintext uppercase tracking-wider block mb-1">
                  Clinical Action Recommendation (Report Section 8.5):
                </span>
                <p className="text-xs text-maintext leading-relaxed">
                  {predictionResult.recommendation}
                </p>
              </div>

              {/* Threshold Alignment Note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-subtext font-mono pt-1">
                <span>
                  Evaluated Class Outcome:{' '}
                  <b className="text-maintext font-bold">{predictionResult.prediction_label}</b>
                </span>
                <span>
                  Trained Baseline: <b>{analysis.best_model?.name}</b> (F1: {analysis.best_model?.score})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
