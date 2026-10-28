import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon
}) => {
  return (
    <div className="bg-cardbg rounded-lg border border-lineborder p-12 text-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-forest-50 border border-forest-200/60 flex items-center justify-center mx-auto text-forest-700 mb-4">
        {icon || <Database className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-maintext tracking-tight">{title}</h3>
      <p className="text-xs text-subtext mt-1.5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-forest-700 text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
