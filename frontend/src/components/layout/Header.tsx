import React from 'react';
import { useLocation } from 'react-router-dom';
import { DatasetMeta } from '../../types';
import { ChevronRight, Database } from 'lucide-react';

interface HeaderProps {
  datasets: DatasetMeta[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  activeDatasetId,
  onSelectDataset,
}) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
      case '/datasets': return { title: 'Datasets & Profiling', breadcrumb: 'Data Ingestion' };
      case '/exploration': return { title: 'Exploratory Clinical Data Analysis', breadcrumb: 'Data Exploration' };
      case '/analysis': return { title: 'Machine Learning Model Analysis', breadcrumb: 'Model Evaluation' };
      case '/reports': return { title: 'Research & Evaluation Reports', breadcrumb: 'Reports' };
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
      </div>
    </header>
  );
};
