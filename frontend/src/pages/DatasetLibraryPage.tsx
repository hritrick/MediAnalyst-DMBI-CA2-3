import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatasetCatalogItem, DatasetMeta } from '../types';
import * as api from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Database,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  Upload,
  Search,
  Activity,
  Award,
  Hash,
  Info
} from 'lucide-react';

interface DatasetLibraryPageProps {
  onSelectDataset: (id: string) => Promise<void>;
  activeDatasetId: string | null;
}

export const DatasetLibraryPage: React.FC<DatasetLibraryPageProps> = ({
  onSelectDataset,
  activeDatasetId,
}) => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<DatasetCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDatasetId, setLoadingDatasetId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await api.getDatasetCatalog();
      setCatalog(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDataset = async (datasetId: string) => {
    try {
      setLoadingDatasetId(datasetId);
      // Load and activate through catalog endpoint
      await api.loadCatalogDataset(datasetId);
      await onSelectDataset(datasetId);
      navigate('/datasets');
    } catch (err: any) {
      alert(`Error loading dataset: ${err.message}`);
    } finally {
      setLoadingDatasetId(null);
    }
  };

  const categories = [
    { id: 'all', label: 'All Domains' },
    { id: 'cardiology', label: 'Cardiology' },
    { id: 'endocrinology', label: 'Endocrinology' },
    { id: 'oncology', label: 'Oncology' },
    { id: 'nephrology', label: 'Nephrology' },
    { id: 'obstetrics', label: 'Obstetrics' },
    { id: 'benchmark', label: 'General Benchmark' },
  ];

  const tasks = [
    { id: 'all', label: 'All Tasks' },
    { id: 'classification', label: 'Classification' },
    { id: 'multiclass', label: 'Multiclass' },
    { id: 'regression', label: 'Regression' },
    { id: 'eda', label: 'EDA & Profiling' },
  ];

  const sizes = [
    { id: 'all', label: 'All Sizes' },
    { id: 'small', label: 'Small (<1K)' },
    { id: 'medium', label: 'Medium (1K–10K)' },
    { id: 'large', label: 'Large (>10K)' },
  ];

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Task filter
      if (selectedTask === 'classification' && !item.suitable_tasks.includes('classification')) {
        return false;
      }
      if (selectedTask === 'multiclass' && !item.supports_multiclass) {
        return false;
      }
      if (selectedTask === 'regression' && !item.supports_regression) {
        return false;
      }
      if (selectedTask === 'eda' && !item.suitable_tasks.includes('eda')) {
        return false;
      }
      // Size filter
      if (selectedSize === 'small' && item.row_count >= 1000) return false;
      if (selectedSize === 'medium' && (item.row_count < 1000 || item.row_count > 10000)) return false;
      if (selectedSize === 'large' && item.row_count <= 10000) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesDomain = item.domain.toLowerCase().includes(q);
        const matchesFeatures = item.features.some((f) => f.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesDomain && !matchesFeatures) {
          return false;
        }
      }

      return true;
    });
  }, [catalog, selectedCategory, selectedTask, selectedSize, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-600"></span>
              <span className="text-xs font-semibold text-forest-800 uppercase tracking-wider">
                Official Clinical Repository
              </span>
            </div>
            <h1 className="text-xl font-bold text-maintext">Real Medical Dataset Library</h1>
            <p className="text-xs text-subtext mt-1 max-w-2xl leading-relaxed">
              Curated, real-world public datasets sourced directly from official scientific repositories
              (UCI Machine Learning Repository, CDC BRFSS, Apollo Hospitals). Zero fabricated records; all
              distributions, missing-value characteristics, and checksums are cryptographically verified.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => navigate('/datasets')}
              className="py-2 px-3 rounded-md border border-lineborder bg-warmbg/60 text-xs font-medium text-maintext hover:bg-warmbg transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-forest-700" />
              <span>Upload Your Own Dataset</span>
            </button>
          </div>
        </div>

        {/* Verification Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-lineborder/70 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
            <span className="text-subtext">
              <strong className="text-maintext font-semibold">{catalog.length}</strong> Verified Datasets
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
            <span className="text-subtext">
              <strong className="text-maintext font-semibold">100%</strong> Official Repositories
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
            <span className="text-subtext">
              <strong className="text-maintext font-semibold">SHA-256</strong> Checksum Integrity
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-700 shrink-0" />
            <span className="text-subtext">
              <strong className="text-maintext font-semibold">Zero</strong> Synthetic Records
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
            <input
              type="text"
              placeholder="Search by dataset name, biomarker, or feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-lineborder bg-warmbg/40 text-maintext focus:outline-none focus:border-forest-600 font-sans"
            />
          </div>

          {/* Quick Task Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTask(t.id)}
                className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  selectedTask === t.id
                    ? 'bg-forest-700 text-white font-medium'
                    : 'bg-warmbg/70 text-subtext hover:text-maintext hover:bg-warmbg'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Category & Size Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-lineborder/60 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-subtext text-[11px] font-medium mr-1 uppercase tracking-wider">Domain:</span>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-forest-100 text-forest-800 font-semibold border border-forest-300'
                    : 'text-subtext hover:text-maintext hover:bg-warmbg'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-subtext text-[11px] font-medium mr-1 uppercase tracking-wider">Size:</span>
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSize(s.id)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedSize === s.id
                    ? 'bg-forest-100 text-forest-800 font-semibold border border-forest-300'
                    : 'text-subtext hover:text-maintext hover:bg-warmbg'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Cards Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading verified medical dataset catalog..." />
      ) : error ? (
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-center">
          <AlertCircle className="w-6 h-6 text-clinicdanger mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-clinicdanger">Catalog Loading Error</h3>
          <p className="text-xs text-subtext mt-1">{error}</p>
          <button
            onClick={loadCatalog}
            className="mt-3 px-3 py-1.5 bg-forest-700 text-white text-xs rounded hover:bg-forest-800"
          >
            Retry
          </button>
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="p-8 text-center bg-cardbg rounded-lg border border-lineborder">
          <Info className="w-6 h-6 text-subtext mx-auto mb-2" />
          <h3 className="text-sm font-medium text-maintext">No datasets match the selected criteria</h3>
          <p className="text-xs text-subtext mt-1">Try resetting the search query or domain filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedTask('all');
              setSelectedSize('all');
            }}
            className="mt-3 px-3 py-1.5 text-xs text-forest-700 hover:underline font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCatalog.map((dataset) => {
            const isActive = activeDatasetId === dataset.id;
            const isProcessingThis = loadingDatasetId === dataset.id;

            return (
              <div
                key={dataset.id}
                className={`bg-cardbg rounded-lg border transition-all flex flex-col justify-between p-5 ${
                  isActive
                    ? 'border-forest-600 ring-1 ring-forest-600/30 shadow-sm'
                    : 'border-lineborder hover:border-forest-300 hover:shadow-sm'
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  {/* Badges & Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-forest-50 text-forest-800 border border-forest-200">
                        {dataset.domain}
                      </span>
                      {dataset.is_dmbi_benchmark && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-700" />
                          DMBI CA2 Core
                        </span>
                      )}
                      {!dataset.is_medical && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          Non-Medical Benchmark
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      {dataset.status === 'ready' ? (
                        <span className="flex items-center gap-1 text-forest-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-forest-600"></span>
                          Verified & Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-clinicamber font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Setup Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-maintext tracking-tight flex items-center gap-1.5">
                      {dataset.name}
                      {isActive && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-forest-700 text-white rounded font-normal">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-subtext mt-1 leading-relaxed line-clamp-3">
                      {dataset.description}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 p-2.5 rounded bg-warmbg/50 border border-lineborder/60 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-subtext uppercase font-sans">Records</div>
                      <div className="text-xs font-bold text-maintext mt-0.5">
                        {dataset.row_count.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-subtext uppercase font-sans">Features</div>
                      <div className="text-xs font-bold text-maintext mt-0.5">{dataset.column_count}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-subtext uppercase font-sans">Format</div>
                      <div className="text-xs font-bold text-maintext mt-0.5">{dataset.file_format}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-subtext uppercase font-sans">Missing</div>
                      <div className="text-xs font-bold text-maintext mt-0.5">
                        {dataset.has_missing_values ? 'Present' : '0.0%'}
                      </div>
                    </div>
                  </div>

                  {/* Available Tasks & Target info */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[11px] text-subtext shrink-0 font-medium">Target:</span>
                      <span className="font-mono text-[11px] text-forest-800 bg-forest-50 px-1.5 py-0.2 rounded border border-forest-200">
                        {dataset.default_target || 'None'}
                      </span>
                      {dataset.supports_multiclass && (
                        <span className="text-[10px] text-subtext self-center">(Multiclass supported)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-subtext shrink-0 font-medium">Analyses:</span>
                      {dataset.suitable_tasks.map((task) => (
                        <span
                          key={task}
                          className="text-[10px] uppercase font-sans px-1.5 py-0.5 rounded bg-warmbg text-maintext border border-lineborder"
                        >
                          {task}
                        </span>
                      ))}
                      {dataset.supports_regression && (
                        <span className="text-[10px] uppercase font-sans px-1.5 py-0.5 rounded bg-warmbg text-maintext border border-lineborder">
                          Regression
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action & Source Attribution */}
                <div className="mt-4 pt-3 border-t border-lineborder/70 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-subtext">
                    <div className="truncate max-w-[280px]" title={dataset.source}>
                      <span>Source: </span>
                      <a
                        href={dataset.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest-700 hover:underline inline-flex items-center gap-0.5 font-medium"
                      >
                        <span>{dataset.source}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <span className="font-mono text-[10px] text-subtext/70" title={`SHA-256: ${dataset.sha256}`}>
                      {dataset.sha256.slice(0, 8)}...
                    </span>
                  </div>

                  <button
                    onClick={() => handleUseDataset(dataset.id)}
                    disabled={dataset.status !== 'ready' || isProcessingThis}
                    className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-forest-100 text-forest-800 border border-forest-300 hover:bg-forest-200'
                        : 'bg-forest-700 text-white hover:bg-forest-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessingThis ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                        <span>Ingesting & Profiling Dataset...</span>
                      </>
                    ) : isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Currently Active Dataset</span>
                      </>
                    ) : (
                      <>
                        <span>Use Dataset</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
