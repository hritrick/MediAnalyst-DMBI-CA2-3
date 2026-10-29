import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Database,
  Library,
  BarChart2,
  Cpu,
  FileText,
  Activity,
  Heart
} from 'lucide-react';

interface SidebarProps {
  activeDatasetId?: string | null;
  activeDatasetName?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeDatasetId, activeDatasetName }) => {
  const navItems = [
    { name: 'Dataset Library', path: '/library', icon: Library },
    { name: 'Datasets', path: '/datasets', icon: Database },
    { name: 'Data Exploration', path: '/exploration', icon: BarChart2 },
    { name: 'Model Analysis', path: '/analysis', icon: Cpu },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-cardbg border-r border-lineborder flex flex-col justify-between shrink-0 select-none print:hidden">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-lineborder gap-3">
          <div className="w-8 h-8 rounded bg-forest-700 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-5 h-5 text-forest-100" />
          </div>
          <div>
            <span className="text-base font-bold text-maintext tracking-tight block">MediAnalytics</span>
            <span className="text-[11px] text-subtext block -mt-1 font-mono">Clinical Intelligence</span>
          </div>
        </div>

        {/* Active Dataset Context Badge */}
        {activeDatasetName && (
          <div className="mx-4 mt-4 p-2.5 rounded-md bg-forest-50/70 border border-forest-200/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-forest-800 uppercase tracking-wider mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse"></span>
              Active Dataset
            </div>
            <div className="text-xs font-medium text-maintext truncate" title={activeDatasetName}>
              {activeDatasetName}
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-forest-100/70 text-forest-800 font-semibold border-l-2 border-forest-700'
                    : 'text-maintext hover:bg-forest-50/50 hover:text-forest-700'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-lineborder bg-warmbg/40">
        <div className="text-xs font-medium text-forest-800 flex items-center gap-1.5 mb-1">
          <Heart className="w-3.5 h-3.5 text-forest-600" />
          <span>Academic Research Project</span>
        </div>
        <p className="text-[11px] text-subtext leading-relaxed">
          DMBI CA2 Viva Benchmark
          <br />
          Cleveland Heart Disease Focus
        </p>
      </div>
    </aside>
  );
};
