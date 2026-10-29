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
  ChevronDown,
  Plus,
  Trash2,
  FileCode2,
  CornerDownRight
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
  const targetCol = analysis.target_column || 'target';
  const featureCols = profile.columns.filter(
    (c) => !c.is_id && !c.is_constant && c.name.toLowerCase() !== targetCol.toLowerCase()
  );

  // Form input state initialized with dataset medians/defaults
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vercel-style "Add Parameter" state
  const [selectedParamToAdd, setSelectedParamToAdd] = useState<string>(featureCols[0]?.name || '');
  const [tempParamValue, setTempParamValue] = useState<string>('');

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

  useEffect(() => {
    if (featureCols.length > 0 && !selectedParamToAdd) {
      setSelectedParamToAdd(featureCols[0].name);
    }
  }, [featureCols]);

  const handleInputChange = (colName: string, value: any) => {
    setInputValues((prev) => ({
      ...prev,
      [colName]: value
    }));
  };

  // Vercel Env-Variable style Add / Set action
  const handleAddOrUpdateParam = () => {
    if (!selectedParamToAdd) return;
    const colProfile = featureCols.find((c) => c.name === selectedParamToAdd);
    const parsedVal =
      colProfile?.inferred_type === 'numeric'
        ? parseFloat(tempParamValue) || 0
        : tempParamValue;
    handleInputChange(selectedParamToAdd, parsedVal);
    setTempParamValue('');
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

  const selectedColObj = featureCols.find((c) => c.name === selectedParamToAdd);
  const selectedClevelandMeta = profile.is_cleveland_heart_disease ? CLEVELAND_METADATA[selectedParamToAdd] : null;

  return (
    <Card
      title="Live Patient Risk Predictor (Vercel Environment Variable Style)"
      subtitle={`Configure individual patient biometric parameters to predict cardiovascular heart disease probability`}
    >
      <div className="space-y-6">
        {/* 1. Target Outcome Clarification Banner */}
        <div className="bg-forest-50/80 border border-forest-200/80 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-700 flex items-center justify-center text-white shrink-0">
              <Heart className="w-5 h-5 fill-white text-forest-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-forest-800 uppercase tracking-widest">
                  Target Outcome Being Predicted
                </span>
                <span className="px-1.5 py-0.5 rounded bg-forest-200/60 text-forest-900 text-[10px] font-mono font-bold">
                  {targetCol}
                </span>
              </div>
              <h4 className="text-sm font-bold text-maintext">
                Cardiovascular Disease Risk (Heart Disease: Presence [1] vs Absence [0])
              </h4>
              <p className="text-[11px] text-subtext mt-0.5">
                Note: Demographic attributes like Biological Sex (<code className="font-mono">sex</code>) are treated strictly as predictor features, not the target label.
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

        {/* 2. Quick Presets Toolbar */}
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
                  <span>High-Risk Cardiac Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('low')}
                  className="px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-[11px]"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Low-Risk Healthy Baseline</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={resetToMedians}
              className="px-3 py-1.5 rounded bg-cardbg text-subtext border border-lineborder hover:text-maintext hover:bg-warmbg transition-colors flex items-center gap-1.5 text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Dataset Medians</span>
            </button>
          </div>
        </div>

        {/* 3. Vercel-Style "Add / Quick-Set Environment Variable" Input Bar */}
        <div className="bg-cardbg border border-lineborder rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-maintext uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-forest-700" />
            <span>Set Parameter Value (Dropdown Selector)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Dropdown to select which parameter to edit */}
            <div className="md:col-span-5">
              <label className="text-[10px] font-bold text-subtext uppercase block mb-1">
                Select Clinical Parameter (Key)
              </label>
              <select
                value={selectedParamToAdd}
                onChange={(e) => {
                  setSelectedParamToAdd(e.target.value);
                  setTempParamValue(String(inputValues[e.target.value] ?? ''));
                }}
                className="w-full text-xs bg-warmbg/40 border border-lineborder rounded px-3 py-2 text-maintext font-mono font-medium focus:outline-none focus:ring-1 focus:ring-forest-600"
              >
                {featureCols.map((c) => {
                  const meta = profile.is_cleveland_heart_disease ? CLEVELAND_METADATA[c.name] : null;
                  const label = meta?.label || c.name;
                  const unit = meta?.unit ? ` (${meta.unit})` : '';
                  return (
                    <option key={c.name} value={c.name}>
                      {c.name} — {label}{unit}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Input for the value with unit */}
            <div className="md:col-span-5">
              <label className="text-[10px] font-bold text-subtext uppercase block mb-1">
                Parameter Value {selectedClevelandMeta?.unit && `[Unit: ${selectedClevelandMeta.unit}]`}
              </label>

              {selectedClevelandMeta?.options ? (
                <select
                  value={tempParamValue || String(inputValues[selectedParamToAdd] ?? '')}
                  onChange={(e) => setTempParamValue(e.target.value)}
                  className="w-full text-xs bg-warmbg/40 border border-lineborder rounded px-3 py-2 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
                >
                  <option value="">Choose category...</option>
                  {selectedClevelandMeta.options.map((opt) => (
                    <option key={String(opt.val)} value={String(opt.val)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step={selectedColObj?.min_value != null && selectedColObj.min_value % 1 !== 0 ? '0.1' : '1'}
                    placeholder={`e.g. ${selectedColObj?.median_value ?? 'Value'} (${selectedColObj?.min_value ?? ''}–${selectedColObj?.max_value ?? ''})`}
                    value={tempParamValue}
                    onChange={(e) => setTempParamValue(e.target.value)}
                    className="w-full text-xs bg-warmbg/40 border border-lineborder rounded px-3 py-2 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600 pr-16"
                  />
                  {selectedClevelandMeta?.unit && (
                    <span className="absolute right-3 top-2 text-[10px] text-subtext font-mono">
                      {selectedClevelandMeta.unit}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Set / Apply Button */}
            <div className="md:col-span-2 pt-4 md:pt-0">
              <button
                type="button"
                onClick={handleAddOrUpdateParam}
                className="w-full py-2 px-3 bg-forest-700 text-white rounded text-xs font-semibold hover:bg-forest-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Set Value</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Vercel Environment Variables Table */}
        <div className="border border-lineborder rounded-lg overflow-hidden bg-cardbg shadow-xs">
          <div className="px-4 py-3 bg-warmbg/60 border-b border-lineborder flex items-center justify-between">
            <span className="text-xs font-bold text-maintext uppercase tracking-wider font-mono">
              Patient Parameter Configuration ({featureCols.length} Features Active)
            </span>
            <span className="text-[11px] text-subtext font-mono">
              All parameters loaded from <b className="text-maintext">{profile.filename}</b> schema
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-warmbg text-subtext uppercase text-[10px] font-sans border-b border-lineborder">
                <tr>
                  <th className="py-2.5 px-3">Parameter (Key)</th>
                  <th className="py-2.5 px-3">Clinical Name & Unit</th>
                  <th className="py-2.5 px-3">Input Value</th>
                  <th className="py-2.5 px-3">Cohort Normal / Range</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lineborder font-mono text-xs">
                {featureCols.map((col) => {
                  const clevelandMeta = profile.is_cleveland_heart_disease ? CLEVELAND_METADATA[col.name] : null;
                  const label = clevelandMeta?.label || col.name;
                  const unit = clevelandMeta?.unit || '';
                  const options = clevelandMeta?.options;
                  const currentValue = inputValues[col.name];
                  const isModified = currentValue !== col.median_value && currentValue !== (col.top_categories?.[0]?.category);

                  return (
                    <tr
                      key={col.name}
                      className={`hover:bg-warmbg/40 transition-colors ${
                        isModified ? 'bg-forest-50/30' : ''
                      }`}
                    >
                      {/* Key */}
                      <td className="py-2 px-3 font-semibold text-maintext font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-warmbg border border-lineborder text-[11px]">
                          {col.name}
                        </span>
                      </td>

                      {/* Clinical Name & Unit */}
                      <td className="py-2 px-3 font-sans text-subtext">
                        <span className="text-maintext font-medium">{label}</span>
                        {unit && <span className="ml-1 text-[10px] text-forest-800 font-mono font-bold">[{unit}]</span>}
                      </td>

                      {/* Input Value with Unit */}
                      <td className="py-2 px-3 w-56">
                        {options && options.length > 0 ? (
                          <select
                            value={currentValue !== undefined ? String(currentValue) : ''}
                            onChange={(e) => handleInputChange(col.name, e.target.value)}
                            className="w-full text-xs bg-cardbg border border-lineborder rounded px-2 py-1 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
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
                              className="w-28 text-xs bg-cardbg border border-lineborder rounded px-2 py-1 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
                            />
                            {unit && <span className="text-[10px] text-subtext font-mono">{unit}</span>}
                          </div>
                        )}
                      </td>

                      {/* Cohort Normal / Range */}
                      <td className="py-2 px-3 text-subtext text-[11px]">
                        {col.min_value !== undefined && col.max_value !== undefined ? (
                          <span>
                            Range: <b>{col.min_value}</b>–<b>{col.max_value}</b>{' '}
                            {col.median_value !== undefined && (
                              <span className="text-forest-800">(Med: {col.median_value})</span>
                            )}
                          </span>
                        ) : (
                          <span>{col.inferred_type}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const defaultVal = col.median_value ?? col.top_categories?.[0]?.category ?? 0;
                            handleInputChange(col.name, defaultVal);
                          }}
                          className="text-[10px] text-subtext hover:text-forest-700 hover:underline font-sans"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Predict Action Button */}
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

        {/* 6. Prediction Results Banner */}
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

              {/* Threshold Alignment Note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-subtext font-mono pt-1">
                <span>
                  Predicted Diagnostic Label:{' '}
                  <b className="text-maintext font-bold">{predictionResult.prediction_label}</b>
                </span>
                <span>
                  Evaluated Model: <b>{predictionResult.model_name}</b> (Trained on {profile.filename})
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
