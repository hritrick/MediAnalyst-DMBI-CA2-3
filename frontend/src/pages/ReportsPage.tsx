import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisResponse, DatasetProfile } from '../types';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { exportReportPdf, exportCleanCsv } from '../services/reportExport';
import {
  FileText,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Database,
  Loader2
} from 'lucide-react';

interface ReportsPageProps {
  currentAnalysis: AnalysisResponse | null;
  profile: DatasetProfile | null;
  onLoadExample: () => Promise<void>;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  currentAnalysis,
  profile,
  onLoadExample
}) => {
  const navigate = useNavigate();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!currentAnalysis) {
    return (
      <EmptyState
        title="No Analysis Report Available"
        description="Run an analysis on an uploaded dataset or the Cleveland Heart Disease benchmark first to generate an academic evaluation report."
        actionText="Go to Model Analysis"
        onAction={() => navigate('/analysis')}
        icon={<FileText className="w-6 h-6" />}
      />
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      setExportStatus(null);
      await exportReportPdf(currentAnalysis, profile);
      setExportStatus({ type: 'success', message: 'PDF report generated and downloaded successfully.' });
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setExportStatus({ type: 'error', message: err.message || 'Failed to export PDF report.' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setIsExportingCsv(true);
      setExportStatus(null);
      await exportCleanCsv(currentAnalysis, profile);
      setExportStatus({ type: 'success', message: 'Clean CSV dataset exported and downloaded successfully.' });
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      setExportStatus({ type: 'error', message: err.message || 'Failed to export clean CSV.' });
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto print:p-0 print:space-y-4">
      {/* Export Status Banner */}
      {exportStatus && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-2 shadow-sm transition-all print:hidden ${
            exportStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{exportStatus.message}</span>
          </div>
          <button
            onClick={() => setExportStatus(null)}
            className="text-subtext hover:text-maintext text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Academic Viva Deliverable</span>
          </div>
          <h2 className="text-xl font-bold text-maintext tracking-tight">
            Clinical Machine Learning Evaluation Report
          </h2>
          <p className="text-xs text-subtext mt-1">
            Analysis ID: <b className="font-mono text-maintext">{currentAnalysis.analysis_id}</b> | Generated:{' '}
            {currentAnalysis.created_at.slice(0, 10)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
            title="Download publication-quality PDF report"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={isExportingCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-warmbg border border-lineborder text-maintext text-xs font-semibold hover:bg-forest-50/70 disabled:opacity-60 transition-colors cursor-pointer"
            title="Export clean preprocessed CSV dataset"
          >
            {isExportingCsv ? (
              <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-forest-700" />
            )}
            <span>{isExportingCsv ? 'Exporting CSV...' : 'Export Clean CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-md bg-warmbg border border-lineborder text-subtext hover:text-maintext transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-cardbg rounded-xl border border-lineborder p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-lineborder pb-6 flex items-start justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-forest-800 uppercase tracking-widest block mb-1">
              MediAnalytics • DMBI CA2 Research Report
            </span>
            <h1 className="text-2xl font-bold text-maintext tracking-tight">
              Clinical Evaluation & Benchmark Summary
            </h1>
            <p className="text-xs text-subtext mt-1">
              Dataset: <b>{profile?.filename || currentAnalysis.dataset_id}</b> | Task:{' '}
              <b className="capitalize">{currentAnalysis.task_type}</b> | Outcome Column:{' '}
              <b>{currentAnalysis.target_column || 'Unsupervised'}</b>
            </p>
          </div>
          <div className="text-right text-xs text-subtext font-mono">
            <div>College-Level Project</div>
            <div className="text-[11px] text-forest-700 font-semibold mt-0.5">Status: Verified</div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-maintext uppercase tracking-wider">
            1. Executive Summary & Study Protocol
          </h3>
          <p className="text-xs text-maintext leading-relaxed">
            This study empirically benchmarks predictive machine learning algorithms on the{' '}
            <b>{profile?.filename || 'medical dataset'}</b> cohort comprising{' '}
            <b>{currentAnalysis.dataset_summary?.usable_records || profile?.row_count}</b> patient instances.
            The pipeline employed stratified holdout partitioning (
            {(currentAnalysis.dataset_summary?.test_samples || 0) /
              ((currentAnalysis.dataset_summary?.usable_records || 100) / 100)}
            % test ratio), median imputation for missing clinical entries, and standardization of continuous variables
            strictly fit on training partitions to preclude data leakage.
          </p>
        </section>

        {/* 2. Key Performance Metrics */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-maintext uppercase tracking-wider">
            2. Empirical Model Comparison & Benchmarking
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-lineborder bg-warmbg/60 text-subtext uppercase text-[10px] font-sans">
                  {currentAnalysis.comparison_table.length > 0 &&
                    Object.keys(currentAnalysis.comparison_table[0]).map((h) => (
                      <th key={h} className="py-2 px-3">
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
                      row.Model === currentAnalysis.best_model?.name ? 'bg-forest-50/60 font-semibold' : ''
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
        </section>

        {/* 3. Scientific Interpretation */}
        <section className="space-y-2">
          <h3 className="text-xs font-bold text-maintext uppercase tracking-wider">
            3. Evidence-Based Statistical Interpretation
          </h3>
          <div className="p-4 bg-warmbg/60 rounded border border-lineborder text-xs text-maintext leading-relaxed">
            {currentAnalysis.interpretation}
          </div>
        </section>

        {/* 4. Cleveland Heart Disease Adapter (if applicable) */}
        {currentAnalysis.heart_disease_adapter && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-maintext uppercase tracking-wider">
              4. Cleveland Heart Disease Clinical Adapter Findings (DMBI CA2 Notebook)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age Cohort Table */}
              <div className="bg-warmbg/40 p-3 rounded border border-lineborder">
                <span className="text-[11px] font-semibold text-maintext block mb-2 font-sans">
                  Clinical Age Cohorts & Observed Prevalence (Notebook Cell 7)
                </span>
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="text-subtext border-b border-lineborder pb-1">
                      <th className="text-left py-1">Cohort</th>
                      <th className="text-right py-1">Prevalence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAnalysis.heart_disease_adapter.age_cohort_summary.map((c) => (
                      <tr key={c.cohort} className="border-b border-lineborder/40">
                        <td className="py-1 font-sans">{c.cohort}</td>
                        <td className="py-1 text-right font-bold text-forest-800">{c.prevalence_formatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Threshold Calibration */}
              <div className="bg-warmbg/40 p-3 rounded border border-lineborder">
                <span className="text-[11px] font-semibold text-maintext block mb-2 font-sans">
                  Optimal Decision Boundary Calibration (Notebook Cell 16)
                </span>
                <p className="text-xs text-subtext leading-relaxed">
                  Decision threshold calibrated to <b>tau = {currentAnalysis.heart_disease_adapter.optimal_threshold.threshold_value}</b>{' '}
                  achieving {currentAnalysis.heart_disease_adapter.optimal_threshold.precision_achieved * 100}% precision and{' '}
                  {currentAnalysis.heart_disease_adapter.optimal_threshold.recall_achieved * 100}% recall.
                </p>
                <div className="mt-2 text-[11px] text-forest-800 font-medium">
                  {currentAnalysis.heart_disease_adapter.optimal_threshold.clinical_benefit}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. Limitations & Ethical Disclaimer */}
        <section className="pt-4 border-t border-lineborder space-y-2">
          <h3 className="text-xs font-bold text-subtext uppercase tracking-wider">
            5. Limitations & Academic Responsible Use Disclaimer
          </h3>
          <p className="text-[11px] text-subtext leading-relaxed">
            This report was produced by the MediAnalytics web platform as part of a university Data Mining and
            Business Intelligence (DMBI) CA2 demonstration. The models, metrics, and interpretations are intended
            solely for educational evaluation and research. They do not constitute clinically certified diagnostic
            decisions or therapeutic guidance. In real clinical workflows, algorithmic outputs must always be
            scrutinized by licensed healthcare professionals.
          </p>
        </section>
      </div>
    </div>
  );
};
