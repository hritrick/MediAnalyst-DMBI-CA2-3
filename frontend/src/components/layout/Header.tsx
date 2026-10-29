import React from 'react';
import { useLocation } from 'react-router-dom';
import { DatasetMeta } from '../../types';
import { ChevronRight } from 'lucide-react';

interface HeaderProps {
  datasets?: DatasetMeta[];
  activeDatasetId?: string | null;
  onSelectDataset?: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/library': return { title: 'Official Medical Dataset Library', breadcrumb: 'Dataset Catalog' };
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
    <header className="h-16 bg-cardbg border-b border-lineborder px-8 flex items-center justify-between shrink-0 print:hidden">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-subtext">{breadcrumb}</span>
        <ChevronRight className="w-3.5 h-3.5 text-subtext/60" />
        <h1 className="text-base font-semibold text-maintext tracking-tight">{title}</h1>
      </div>
    </header>
  );
};
