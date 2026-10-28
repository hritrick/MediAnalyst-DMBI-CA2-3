import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DatasetMeta } from '../types';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import {
  Upload,
  Heart,
  BarChart2,
  Cpu,
  FileText,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface OverviewPageProps {
  datasets: DatasetMeta[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onLoadExample: () => void;
  isLoading: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  datasets,
  activeDatasetId,
  onSelectDataset,
  onLoadExample,
  isLoading
}) => {
  const navigate = useNavigate();
  const activeDataset = datasets.find((d) => d.dataset_id === activeDatasetId);

  const workflowSteps = [
    {
      num: '01',
      title: 'Upload Dataset',
      desc: 'Ingest clinical CSV or Excel spreadsheets with automatic validation.',
      icon: Upload,
      action: () => navigate('/datasets'),
    },
    {
      num: '02',
      title: 'Explore Data',
      desc: 'Inspect distributions, Tukey outlier fences, and correlation matrices.',
      icon: BarChart2,
      action: () => navigate('/exploration'),
    },
    {
      num: '03',
      title: 'Configure Analysis',
      desc: 'Select outcome target, model algorithms, and preprocessing pipeline.',
      icon: Cpu,
      action: () => navigate('/analysis'),
    },
    {
      num: '04',
      title: 'Evaluate & Report',
      desc: 'Compare models, inspect decision trees, and export academic PDF reports.',
      icon: FileText,
      action: () => navigate('/reports'),
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-cardbg rounded-xl border border-lineborder p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-forest-50 border border-forest-200/60 text-forest-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DMBI CA2 Clinical Machine Learning Platform</span>
            </div>
            <h1 className="text-2xl font-bold text-maintext tracking-tight">
              Medical Data Analytics
            </h1>
            <p className="text-sm text-subtext leading-relaxed">
              Explore medical datasets, uncover patterns, and evaluate machine-learning models.
              Engineered for academic research and rigorous clinical algorithm benchmarking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => navigate('/datasets')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Dataset</span>
            </button>

            <button
              onClick={onLoadExample}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-warmbg border border-lineborder text-forest-800 text-xs font-semibold hover:bg-forest-50/70 transition-colors disabled:opacity-50"
            >
              <Heart className="w-4 h-4 text-forest-700" />
              <span>{isLoading ? 'Loading Benchmark...' : 'Try Heart Disease Example'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Statistics Cards backed by active data */}
      {activeDataset ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Cohort"
            value={activeDataset.filename}
            subtext={`${activeDataset.row_count} patient records`}
            badge={activeDataset.is_example ? 'UCI Benchmark' : 'User Upload'}
            badgeType={activeDataset.is_example ? 'success' : 'info'}
            icon={<Database className="w-5 h-5" />}
          />
          <StatCard
            label="Total Sample Size"
            value={activeDataset.row_count.toLocaleString()}
            subtext="Validated clinical rows"
            badge="100% Parsed"
            badgeType="success"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Attribute Count"
            value={activeDataset.column_count}
            subtext="Continuous & discrete features"
            icon={<BarChart2 className="w-5 h-5" />}
          />
          <StatCard
            label="Core Models"
            value="3 Algorithms"
            subtext="LogReg, Decision Tree, Random Forest"
            badge="Reproducible"
            badgeType="neutral"
            icon={<Cpu className="w-5 h-5" />}
          />
        </div>
      ) : (
        <div className="bg-warmbg/70 border border-lineborder rounded-lg p-6 text-center text-subtext text-xs">
          No dataset loaded yet. Upload your own medical file or click <b>"Try Heart Disease Example"</b> above to load the Cleveland clinic benchmark.
        </div>
      )}

      {/* Workflow Steps Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-maintext uppercase tracking-wider">
            Analysis Workflow
          </h2>
          <p className="text-xs text-subtext">Four-step scientific data mining pipeline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              onClick={step.action}
              className="bg-cardbg rounded-lg border border-lineborder p-5 hover:border-forest-400 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                    {step.num}
                  </span>
                  <step.icon className="w-4 h-4 text-subtext group-hover:text-forest-700 transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-maintext group-hover:text-forest-800 transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-subtext mt-1.5 leading-relaxed">{step.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-lineborder/60 flex items-center text-[11px] font-semibold text-forest-700 group-hover:translate-x-0.5 transition-transform">
                <span>Proceed</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Datasets Table */}
      {datasets.length > 0 && (
        <Card
          title="Recent Medical Datasets"
          subtitle="Select any previously ingested dataset to explore or re-run analysis"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-lineborder text-subtext uppercase text-[10px]">
                  <th className="py-2.5 px-3">Dataset Name</th>
                  <th className="py-2.5 px-3">Patients</th>
                  <th className="py-2.5 px-3">Attributes</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lineborder font-mono">
                {datasets.map((d) => {
                  const isCurrent = d.dataset_id === activeDatasetId;
                  return (
                    <tr key={d.dataset_id} className={`hover:bg-warmbg/40 ${isCurrent ? 'bg-forest-50/40' : ''}`}>
                      <td className="py-3 px-3 font-sans font-medium text-maintext flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                        <span>{d.filename}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-forest-100 text-forest-800 border border-forest-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-subtext">{d.row_count} rows</td>
                      <td className="py-3 px-3 text-subtext">{d.column_count} cols</td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${d.is_example ? 'bg-forest-100 text-forest-800' : 'bg-warmbg text-subtext'}`}>
                          {d.is_example ? 'UCI Benchmark' : 'Uploaded File'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2 font-sans">
                        {!isCurrent && (
                          <button
                            onClick={() => onSelectDataset(d.dataset_id)}
                            className="text-xs font-semibold text-forest-700 hover:text-forest-900"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectDataset(d.dataset_id);
                            navigate('/exploration');
                          }}
                          className="text-xs font-semibold text-slatemuted-600 hover:text-slatemuted-700"
                        >
                          Explore
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
