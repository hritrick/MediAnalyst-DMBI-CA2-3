import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ModelEvaluationResult } from '../../types';

interface PrecisionRecallChartProps {
  models: Record<string, ModelEvaluationResult>;
}

export const PrecisionRecallChart: React.FC<PrecisionRecallChartProps> = ({ models }) => {
  const modelColors: Record<string, string> = {
    'Logistic Regression': '#234B43',
    'Decision Tree': '#315F62',
    'Random Forest': '#627D98',
  };

  const xSamples = Array.from({ length: 21 }, (_, i) => +(i * 0.05).toFixed(2));

  const chartData = xSamples.map((xVal) => {
    const row: Record<string, any> = { recall: xVal };

    Object.entries(models).forEach(([name, res]) => {
      if (res.pr_curve && res.pr_curve.length > 0) {
        let closest = res.pr_curve[0];
        let minDiff = Math.abs(closest.x - xVal);
        for (const pt of res.pr_curve) {
          const diff = Math.abs(pt.x - xVal);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
          }
        }
        row[name] = closest.y;
      }
    });

    return row;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E5" />
          <XAxis
            dataKey="recall"
            label={{ value: 'Recall (Sensitivity)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#6B7280' }}
            domain={[0, 1.0]}
            tick={{ fill: '#6B7280', fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'Precision (PPV)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#6B7280' }}
            domain={[0, 1.0]}
            tick={{ fill: '#6B7280', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E3E8E5',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(val: any) => [typeof val === 'number' ? val.toFixed(3) : val, '']}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {Object.keys(models).map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={modelColors[name] || '#234B43'}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
