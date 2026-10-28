import React from 'react';
import { useLocation } from 'react-router-dom';
import { DatasetMeta } from '../../types';
import { ChevronRight, Database, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  datasets: DatasetMeta[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  isBackendHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  activeDatasetId,
  onSelectDataset,
  isBackendHealthy
}) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return { title: 'Overview', breadcrumb: 'Dashboard' };
      case '/datasets': return { title: 'Datasets & Profiling', breadcrumb: 'Data Ingestion' };
      case '/exploration': return { title: 'Exploratory Clinical Data Analysis', breadcrumb: 'Data Exploration' };
      case '/analysis': return { title: 'Machine Learning Model Analysis', breadcrumb: 'Model Evaluation' };
      case '/reports': return { title: 'Research & Evaluation Reports', breadcrumb: 'Reports' };
      case '/settings': return { title: 'Academic Project Settings', breadcrumb: 'Settings' };
      default: return { title: 'MediAnalytics', breadcrumb: 'Home' };
    }
  };

  const { title, breadcrumb } = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-cardbg border-b border-lineborder px-8 flex items-center justify-between shrink-0">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-subtext">{breadcrumb}</span>
        <ChevronRight className="w-3.5 h-3.5 text-subtext/60" />
        <h1 className="text-base font-semibold text-maintext tracking-tight">{title}</h1>
      </div>

      {/* Actions & Dataset Selector */}
      <div className="flex items-center gap-4">
        {/* Dataset Quick Switcher */}
        {datasets.length > 0 && (
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-forest-700" />
            <select
              value={activeDatasetId || ''}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="text-xs bg-warmbg border border-lineborder rounded-md px-2.5 py-1.5 text-maintext font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 cursor-pointer"
            >
              <option value="" disabled>Select Dataset...</option>
              {datasets.map((d) => (
                <option key={d.dataset_id} value={d.dataset_id}>
                  {d.filename} ({d.row_count} rows) {d.is_example ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-forest-50 border border-forest-200/50 text-forest-800">
          <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-clinicsuccess' : 'bg-clinicamber'} animate-pulse`} />
          <span className="font-medium">{isBackendHealthy ? 'API Connected' : 'Connecting...'}</span>
        </div>

        {/* Viva Badge */}
        <div className="hidden md:flex items-center gap-1 text-[11px] font-mono text-subtext border border-lineborder rounded px-2 py-1 bg-warmbg/60">
          <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
          <span>DMBI CA2</span>
        </div>
      </div>
    </header>
  );
};
