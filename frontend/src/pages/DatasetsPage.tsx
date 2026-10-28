import React, { useState, useRef } from 'react';
import { DatasetMeta, DatasetProfile } from '../types';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Upload,
  Heart,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet
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
  const [previewPage, setPreviewPage] = useState(1);
  const pageSize = 10;

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
      {/* Upload Zone & Cleveland Benchmark Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drag and Drop Upload Box */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`md:col-span-2 bg-cardbg rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
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

          <div className="w-12 h-12 rounded-full bg-forest-50 border border-forest-200/60 flex items-center justify-center text-forest-700 mb-3">
            <Upload className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-semibold text-maintext">
            {isUploading ? 'Validating and Ingesting Dataset...' : 'Click to upload or drag & drop clinical file'}
          </h3>
          <p className="text-xs text-subtext mt-1">
            Accepts CSV and Excel (.xlsx) medical datasets up to 50MB
          </p>

          {uploadError && (
            <div className="mt-3 p-2 rounded bg-red-50 border border-red-200 text-xs text-clinicdanger">
              {uploadError}
            </div>
          )}
        </div>

        {/* Cleveland Benchmark Card */}
        <div className="bg-cardbg rounded-lg border border-lineborder p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-forest-700" />
              <h3 className="text-xs font-semibold text-maintext uppercase tracking-wider">
                DMBI CA2 Benchmark
              </h3>
            </div>
            <h4 className="text-sm font-bold text-maintext">UCI Cleveland Heart Disease</h4>
            <p className="text-xs text-subtext mt-1.5 leading-relaxed">
              Instantly load the exact 303-patient cardiac dataset with 14 clinical attributes used in the project notebook.
            </p>
          </div>

          <button
            onClick={onLoadExample}
            disabled={isUploading}
            className="mt-4 w-full py-2.5 px-4 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Load Cleveland Benchmark</span>
          </button>
        </div>
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
          <p className="text-xs text-subtext mt-1">Click "Load Cleveland Benchmark" or upload your own clinical dataset above.</p>
        </div>
      )}
    </div>
  );
};
