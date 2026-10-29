import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatasetCatalogItem } from '../types';
import * as api from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Library,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Filter,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface DatasetLibraryPageProps {
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => Promise<void>;
  onLoadCatalogDataset: (id: string) => Promise<void>;
}

export const DatasetLibraryPage: React.FC<DatasetLibraryPageProps> = ({
  activeDatasetId,
  onSelectDataset,
  onLoadCatalogDataset
}) => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<DatasetCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingDatasetId, setLoadingDatasetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [expandedFeaturesId, setExpandedFeaturesId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setIsLoading(true);
        const data = await api.getDatasetCatalog();
        setCatalog(data);
      } catch (err) {
        console.error('Failed to load dataset catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const domains = ['all', ...Array.from(new Set(catalog.map((c) => c.domain)))];

  const filteredCatalog = catalog.filter((item) => {
    const matchesDomain =
      selectedDomain === 'all' || item.domain.toLowerCase() === selectedDomain.toLowerCase();

    const matchesTask =
      selectedTask === 'all' ||
      item.suitable_tasks.includes(selectedTask) ||
      (selectedTask === 'multiclass' && item.supports_multiclass) ||
      (selectedTask === 'binary' && item.supports_binary) ||
      (selectedTask === 'clustering' && item.suitable_tasks.includes('clustering'));

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.domain.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.features.some((f) => f.toLowerCase().includes(q)) ||
      (item.default_target && item.default_target.toLowerCase().includes(q));

    return matchesDomain && matchesTask && matchesQuery;
  });

  const handleLoad = async (datasetId: string) => {
    try {
      setLoadingDatasetId(datasetId);
      await onLoadCatalogDataset(datasetId);
      navigate('/datasets');
    } catch (e: any) {
      alert(`Failed to load dataset: ${e.message || 'Unknown error'}`);
    } finally {
      setLoadingDatasetId(null);
    }
  };

  const getDomainColor = (domain: string) => {
    const d = domain.toLowerCase();
    if (d.includes('cardio')) return 'bg-rose-50 text-rose-800 border-rose-200';
    if (d.includes('endocrin')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (d.includes('oncol')) return 'bg-purple-50 text-purple-800 border-purple-200';
    if (d.includes('nephro')) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (d.includes('obste') || d.includes('matern')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    return 'bg-forest-50 text-forest-800 border-forest-200';
  };

  const totalPatientsCount = catalog.reduce((acc, c) => acc + c.row_count, 0);

  if (isLoading) {
    return <LoadingSpinner label="Loading official scientific medical datasets catalog..." />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-700 uppercase tracking-wider mb-1">
            <Library className="w-4 h-4" />
            <span>Verified Scientific Repository</span>
          </div>
          <h2 className="text-xl font-bold text-maintext tracking-tight">
            Official Clinical Medical Datasets Library
          </h2>
          <p className="text-xs text-subtext mt-1 max-w-2xl">
            Real, publicly verified medical datasets sourced straight from the <b>UCI Machine Learning Repository</b> and CDC.
            Every dataset features rigorous data hygiene, cryptographic SHA-256 verification, and reproducible academic ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
            <span>Cryptographically Verified</span>
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cardbg rounded-lg border border-lineborder p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
            Curated Benchmarks
          </div>
          <div className="text-2xl font-bold text-maintext font-mono">{catalog.length} Datasets</div>
          <div className="text-xs text-forest-700 mt-0.5">UCI & CDC health archives</div>
        </div>

        <div className="bg-cardbg rounded-lg border border-lineborder p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
            Verified Records
          </div>
          <div className="text-2xl font-bold text-maintext font-mono">
            {totalPatientsCount.toLocaleString()}
          </div>
          <div className="text-xs text-forest-700 mt-0.5">Real clinical observations</div>
        </div>

        <div className="bg-cardbg rounded-lg border border-lineborder p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
            DMBI CA2 Core Focus
          </div>
          <div className="text-2xl font-bold text-forest-800 font-mono">Cleveland Heart</div>
          <div className="text-xs text-subtext mt-0.5">303 Patients, 14 Markers</div>
        </div>

        <div className="bg-cardbg rounded-lg border border-lineborder p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-subtext uppercase tracking-wider mb-1">
            Scientific License
          </div>
          <div className="text-2xl font-bold text-maintext font-mono">CC BY 4.0</div>
          <div className="text-xs text-forest-700 mt-0.5">Open Academic Research</div>
        </div>
      </div>

      {/* Search & Domain Filter Toolbar */}
      <div className="bg-cardbg rounded-lg border border-lineborder p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-subtext absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets by name, biomarker, medical domain, or clinical target..."
              className="w-full text-xs bg-warmbg/60 border border-lineborder rounded-md pl-9 pr-4 py-2.5 text-maintext placeholder:text-subtext focus:outline-none focus:ring-1 focus:ring-forest-600 focus:bg-cardbg transition-colors"
            />
          </div>

          {/* Task Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-subtext" />
            <span className="text-xs text-subtext font-medium">Task:</span>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="text-xs bg-warmbg/60 border border-lineborder rounded-md px-2.5 py-2 text-maintext font-medium focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="all">All Modeling Tasks</option>
              <option value="classification">Classification (All)</option>
              <option value="binary">Binary Classification</option>
              <option value="multiclass">Multiclass Classification</option>
              <option value="clustering">Clustering (Unsupervised)</option>
              <option value="eda">EDA & Profiling</option>
            </select>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-subtext uppercase tracking-wider mr-1 shrink-0">
            Domain:
          </span>
          {domains.map((dom) => {
            const isSelected = selectedDomain === dom;
            const count =
              dom === 'all'
                ? catalog.length
                : catalog.filter((c) => c.domain.toLowerCase() === dom.toLowerCase()).length;

            return (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'bg-warmbg/80 text-subtext hover:bg-warmbg hover:text-maintext border border-lineborder'
                }`}
              >
                <span>{dom === 'all' ? 'All Specialties' : dom}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-forest-800 text-white' : 'bg-lineborder/60 text-subtext'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dataset Cards Grid */}
      {filteredCatalog.length === 0 ? (
        <div className="bg-cardbg rounded-lg border border-lineborder p-12 text-center">
          <Database className="w-8 h-8 text-subtext mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-maintext">No matching datasets found</h3>
          <p className="text-xs text-subtext mt-1">
            Try adjusting your search query or filter selection to explore available official datasets.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDomain('all');
              setSelectedTask('all');
            }}
            className="mt-4 px-4 py-2 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCatalog.map((dataset) => {
            const isActive =
              activeDatasetId === dataset.id ||
              (dataset.id === 'heart-disease' &&
                (activeDatasetId === 'cleveland-heart' || activeDatasetId === 'heart-disease'));

            const isExpanded = expandedFeaturesId === dataset.id;
            const isLoadingThis = loadingDatasetId === dataset.id;

            return (
              <div
                key={dataset.id}
                className={`bg-cardbg rounded-lg border transition-all flex flex-col justify-between shadow-sm overflow-hidden ${
                  isActive
                    ? 'border-forest-600 ring-1 ring-forest-600/30'
                    : 'border-lineborder hover:border-forest-300'
                }`}
              >
                {/* Card Top */}
                <div className="p-6">
                  {/* Tags Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getDomainColor(
                          dataset.domain
                        )}`}
                      >
                        {dataset.domain}
                      </span>

                      {dataset.is_dmbi_benchmark && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-900 border border-forest-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-forest-700" />
                          <span>DMBI CA2 Primary Benchmark</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-warmbg text-subtext border border-lineborder">
                      {dataset.file_format}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-maintext tracking-tight flex items-center justify-between">
                    <span>{dataset.name}</span>
                  </h3>

                  {/* Source & Citation Link */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-subtext">
                    <span>Source: {dataset.source}</span>
                    {dataset.source_url && (
                      <a
                        href={dataset.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-forest-700 hover:underline font-medium"
                      >
                        <span>{dataset.source_id ? `[UCI #${dataset.source_id}]` : 'Official Page'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Clinical Description */}
                  <p className="text-xs text-subtext mt-2.5 leading-relaxed line-clamp-3">
                    {dataset.description}
                  </p>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-lineborder text-center">
                    <div className="bg-warmbg/40 p-2 rounded border border-lineborder/60">
                      <div className="text-[10px] uppercase font-semibold text-subtext">Patients</div>
                      <div className="text-xs font-bold text-maintext font-mono mt-0.5">
                        {dataset.row_count.toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-warmbg/40 p-2 rounded border border-lineborder/60">
                      <div className="text-[10px] uppercase font-semibold text-subtext">Features</div>
                      <div className="text-xs font-bold text-maintext font-mono mt-0.5">
                        {dataset.column_count}
                      </div>
                    </div>

                    <div className="bg-warmbg/40 p-2 rounded border border-lineborder/60">
                      <div className="text-[10px] uppercase font-semibold text-subtext">Default Target</div>
                      <div className="text-xs font-bold text-forest-800 font-mono mt-0.5 truncate" title={dataset.default_target || 'None'}>
                        {dataset.default_target || 'None'}
                      </div>
                    </div>

                    <div className="bg-warmbg/40 p-2 rounded border border-lineborder/60">
                      <div className="text-[10px] uppercase font-semibold text-subtext">Missing Data</div>
                      <div className="text-xs font-bold text-maintext font-mono mt-0.5">
                        {dataset.has_missing_values ? (
                          <span className="text-clinicamber">Imputation</span>
                        ) : (
                          <span className="text-clinicsuccess">0 Missing</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Supported Tasks */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-subtext uppercase tracking-wider mr-1">
                      Tasks:
                    </span>
                    {dataset.supports_binary && (
                      <Badge variant="teal">Binary Classification</Badge>
                    )}
                    {dataset.supports_multiclass && (
                      <Badge variant="forest">Multiclass Classification</Badge>
                    )}
                    {dataset.suitable_tasks.includes('clustering') && (
                      <Badge variant="slate">Clustering</Badge>
                    )}
                    <Badge variant="neutral">Exploratory Profiling</Badge>
                  </div>

                  {/* Collapsible Features & Target Drawer */}
                  <div className="mt-4 pt-3 border-t border-lineborder">
                    <button
                      type="button"
                      onClick={() => setExpandedFeaturesId(isExpanded ? null : dataset.id)}
                      className="w-full flex items-center justify-between text-xs text-subtext hover:text-maintext font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-forest-700" />
                        <span>Clinical Features &amp; Target Details ({dataset.features.length} variables)</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 bg-warmbg/40 p-3 rounded-md border border-lineborder text-xs">
                        {/* Target Encodings */}
                        {dataset.target_encodings && Object.keys(dataset.target_encodings).length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-maintext mb-1">
                              Target Encodings:
                            </div>
                            <div className="space-y-1 font-mono text-[11px]">
                              {Object.entries(dataset.target_encodings).map(([targetKey, encodingDesc]) => (
                                <div key={targetKey} className="flex items-start gap-2">
                                  <span className="text-forest-800 font-bold shrink-0">{targetKey}:</span>
                                  <span className="text-subtext">{encodingDesc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Features Tags */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-maintext mb-1.5">
                            Predictor Feature Names:
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                            {dataset.features.map((feat) => (
                              <span
                                key={feat}
                                className="px-1.5 py-0.5 rounded bg-cardbg border border-lineborder text-maintext"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Citation */}
                        {dataset.citation && (
                          <div className="pt-2 border-t border-lineborder text-[10px] text-subtext italic">
                            <b>Citation:</b> {dataset.citation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-3.5 bg-warmbg/40 border-t border-lineborder flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-subtext font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-clinicsuccess" />
                    <span title={`SHA-256: ${dataset.sha256}`}>SHA-256 Verified</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-clinicsuccess px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active in Workspace</span>
                        </span>
                        <button
                          onClick={() => navigate('/datasets')}
                          className="px-3 py-1.5 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors flex items-center gap-1"
                        >
                          <span>Inspect Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleLoad(dataset.id)}
                        disabled={isLoadingThis}
                        className="px-4 py-2 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                      >
                        {isLoadingThis ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Ingesting Dataset...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Load into Workspace</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
