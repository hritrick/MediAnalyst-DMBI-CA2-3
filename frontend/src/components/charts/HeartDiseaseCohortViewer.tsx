import React from 'react';
import { HeartDiseaseNotebookAdapterResults } from '../../types';
import { Heart, Activity, AlertTriangle, Layers } from 'lucide-react';

interface HeartDiseaseCohortViewerProps {
  adapterResults: HeartDiseaseNotebookAdapterResults;
}

export const HeartDiseaseCohortViewer: React.FC<HeartDiseaseCohortViewerProps> = ({ adapterResults }) => {
  const { age_cohort_summary, chol_outlier_analysis, optimal_threshold, decision_tree_narrative } = adapterResults;

  return (
    <div className="space-y-6">
      {/* 1. Age Cohort Stratification */}
      <div className="bg-cardbg rounded-md border border-lineborder p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-forest-700" />
          <h4 className="text-xs font-semibold text-maintext uppercase tracking-tight">
            Clinical Age Cohort Prevalence Analysis (DMBI Notebook Cell 7)
          </h4>
        </div>
        <p className="text-xs text-subtext mb-3">
          Continuous patient age discretized into epidemiological cohorts with observed cardiovascular disease prevalence rates.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-lineborder bg-warmbg/60 text-subtext uppercase text-[10px]">
                <th className="py-2 px-3">Age Cohort</th>
                <th className="py-2 px-3 text-right">Total Patients</th>
                <th className="py-2 px-3 text-right">Heart Disease Cases</th>
                <th className="py-2 px-3 text-right">Prevalence Rate</th>
                <th className="py-2 px-3">Prevalence Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lineborder font-mono">
              {age_cohort_summary.map((c) => (
                <tr key={c.cohort} className="hover:bg-warmbg/30">
                  <td className="py-2.5 px-3 font-sans font-medium text-maintext">{c.cohort}</td>
                  <td className="py-2.5 px-3 text-right text-subtext">{c.total_patients}</td>
                  <td className="py-2.5 px-3 text-right text-maintext font-semibold">{c.disease_cases}</td>
                  <td className="py-2.5 px-3 text-right text-forest-800 font-bold">{c.prevalence_formatted}</td>
                  <td className="py-2.5 px-3 w-40">
                    <div className="w-full bg-lineborder h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-700 h-full rounded-full"
                        style={{ width: `${Math.min(100, c.prevalence_rate)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Cholesterol Outlier Analysis */}
      <div className="bg-cardbg rounded-md border border-lineborder p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-clinicamber" />
          <h4 className="text-xs font-semibold text-maintext uppercase tracking-tight">
            Serum Cholesterol (chol) Outlier Evaluation (DMBI Notebook Cell 6)
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
            <span className="text-[10px] text-subtext uppercase block">Interquartile Range (IQR)</span>
            <div className="text-sm font-bold font-mono text-maintext mt-0.5">{chol_outlier_analysis.iqr} mg/dl</div>
          </div>
          <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
            <span className="text-[10px] text-subtext uppercase block">Upper Tukey Fence</span>
            <div className="text-sm font-bold font-mono text-maintext mt-0.5">&gt; {chol_outlier_analysis.upper_bound_cutoff} mg/dl</div>
          </div>
          <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
            <span className="text-[10px] text-subtext uppercase block">Outlier Disease Rate</span>
            <div className="text-sm font-bold font-mono text-clinicamber mt-0.5">{chol_outlier_analysis.outlier_disease_rate}%</div>
          </div>
          <div className="bg-warmbg/60 p-2.5 rounded border border-lineborder">
            <span className="text-[10px] text-subtext uppercase block">Cohort Disease Rate</span>
            <div className="text-sm font-bold font-mono text-forest-800 mt-0.5">{chol_outlier_analysis.overall_disease_rate}%</div>
          </div>
        </div>

        <div className="p-3 rounded bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950 leading-relaxed">
          <b>Clinical Finding:</b> {chol_outlier_analysis.clinical_insight}
        </div>
      </div>

      {/* 3. Decision Tree Narrative */}
      <div className="bg-cardbg rounded-md border border-lineborder p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-tealmuted-600" />
          <h4 className="text-xs font-semibold text-maintext uppercase tracking-tight">
            Key Diagnostic Decision Paths (DMBI Notebook Cell 15)
          </h4>
        </div>
        <ul className="space-y-2 text-xs text-maintext">
          {decision_tree_narrative.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-700 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
