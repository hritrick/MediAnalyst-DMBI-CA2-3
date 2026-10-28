import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  headerBorder = true
}) => {
  return (
    <div className={`bg-cardbg rounded-lg border border-lineborder shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <div className={`px-6 py-4 flex items-center justify-between ${headerBorder ? 'border-b border-lineborder' : ''}`}>
          <div>
            {title && <h3 className="text-sm font-semibold text-maintext tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-subtext mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
