import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DatasetProfile } from '../types';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DistributionChart } from '../components/charts/DistributionChart';
import { CorrelationHeatmap } from '../components/charts/CorrelationHeatmap';
import { BivariateScatterExplorer } from '../components/charts/BivariateScatterExplorer';
import { HeartDiseaseCohortViewer } from '../components/charts/HeartDiseaseCohortViewer';
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';

interface ExplorationPageProps {
  profile: DatasetProfile | null;
  isLoading: boolean;
  onLoadExample: () => Promise<void>;
}

export const ExplorationPage: React.FC<ExplorationPageProps> = ({
  profile,
  isLoading,
  onLoadExample
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner label="Generating exploratory charts and statistical matrices..." />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="No Dataset Selected for Exploration"
        description="Please select or upload a medical dataset first to inspect clinical distributions, outlier thresholds, and correlation matrices."
        actionText="Load Cleveland Heart Disease Benchmark"
        onAction={onLoadExample}
        icon={<Database className="w-6 h-6" />}
      />
    );
  }

  const numericColumns = profile.columns.filter(
    (c) => (c.inferred_type === 'numeric' || c.inferred_type === 'binary') && !c.is_id && !c.is_constant
  );

  const categoricalColumns = profile.columns.filter(
    (c) => (c.inferred_type === 'categorical' || c.inferred_type === 'binary') && !c.is_id && !c.is_constant
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header Banner */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 uppercase tracking-wider mb-1">
            <BarChart2 className="w-4 h-4" />
            <span>Exploratory Clinical Data Analysis</span>
          </div>
          <h2 className="text-xl font-bold text-maintext tracking-tight">
            Cohort Distributions & Empirical Relationships
          </h2>
          <p className="text-xs text-subtext mt-1">
            Dataset: <b>{profile.filename}</b> ({profile.row_count} patients, {profile.column_count} clinical features)
          </p>
        </div>

        <button
          onClick={() => navigate('/analysis')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-sm shrink-0"
        >
          <span>Configure & Run Models</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Feature Distribution & Histogram Viewer */}
      <Card
        title="Clinical Feature Distributions & Outlier Screening"
        subtitle="Inspect continuous frequency histograms and Tukey's IQR anomaly fences"
      >
        <DistributionChart
          columns={profile.columns}
          previewRows={profile.preview_rows}
          outliers={profile.outliers}
        />
      </Card>

      {/* 2. Numeric Summary Table */}
      <Card
        title="Continuous Attributes Summary Statistics"
        subtitle="Parametric and non-parametric distribution metrics across all numeric clinical variables"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-lineborder bg-warmbg/60 text-subtext uppercase text-[10px] font-sans">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3 text-right">Min</th>
                <th className="py-2.5 px-3 text-right">Mean</th>
                <th className="py-2.5 px-3 text-right">Std Dev</th>
                <th className="py-2.5 px-3 text-right">Median</th>
                <th className="py-2.5 px-3 text-right">Max</th>
                <th className="py-2.5 px-3 text-right">Skewness</th>
                <th className="py-2.5 px-3 text-right">Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lineborder">
              {numericColumns.map((c) => (
                <tr key={c.name} className="hover:bg-warmbg/30">
                  <td className="py-2.5 px-3 font-sans font-medium text-maintext">{c.name}</td>
                  <td className="py-2.5 px-3 text-right text-subtext">{c.min_value ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-maintext font-semibold">{c.mean_value ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-subtext">{c.std_value ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-maintext">{c.median_value ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-subtext">{c.max_value ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-subtext">{c.skewness ?? '—'}</td>
                  <td className="py-2.5 px-3 text-right text-forest-800">
                    {c.missing_count === 0 ? '0%' : `${c.missing_percentage}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Pearson Correlation Heatmap */}
      {profile.correlation_matrix && (
        <Card
          title="Pearson Correlation Heatmap"
          subtitle="Pairwise bivariate linear associations between continuous clinical features"
        >
          <CorrelationHeatmap data={profile.correlation_matrix} />
        </Card>
      )}

      {/* 4. Interactive Bivariate Scatter & Clinical Trend Explorer */}
      <Card
        title="Interactive Bivariate Scatter & Clinical Trend Explorer"
        subtitle="Examine empirical cross-feature relationships, risk thresholds, and stratified disease distributions"
      >
        <BivariateScatterExplorer
          columns={profile.columns}
          previewRows={profile.preview_rows}
          isClevelandHeartDisease={profile.is_cleveland_heart_disease}
        />
      </Card>

      {/* 5. Categorical Attributes Breakdown */}
      {categoricalColumns.length > 0 && (
        <Card
          title="Categorical & Discrete Variable Frequencies"
          subtitle="Class distribution of nominal, ordinal, and binary clinical indicators"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoricalColumns.slice(0, 6).map((col) => (
              <div key={col.name} className="bg-warmbg/40 rounded border border-lineborder p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-maintext font-sans">{col.name}</span>
                  <span className="text-[10px] text-subtext font-mono">{col.unique_count} distinct categories</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  {col.top_categories?.map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-subtext truncate max-w-[120px] font-sans" title={cat.category}>
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-subtext/70">({cat.count})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-lineborder h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-forest-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-[10px] font-semibold text-maintext">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Cleveland Heart Disease Specialized Findings (Notebook Cells 6 & 7) */}
      {profile.is_cleveland_heart_disease && (
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-maintext uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-forest-700" />
              <span>Cleveland Heart Disease Clinical Analyses (DMBI CA2 Notebook Adapter)</span>
            </h3>
            <p className="text-xs text-subtext">Direct port of exploratory cohorts from Google Colab</p>
          </div>

          <HeartDiseaseCohortViewer
            adapterResults={{
              age_cohort_summary: [
                { cohort: '<45 (Young)', total_patients: 41, disease_cases: 13, prevalence_rate: 31.71, prevalence_formatted: '31.71%' },
                { cohort: '45-54 (Middle-aged)', total_patients: 81, disease_cases: 30, prevalence_rate: 37.04, prevalence_formatted: '37.04%' },
                { cohort: '55-64 (Senior)', total_patients: 125, disease_cases: 68, prevalence_rate: 54.40, prevalence_formatted: '54.40%' },
                { cohort: '65+ (Elderly)', total_patients: 56, disease_cases: 28, prevalence_rate: 50.00, prevalence_formatted: '50.00%' }
              ],
              chol_outlier_analysis: {
                q1: 211.0,
                q3: 275.0,
                iqr: 64.0,
                upper_bound_cutoff: 371.0,
                outlier_count: 5,
                outlier_disease_rate: 80.0,
                overall_disease_rate: 45.87,
                clinical_insight: 'Patients with serum cholesterol exceeding 371.0 mg/dl exhibited an 80.0% heart disease rate compared to 45.9% overall.'
              },
              optimal_threshold: {
                strategy: 'Precision >= 80% Constraint',
                threshold_value: 0.380,
                precision_achieved: 0.812,
                recall_achieved: 0.867,
                clinical_benefit: 'Maintains high sensitivity while preserving 80%+ precision.'
              },
              decision_tree_narrative: [
                'Primary Root Split: Reversible defect / Thal status (thal) separates cardiac risk with highest Gini impurity decrease.',
                'Secondary Fluoroscopy Marker: Number of major vessels (ca) colored by fluoroscopy provides strong secondary triage power.',
                'Exercise Stress Testing: Maximum heart rate (thalach) operates as an inverse risk factor.',
                'Symptom Classification: Asymptomatic angina (cp=4) presents elevated risk profiles.'
              ]
            }}
          />
        </div>
      )}

      {/* Bottom CTA */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => navigate('/analysis')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-sm"
        >
          <span>Proceed to Model Configuration & Analysis</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
