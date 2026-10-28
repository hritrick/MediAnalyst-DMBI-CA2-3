import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Processing clinical data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-forest-700 animate-spin mb-3" />
      <p className="text-sm font-medium text-maintext">{label}</p>
      <p className="text-xs text-subtext mt-1">Executing mathematical pipeline with reproducibility guarantees</p>
    </div>
  );
};
