import React, { useState, useEffect, useRef } from 'react';
import { DatasetMeta, DatasetProfile, DatasetCatalogItem } from '../types';
import * as api from '../services/api';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Upload,
  Heart,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Table,
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
  Award,
  Check
} from 'lucide-react';

interface DatasetsPageProps {
  datasets: DatasetMeta[];
  activeDatasetId: string | null;
  profile: DatasetProfile | null;
  isLoadingProfile: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onLoadExample: () => Promise<void>;
  onSelectDataset: (id: string) => void;
}

export const DatasetsPage: React.FC<DatasetsPageProps> = ({
  datasets,
  activeDatasetId,
  profile,
  isLoadingProfile,
  onUploadFile,
  onLoadExample,
  onSelectDataset
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingCatalogId, setLoadingCatalogId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const pageSize = 10;

  // Catalog items for the 5 verified datasets
  const [catalogItems, setCatalogItems] = useState<DatasetCatalogItem[]>([]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const items = await api.getDatasetCatalog();
        setCatalogItems(items);
      } catch (e) {
        console.error('Failed to load catalog:', e);
      }
    }
    fetchCatalog();
  }, []);

  const handleFile = async (file: File) => {
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setUploadError('Invalid file format. Please upload a .csv or .xlsx file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 50MB.');
      return;
    }

    try {
      setIsUploading(true);
      await onUploadFile(file);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectCatalogItem = async (datasetId: string) => {
    try {
      setLoadingCatalogId(datasetId);
      await api.loadCatalogDataset(datasetId);
      onSelectDataset(datasetId);
    } catch (e: any) {
      alert(`Failed to load dataset: ${e.message}`);
    } finally {
      setLoadingCatalogId(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Preview Pagination
  const totalPreviewRows = profile?.preview_rows.length || 0;
  const totalPages = Math.ceil(totalPreviewRows / pageSize) || 1;
  const currentPreviewRows = profile?.preview_rows.slice(
    (previewPage - 1) * pageSize,
    previewPage * pageSize
  ) || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Section 1: Verified Clinical Datasets Selector */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lineborder/70 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-forest-700" />
            <h2 className="text-sm font-bold text-maintext uppercase tracking-wider">
              Official Medical Datasets (UCI Machine Learning Repository)
            </h2>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200 self-start sm:self-auto">
            5 Verified Clinical Datasets • Real Data Only
          </span>
        </div>

        {/* Grid of the 5 Verified Datasets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {catalogItems.map((item) => {
            const isActive = activeDatasetId === item.id || (item.id === 'heart-disease' && activeDatasetId === 'cleveland-heart');
            const isLoadingThis = loadingCatalogId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => !isLoadingThis && handleSelectCatalogItem(item.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'border-forest-600 bg-forest-50/60 ring-1 ring-forest-600/30 shadow-sm'
                    : 'border-lineborder bg-warmbg/30 hover:border-forest-400 hover:bg-warmbg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white border border-lineborder text-forest-800">
                      {item.domain.split('&')[0].trim()}
                    </span>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-forest-700">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      item.is_dmbi_benchmark && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-100 text-amber-800">
                          DMBI Core
                        </span>
                      )
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-maintext leading-tight">{item.name}</h4>
                  <p className="text-[11px] text-subtext mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-lineborder/60 flex items-center justify-between text-[11px] font-mono text-subtext">
                  <span>{item.row_count.toLocaleString()} rows</span>
                  <span>{item.column_count} cols</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Custom File Upload Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`bg-cardbg rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragging
            ? 'border-forest-600 bg-forest-50/50'
            : 'border-lineborder hover:border-forest-400 hover:bg-warmbg/30'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept=".csv, .xlsx"
          className="hidden"
        />

        <div className="w-10 h-10 rounded-full bg-forest-50 border border-forest-200/60 flex items-center justify-center text-forest-700 mb-2">
          <Upload className="w-5 h-5" />
        </div>

        <h3 className="text-xs font-semibold text-maintext">
          {isUploading ? 'Validating and Ingesting Custom Dataset...' : 'Or upload your own clinical dataset (CSV / Excel)'}
        </h3>
        <p className="text-[11px] text-subtext mt-0.5">
          Supports arbitrary clinical spreadsheets up to 50MB with automatic type detection and outlier screening
        </p>

        {uploadError && (
          <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-xs text-clinicdanger">
            {uploadError}
          </div>
        )}
      </div>

      {/* Profiling View */}
      {isLoadingProfile ? (
        <LoadingSpinner label="Profiling structural and statistical properties..." />
      ) : profile ? (
        <div className="space-y-6">
          {/* Top Stat Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-forest-700" />
                <h2 className="text-sm font-semibold text-maintext uppercase tracking-wider">
                  Dataset Profile: {profile.filename}
                </h2>
              </div>
              {profile.is_cleveland_heart_disease && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-forest-100 text-forest-800 border border-forest-200">
                  ★ Cleveland Clinic Heart Disease Benchmark
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <StatCard label="Total Patients" value={profile.row_count.toLocaleString()} subtext="Records" />
              <StatCard label="Attributes" value={profile.column_count} subtext="Features" />
              <StatCard
                label="Missing Data"
                value={`${profile.missing_percentage}%`}
                subtext={`${profile.missing_cells.toLocaleString()} cells`}
                badge={profile.missing_cells === 0 ? 'Clean' : 'Needs Imputation'}
                badgeType={profile.missing_cells === 0 ? 'success' : 'warning'}
              />
              <StatCard
                label="Duplicate Rows"
                value={profile.duplicate_rows}
                subtext={`${profile.duplicate_percentage}% duplicate`}
              />
              <StatCard label="Numeric Features" value={profile.numeric_column_count} subtext="Continuous/Binary" />
              <StatCard label="Categorical" value={profile.categorical_column_count} subtext="Discrete" />
            </div>
          </div>

          {/* Quality Warnings */}
          {profile.warnings.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-clinicamber uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Data Quality Findings & Notes</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-950">
                {profile.warnings.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-clinicamber">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column Profile Table */}
          <Card
            title="Column Attribute Profiling"
            subtitle="Inferred data types, missing rates, and suggested clinical analytical roles"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-lineborder bg-warmbg/60 text-subtext uppercase text-[10px]">
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Inferred Type</th>
                    <th className="py-2.5 px-3 text-right">Missing</th>
                    <th className="py-2.5 px-3 text-right">Unique Values</th>
                    <th className="py-2.5 px-3">Suggested Role</th>
                    <th className="py-2.5 px-3">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lineborder font-mono">
                  {profile.columns.map((c) => (
                    <tr key={c.name} className="hover:bg-warmbg/30">
                      <td className="py-2.5 px-3 font-sans font-medium text-maintext">{c.name}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            c.inferred_type === 'numeric'
                              ? 'forest'
                              : c.inferred_type === 'binary'
                              ? 'teal'
                              : c.inferred_type === 'constant'
                              ? 'amber'
                              : c.inferred_type === 'id'
                              ? 'slate'
                              : 'neutral'
                          }
                        >
                          {c.inferred_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {c.missing_count > 0 ? (
                          <span className="text-clinicamber font-semibold">
                            {c.missing_percentage}% ({c.missing_count})
                          </span>
                        ) : (
                          <span className="text-subtext">0%</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-subtext">{c.unique_count.toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded ${
                            c.suggested_role === 'target_candidate'
                              ? 'bg-forest-100 text-forest-800 font-bold border border-forest-300'
                              : c.suggested_role === 'identifier'
                              ? 'bg-gray-100 text-gray-700 border border-gray-300'
                              : c.suggested_role === 'ignore'
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-subtext'
                          }`}
                        >
                          {c.suggested_role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-subtext truncate max-w-xs">
                        {c.sample_values.slice(0, 4).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Raw Tabular Preview with Pagination */}
          <Card
            title="Tabular Data Inspection"
            subtitle={`Displaying records ${(previewPage - 1) * pageSize + 1}–${Math.min(
              previewPage * pageSize,
              totalPreviewRows
            )} of ${totalPreviewRows} sampled rows`}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  disabled={previewPage === 1}
                  className="p-1 rounded border border-lineborder hover:bg-warmbg disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-subtext font-mono">
                  {previewPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                  disabled={previewPage === totalPages}
                  className="p-1 rounded border border-lineborder hover:bg-warmbg disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-lineborder bg-warmbg/60 text-subtext uppercase text-[10px]">
                    <th className="py-2 px-3 text-center w-12">#</th>
                    {profile.columns.map((c) => (
                      <th key={c.name} className="py-2 px-3 whitespace-nowrap">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-lineborder">
                  {currentPreviewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-warmbg/30">
                      <td className="py-1.5 px-3 text-center text-subtext">
                        {(previewPage - 1) * pageSize + idx + 1}
                      </td>
                      {profile.columns.map((c) => (
                        <td key={c.name} className="py-1.5 px-3 whitespace-nowrap">
                          {row[c.name] !== null && row[c.name] !== undefined ? (
                            String(row[c.name])
                          ) : (
                            <span className="text-clinicamber italic">null</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="p-8 text-center bg-cardbg rounded-lg border border-lineborder">
          <Database className="w-8 h-8 text-subtext mx-auto mb-2" />
          <h3 className="text-sm font-medium text-maintext">No dataset currently active</h3>
          <p className="text-xs text-subtext mt-1">Select an official clinical dataset above or upload your own file.</p>
        </div>
      )}
    </div>
  );
};
