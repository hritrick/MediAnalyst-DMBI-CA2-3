import React from 'react';
import { Sliders, AlertCircle, CheckCircle } from 'lucide-react';

interface ThresholdOptimizerViewerProps {
  analysis: {
    default_threshold: number;
    optimal_threshold: number;
    goal_precision: number;
    adjusted_precision: number;
    adjusted_recall: number;
    adjusted_f1: number;
    confusion_matrix: number[][];
    clinical_rationale: string;
  };
  modelName: string;
}

export const ThresholdOptimizerViewer: React.FC<ThresholdOptimizerViewerProps> = ({
  analysis,
  modelName
}) => {
  const cm = analysis.confusion_matrix;
  const tn = cm?.[0]?.[0] ?? 0;
  const fp = cm?.[0]?.[1] ?? 0;
  const fn = cm?.[1]?.[0] ?? 0;
  const tp = cm?.[1]?.[1] ?? 0;

  return (
    <div className="bg-cardbg rounded-md border border-lineborder p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-lineborder">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-forest-700" />
          <h4 className="text-xs font-semibold text-maintext uppercase tracking-tight">
            Clinical Decision Threshold Calibration — {modelName}
          </h4>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-200">
          Optimal τ = {analysis.optimal_threshold}
        </span>
      </div>

      <p className="text-xs text-subtext leading-relaxed">
        {analysis.clinical_rationale}
      </p>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
          <span className="text-[10px] text-subtext uppercase block">Decision Cutoff (τ)</span>
          <div className="text-sm font-bold font-mono text-maintext mt-0.5">
            {analysis.optimal_threshold} <span className="text-[10px] font-normal text-subtext">(default: 0.50)</span>
          </div>
        </div>

        <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
          <span className="text-[10px] text-subtext uppercase block">Adjusted Precision</span>
          <div className="text-sm font-bold font-mono text-forest-800 mt-0.5">
            {(analysis.adjusted_precision * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
          <span className="text-[10px] text-subtext uppercase block">Adjusted Recall (Sensitivity)</span>
          <div className="text-sm font-bold font-mono text-forest-800 mt-0.5">
            {(analysis.adjusted_recall * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
          <span className="text-[10px] text-subtext uppercase block">Adjusted F1 Score</span>
          <div className="text-sm font-bold font-mono text-maintext mt-0.5">
            {analysis.adjusted_f1.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Mini Adjusted Confusion Table */}
      <div className="p-2.5 bg-forest-50/50 rounded border border-forest-200/50 flex items-center justify-between text-xs text-forest-900 font-mono">
        <span>Adjusted Outcomes:</span>
        <span>TP = {tp}</span>
        <span>FP = {fp}</span>
        <span>FN = {fn} (False Alarms minimized)</span>
        <span>TN = {tn}</span>
      </div>
    </div>
  );
};
