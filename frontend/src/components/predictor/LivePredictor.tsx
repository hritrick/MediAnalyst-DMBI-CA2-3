import React, { useState, useEffect } from 'react';
import { ColumnProfile, AnalysisResponse, PredictionResponse } from '../../types';
import { predictRecord } from '../../services/api';
import { Card } from '../common/Card';
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
  ChevronDown,
  Plus,
  Trash2,
  SlidersHorizontal
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

  // Exclude target and identifier columns strictly so target never appears as an input
  const targetCol = (analysis.target_column || 'target').toLowerCase();
  const featureCols = profile.columns.filter((c) => {
    const cLow = c.name.toLowerCase();
    return (
      !c.is_id &&
      !c.is_constant &&
      cLow !== targetCol &&
      !cLow.includes('target') &&
      cLow !== 'num' &&
      c.suggested_role !== 'target_candidate'
    );
  });

  // Active parameter keys added by user (start with just 'age')
  const defaultInitialParam = featureCols.find((c) => c.name.toLowerCase() === 'age')?.name || featureCols[0]?.name || '';
  const [activeParamKeys, setActiveParamKeys] = useState<string[]>(
    defaultInitialParam ? [defaultInitialParam] : []
  );

  // Form input state
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize values with dataset medians
  const initializeDefaults = () => {
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
  };

  useEffect(() => {
    initializeDefaults();
    if (defaultInitialParam) {
      setActiveParamKeys([defaultInitialParam]);
    }
    setPredictionResult(null);
    setErrorMsg(null);
  }, [analysis.analysis_id]);

  const handleInputChange = (colName: string, value: any) => {
    setInputValues((prev) => ({
      ...prev,
      [colName]: value
    }));
  };

  // Add next parameter
  const handleAddParameter = () => {
    const nextCol = featureCols.find((c) => !activeParamKeys.includes(c.name));
    if (nextCol) {
      setActiveParamKeys([...activeParamKeys, nextCol.name]);
    }
  };

  // Add all remaining parameters
  const handleAddAllParameters = () => {
    setActiveParamKeys(featureCols.map((c) => c.name));
  };

  // Change parameter for a specific row
  const handleChangeParamForRow = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    setActiveParamKeys((prev) => prev.map((k) => (k === oldKey ? newKey : k)));
  };

  // Remove parameter from user's list
  const handleRemoveParameter = (keyToRemove: string) => {
    setActiveParamKeys((prev) => prev.filter((k) => k !== keyToRemove));
  };

  // Quick Presets
  const applyPreset = (presetType: 'high' | 'low') => {
    if (presetType === 'high') {
      setActiveParamKeys(featureCols.map((c) => c.name));
      setInputValues({
        age: 63,
        sex: 1,
        cp: 4,
        trestbps: 160,
        chol: 286,
        fbs: 1,
        restecg: 2,
        thalach: 108,
        exang: 1,
        oldpeak: 2.6,
        slope: 2,
        ca: 2,
        thal: 7
      });
    } else {
      setActiveParamKeys(featureCols.map((c) => c.name));
      setInputValues({
        age: 38,
        sex: 0,
        cp: 2,
        trestbps: 118,
        chol: 195,
        fbs: 0,
        restecg: 0,
        thalach: 178,
        exang: 0,
        oldpeak: 0.2,
        slope: 1,
        ca: 0,
        thal: 3
      });
    }
    setPredictionResult(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setErrorMsg(null);

    // Any feature not in activeParamKeys automatically takes dataset median
    const completeInputs: Record<string, any> = {};
    featureCols.forEach((col) => {
      if (activeParamKeys.includes(col.name) && inputValues[col.name] !== undefined) {
        completeInputs[col.name] = inputValues[col.name];
      } else {
        completeInputs[col.name] = col.median_value ?? (col.top_categories?.[0]?.category ?? 0);
      }
    });

    try {
      const res = await predictRecord(analysis.analysis_id, {
        model_name: selectedModel,
        inputs: completeInputs
      });
      setPredictionResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Prediction failed. Ensure the backend model bundle is available.');
    } finally {
      setIsPredicting(false);
    }
  };

  const unaddedCols = featureCols.filter((c) => !activeParamKeys.includes(c.name));

  return (
    <Card
      title="Live Patient Risk Predictor (Dynamic Parameter Builder)"
      subtitle="Input known patient parameters one by one using dropdown selectors. Unspecified features automatically take safe dataset medians."
    >
      <div className="space-y-6">
        {/* Target Outcome Clarification */}
        <div className="bg-forest-50/80 border border-forest-200/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center text-white shrink-0">
              <Heart className="w-5 h-5 fill-white text-forest-700" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-forest-800 uppercase tracking-widest block">
                Target Clinical Outcome Being Evaluated
              </span>
              <h4 className="text-sm font-bold text-maintext">
                Cardiovascular Heart Disease (Presence [1] vs Absence [0])
              </h4>
              <p className="text-[11px] text-subtext mt-0.5">
                Outcome is disease risk likelihood. Patient attributes (like Age, Sex, Cholesterol) are purely input predictors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-subtext">Algorithm:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs bg-cardbg border border-lineborder rounded px-2.5 py-1.5 font-medium text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m} {m === analysis.best_model?.name ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-warmbg/40 rounded-lg border border-lineborder text-xs">
          <span className="font-semibold text-maintext">Quick Clinical Demonstration Presets:</span>
          <div className="flex flex-wrap items-center gap-2">
            {profile.is_cleveland_heart_disease && (
              <>
                <button
                  type="button"
                  onClick={() => applyPreset('high')}
                  className="px-3 py-1.5 rounded bg-red-50 text-red-800 border border-red-200 font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5 text-[11px]"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>High-Risk Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('low')}
                  className="px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-[11px]"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Low-Risk Profile</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                initializeDefaults();
                setActiveParamKeys(defaultInitialParam ? [defaultInitialParam] : []);
                setPredictionResult(null);
              }}
              className="px-3 py-1.5 rounded bg-cardbg text-subtext border border-lineborder hover:text-maintext hover:bg-warmbg transition-colors flex items-center gap-1.5 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset (Start with Age Only)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Parameter List Table (Vercel Env Variable Style) */}
        <div className="border border-lineborder rounded-lg overflow-hidden bg-cardbg shadow-xs">
          <div className="px-4 py-3 bg-warmbg/60 border-b border-lineborder flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-forest-700" />
              <span className="text-xs font-bold text-maintext uppercase tracking-wider font-mono">
                Active Patient Parameters ({activeParamKeys.length} of {featureCols.length} Added)
              </span>
            </div>
            <span className="text-[11px] text-subtext font-mono">
              Unspecified parameters use cohort medians
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-warmbg/70 text-subtext uppercase text-[10px] font-sans border-b border-lineborder">
                <tr>
                  <th className="py-2.5 px-3 w-72">Clinical Parameter (Dropdown)</th>
                  <th className="py-2.5 px-3 w-56">Input Value & Specific Unit</th>
                  <th className="py-2.5 px-3">Dataset Reference Range</th>
                  <th className="py-2.5 px-3 text-right w-16">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lineborder text-xs">
                {activeParamKeys.map((paramKey, idx) => {
                  const col = featureCols.find((c) => c.name === paramKey);
                  if (!col) return null;

                  const clevelandMeta = profile.is_cleveland_heart_disease ? CLEVELAND_METADATA[col.name] : null;
                  const label = clevelandMeta?.label || col.name;
                  const unit = clevelandMeta?.unit || '';
                  const options = clevelandMeta?.options;
                  const currentValue = inputValues[col.name];

                  return (
                    <tr key={`${col.name}-${idx}`} className="hover:bg-warmbg/30 transition-colors">
                      {/* Parameter Selector Dropdown */}
                      <td className="py-2.5 px-3">
                        <select
                          value={col.name}
                          onChange={(e) => handleChangeParamForRow(col.name, e.target.value)}
                          className="w-full text-xs bg-warmbg/40 border border-lineborder rounded px-2.5 py-1.5 text-maintext font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-forest-600"
                        >
                          <option value={col.name}>
                            {col.name} — {label} {unit ? `(${unit})` : ''}
                          </option>
                          {unaddedCols.map((otherCol) => {
                            const otherMeta = profile.is_cleveland_heart_disease ? CLEVELAND_METADATA[otherCol.name] : null;
                            const otherLabel = otherMeta?.label || otherCol.name;
                            const otherUnit = otherMeta?.unit ? ` (${otherMeta.unit})` : '';
                            return (
                              <option key={otherCol.name} value={otherCol.name}>
                                {otherCol.name} — {otherLabel}{otherUnit}
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      {/* Value Input */}
                      <td className="py-2.5 px-3">
                        {options && options.length > 0 ? (
                          <select
                            value={currentValue !== undefined ? String(currentValue) : ''}
                            onChange={(e) => handleInputChange(col.name, e.target.value)}
                            className="w-full text-xs bg-cardbg border border-lineborder rounded px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
                          >
                            {options.map((opt) => (
                              <option key={String(opt.val)} value={String(opt.val)}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={col.min_value != null && col.min_value % 1 !== 0 ? '0.1' : '1'}
                              value={currentValue !== undefined ? currentValue : ''}
                              onChange={(e) => handleInputChange(col.name, e.target.value)}
                              placeholder="Value"
                              className="w-28 text-xs bg-cardbg border border-lineborder rounded px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600 font-semibold"
                            />
                            {unit && (
                              <span className="text-[11px] font-mono font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200/60">
                                {unit}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Reference Range */}
                      <td className="py-2.5 px-3 text-subtext text-[11px] font-mono">
                        {col.min_value !== undefined && col.max_value !== undefined ? (
                          <span>
                            Range: <b>{col.min_value}</b>–<b>{col.max_value}</b>{' '}
                            {col.median_value !== undefined && (
                              <span className="text-forest-800 font-semibold">(Cohort Median: {col.median_value})</span>
                            )}
                          </span>
                        ) : (
                          <span>{col.inferred_type}</span>
                        )}
                      </td>

                      {/* Remove Button */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(col.name)}
                          title="Remove parameter (will use cohort median)"
                          className="p-1 rounded text-subtext hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add Parameter Button Bar (Below the last parameter) */}
          <div className="p-3 bg-warmbg/30 border-t border-lineborder flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddParameter}
              disabled={unaddedCols.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cardbg border border-forest-600 text-forest-800 rounded-md text-xs font-bold hover:bg-forest-50 transition-colors shadow-xs disabled:opacity-40"
            >
              <Plus className="w-4 h-4 text-forest-700" />
              <span>+ Add Parameter</span>
            </button>

            {unaddedCols.length > 0 && (
              <button
                type="button"
                onClick={handleAddAllParameters}
                className="text-xs text-forest-800 font-semibold hover:underline"
              >
                Add all remaining ({unaddedCols.length}) parameters
              </button>
            )}
          </div>
        </div>

        {/* Prediction Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-subtext">
            <span>Evaluating risk for target: </span>
            <b className="text-maintext font-bold">Cardiovascular Disease (Heart Disease)</b>
          </div>

          <button
            type="button"
            onClick={handlePredict}
            disabled={isPredicting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-forest-700 text-white text-xs font-bold hover:bg-forest-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isPredicting ? 'Calculating Risk Probability...' : 'Predict Cardiovascular Disease Risk'}</span>
          </button>
        </div>

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
                  ? 'bg-red-50/90 border-red-200 text-red-950'
                  : predictionResult.risk_color === 'warning'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                    predictionResult.risk_color === 'danger'
                      ? 'bg-red-600'
                      : predictionResult.risk_color === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase block opacity-80">
                    Clinical Diagnostic Evaluation — {predictionResult.model_name}
                  </span>
                  <h3 className="text-2xl font-black tracking-tight">
                    {predictionResult.risk_tier || predictionResult.prediction_label}
                  </h3>
                  <span className="text-xs font-semibold block mt-0.5">
                    Outcome: {predictionResult.prediction === 1 ? 'Positive for Heart Disease (Presence)' : 'Negative for Heart Disease (Absence)'}
                  </span>
                </div>
              </div>

              {predictionResult.probability_formatted && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Cardiovascular Disease Risk Probability
                  </span>
                  <span className="text-3xl font-black font-mono">
                    {predictionResult.probability_formatted}
                  </span>
                </div>
              )}
            </div>

            {/* Recommendation & Clinical Action Policy */}
            <div className="p-5 space-y-4">
              <div className="p-4 bg-warmbg/60 rounded-md border border-lineborder">
                <span className="text-xs font-bold text-maintext uppercase tracking-wider block mb-1">
                  Clinical Action Recommendation (Report Section 8.5):
                </span>
                <p className="text-xs text-maintext leading-relaxed font-sans">
                  {predictionResult.recommendation}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-subtext font-mono pt-1">
                <span>
                  Evaluated with {activeParamKeys.length} user-specified parameters (remaining {featureCols.length - activeParamKeys.length} defaulted to cohort medians).
                </span>
                <span>
                  Model: <b>{predictionResult.model_name}</b>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
