import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface FeatureImportanceChartProps {
  data: { feature: string; importance: number }[];
  modelName: string;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ data, modelName }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-subtext p-4">Feature importance not available for this model.</div>;
  }

  // Display top 10 features
  const topFeatures = data.slice(0, 10);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-maintext uppercase tracking-tight">
          Top Clinical Predictors ({modelName})
        </h4>
        <span className="text-[11px] text-subtext font-mono">Relative Importance (Gini / Weights)</span>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topFeatures}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E5" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} domain={[0, 'auto']} />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fill: '#202A32', fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: '#E3E8E5' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E3E8E5',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              formatter={(val: any) => [typeof val === 'number' ? val.toFixed(4) : val, 'Importance']}
            />
            <Bar dataKey="importance" fill="#234B43" radius={[0, 3, 3, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
