import React from 'react';
import { Card } from '../components/common/Card';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Server,
  BookOpen,
  Lock,
  Heart,
  Cpu,
  Info
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          <span>System & Project Documentation</span>
        </div>
        <h2 className="text-xl font-bold text-maintext tracking-tight">
          Academic Project Settings & Specifications
        </h2>
        <p className="text-xs text-subtext mt-1">
          Architectural parameters, methodology alignment, and university viva demonstration metadata.
        </p>
      </div>

      {/* 1. Academic Project Alignment */}
      <Card
        title="DMBI CA2 Project Overview"
        subtitle="Data Mining and Business Intelligence Coursework Specification"
      >
        <div className="space-y-4 text-xs text-maintext leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-warmbg/60 p-3.5 rounded border border-lineborder">
              <span className="text-[10px] uppercase font-bold text-subtext block">Project Title</span>
              <span className="text-sm font-bold text-forest-800">MediAnalytics Platform</span>
              <p className="text-xs text-subtext mt-1">Multi-Dataset Medical Data Mining & Analytics System</p>
            </div>

            <div className="bg-warmbg/60 p-3.5 rounded border border-lineborder">
              <span className="text-[10px] uppercase font-bold text-subtext block">Primary Benchmark</span>
              <span className="text-sm font-bold text-maintext">UCI Cleveland Heart Disease</span>
              <p className="text-xs text-subtext mt-1">14 Clinical Predictors, 303 Patient Records (DMBI CA2 Notebook)</p>
            </div>
          </div>

          <p>
            MediAnalytics directly ports and operationalizes the data mining methodology established in the{' '}
            <b>DMBI_CA2 Google Colab notebook</b>, expanding it into an extensible, multi-dataset full-stack system.
            It provides automated structural profiling, data leakage-free preprocessing, multi-model evaluation, and
            publication-grade clinical reports.
          </p>
        </div>
      </Card>

      {/* 2. Machine Learning Pipeline Architecture */}
      <Card
        title="Machine Learning & Preprocessing Standards"
        subtitle="Reproducibility guarantees and scientific safeguards"
      >
        <div className="space-y-3 text-xs text-maintext">
          <div className="flex items-start gap-3 p-3 bg-warmbg/40 rounded border border-lineborder">
            <Cpu className="w-4 h-4 text-forest-700 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Data Leakage Prevention</span>
              <span className="text-subtext">
                All data preprocessing transformations (including missing-value imputation via medians and continuous feature
                standardization) are strictly fit on the training split only, and then applied to the holdout test set.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warmbg/40 rounded border border-lineborder">
            <Lock className="w-4 h-4 text-tealmuted-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Reproducibility Seed Protocol</span>
              <span className="text-subtext">
                Random seed is fixed to <b>42</b> across stratified train-test splits, Logistic Regression convergence, Decision
                Tree splits, and Random Forest bagging ensembles.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-warmbg/40 rounded border border-lineborder">
            <ShieldCheck className="w-4 h-4 text-slatemuted-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Precision-Constrained Sensitivity Optimization</span>
              <span className="text-subtext">
                Optimal threshold tuning module searches decision probability boundary τ to maximize Recall while guaranteeing
                clinical Precision ≥ 80%, reducing false-negative cardiac diagnoses.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Privacy & Responsible Use */}
      <Card
        title="Academic & Ethical Disclaimer"
        subtitle="Guidelines for responsible demonstration"
      >
        <div className="p-4 bg-forest-50/60 rounded-md border border-forest-200/60 text-xs text-forest-950 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-forest-900">
            <Info className="w-4 h-4" />
            <span>Educational Use Declaration</span>
          </div>
          <p>
            MediAnalytics is designed and built exclusively for college-level Data Mining & Business Intelligence (DMBI)
            demonstration and academic research. The algorithmic predictions, risk estimates, decision trees, and
            classifications are mathematical approximations and do not constitute clinically certified medical diagnoses.
          </p>
          <p className="text-[11px] text-forest-800">
            Uploaded patient records are processed in server memory and temporary storage with automatic sanitization of
            identifiers. No patient identifiable data is logged or distributed.
          </p>
        </div>
      </Card>
    </div>
  );
};
