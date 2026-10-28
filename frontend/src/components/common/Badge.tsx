import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'forest' | 'teal' | 'slate' | 'amber' | 'danger' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variantStyles = {
    forest: 'bg-forest-100 text-forest-800 border-forest-200',
    teal: 'bg-tealmuted-500/10 text-tealmuted-700 border-tealmuted-500/20',
    slate: 'bg-slatemuted-400/15 text-slatemuted-700 border-slatemuted-400/30',
    amber: 'bg-amber-50 text-clinicamber border-amber-200',
    danger: 'bg-red-50 text-clinicdanger border-red-200',
    neutral: 'bg-warmbg text-maintext border-lineborder',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
