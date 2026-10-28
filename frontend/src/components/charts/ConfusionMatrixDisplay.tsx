import React from 'react';
import { ConfusionMatrixData } from '../../types';

interface ConfusionMatrixDisplayProps {
  data: ConfusionMatrixData;
  modelName: string;
}

export const ConfusionMatrixDisplay: React.FC<ConfusionMatrixDisplayProps> = ({ data, modelName }) => {
  const { labels, matrix } = data;
  const is2x2 = matrix.length === 2 && matrix[0].length === 2;

  let tn = 0, fp = 0, fn = 0, tp = 0;
  let sensitivity = 0, specificity = 0, ppv = 0, npv = 0;

  if (is2x2) {
    tn = matrix[0][0];
    fp = matrix[0][1];
    fn = matrix[1][0];
    tp = matrix[1][1];

    sensitivity = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
    specificity = tn + fp > 0 ? (tn / (tn + fp)) * 100 : 0;
    ppv = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
    npv = tn + fn > 0 ? (tn / (tn + fn)) * 100 : 0;
  }

  const total = matrix.flat().reduce((a, b) => a + b, 0);

  return (
    <div className="bg-cardbg rounded-md border border-lineborder p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-maintext tracking-tight uppercase">
          Confusion Matrix — {modelName}
        </h4>
        <span className="text-[11px] text-subtext font-mono">N = {total} Test Samples</span>
      </div>

      <div className="flex flex-col items-center">
        {/* Header: Predicted */}
        <div className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
          Predicted Condition
        </div>

        <div className="flex items-center">
          {/* Vertical Label: Actual */}
          <div className="text-[11px] font-semibold text-subtext uppercase tracking-wider -rotate-90 mr-2 select-none">
            Actual
          </div>

          <div className="grid grid-cols-2 gap-2 text-center w-64">
            {/* Top Left: TN */}
            <div className="bg-forest-50/70 border border-forest-200/60 rounded p-3">
              <div className="text-[10px] text-forest-800 uppercase font-semibold">True Negative (TN)</div>
              <div className="text-xl font-bold font-mono text-forest-900 mt-1">{is2x2 ? tn : matrix[0]?.[0]}</div>
              <div className="text-[10px] text-subtext mt-0.5">
                {labels[0] || 'Negative'}
              </div>
            </div>

            {/* Top Right: FP */}
            <div className="bg-amber-50/70 border border-amber-200/60 rounded p-3">
              <div className="text-[10px] text-clinicamber uppercase font-semibold">False Positive (FP)</div>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1">{is2x2 ? fp : matrix[0]?.[1]}</div>
              <div className="text-[10px] text-subtext mt-0.5">Type I Error</div>
            </div>

            {/* Bottom Left: FN */}
            <div className="bg-red-50/70 border border-red-200/60 rounded p-3">
              <div className="text-[10px] text-clinicdanger uppercase font-semibold">False Negative (FN)</div>
              <div className="text-xl font-bold font-mono text-red-900 mt-1">{is2x2 ? fn : matrix[1]?.[0]}</div>
              <div className="text-[10px] text-subtext mt-0.5">Type II Error (Missed)</div>
            </div>

            {/* Bottom Right: TP */}
            <div className="bg-forest-100 border border-forest-300 rounded p-3">
              <div className="text-[10px] text-forest-800 uppercase font-semibold">True Positive (TP)</div>
              <div className="text-xl font-bold font-mono text-forest-900 mt-1">{is2x2 ? tp : matrix[1]?.[1]}</div>
              <div className="text-[10px] text-subtext mt-0.5">
                {labels[1] || 'Positive'}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Indices */}
        {is2x2 && (
          <div className="w-full mt-4 pt-3 border-t border-lineborder grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between px-1">
              <span className="text-subtext">Sensitivity (Recall):</span>
              <span className="font-semibold text-maintext font-mono">{sensitivity.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-subtext">Specificity (TNR):</span>
              <span className="font-semibold text-maintext font-mono">{specificity.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-subtext">PPV (Precision):</span>
              <span className="font-semibold text-maintext font-mono">{ppv.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-subtext">NPV:</span>
              <span className="font-semibold text-maintext font-mono">{npv.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
