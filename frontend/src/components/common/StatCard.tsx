import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'neutral';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  badge,
  badgeType = 'neutral',
  icon
}) => {
  const badgeStyles = {
    success: 'bg-forest-100 text-forest-800 border-forest-200',
    warning: 'bg-amber-50 text-clinicamber border-amber-200',
    info: 'bg-blue-50 text-slatemuted-600 border-blue-200',
    neutral: 'bg-warmbg text-subtext border-lineborder',
  };

  return (
    <div className="bg-cardbg rounded-lg border border-lineborder p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between text-subtext mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-subtext">{label}</span>
        {icon && <div className="text-forest-700/80">{icon}</div>}
      </div>
      <div>
        <div className="text-2xl font-bold text-maintext tracking-tight font-mono">{value}</div>
        <div className="flex items-center justify-between mt-1.5">
          {subtext && <span className="text-xs text-subtext">{subtext}</span>}
          {badge && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${badgeStyles[badgeType]}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
