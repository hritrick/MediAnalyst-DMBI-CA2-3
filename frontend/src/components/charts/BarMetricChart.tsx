import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BarMetricChartProps {
  data: Record<string, any>[];
  metrics: string[];
}

export const BarMetricChart: React.FC<BarMetricChartProps> = ({ data, metrics }) => {
  // Medical restrained palette colors
  const metricColors: Record<string, string> = {
    'Accuracy': '#234B43',
    'Precision': '#315F62',
    'Recall': '#627D98',
    'F1-score': '#398070',
    'ROC-AUC': '#829AB1',
    'MAE': '#627D98',
    'RMSE': '#234B43',
    'R-squared': '#398070',
    'Silhouette Score': '#234B43',
    'Davies-Bouldin Index': '#627D98',
  };

  // Convert string metric values to floats if needed
  const chartData = data.map((row) => {
    const item: Record<string, any> = { Model: row.Model };
    metrics.forEach((m) => {
      const val = row[m];
      item[m] = typeof val === 'number' ? val : parseFloat(val) || 0;
    });
    return item;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E5" vertical={false} />
          <XAxis
            dataKey="Model"
            tick={{ fill: '#202A32', fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: '#E3E8E5' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1.0]}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E3E8E5',
              borderRadius: '6px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)'
            }}
            formatter={(value: any) => [typeof value === 'number' ? value.toFixed(4) : value, '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          {metrics.map((metric) => (
            <Bar
              key={metric}
              dataKey={metric}
              fill={metricColors[metric] || '#315F62'}
              radius={[3, 3, 0, 0]}
              maxBarSize={45}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
