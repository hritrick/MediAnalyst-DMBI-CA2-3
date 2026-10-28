import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { ColumnProfile, OutlierSummary } from '../../types';

interface DistributionChartProps {
  columns: ColumnProfile[];
  previewRows: Record<string, any>[];
  outliers: OutlierSummary[];
}

export const DistributionChart: React.FC<DistributionChartProps> = ({
  columns,
  previewRows,
  outliers
}) => {
  const numericColumns = columns.filter(
    (c) => (c.inferred_type === 'numeric' || c.inferred_type === 'binary') && !c.is_id && !c.is_constant
  );

  const [selectedColName, setSelectedColName] = useState<string>(
    numericColumns[0]?.name || ''
  );

  const selectedCol = columns.find((c) => c.name === selectedColName);
  const outlierInfo = outliers.find((o) => o.column === selectedColName);

  // Extract raw values from preview or sample
  const values = previewRows
    .map((r) => r[selectedColName])
    .filter((v) => typeof v === 'number' && !isNaN(v)) as number[];

  // Construct histogram bins
  let binsData: { binLabel: string; count: number }[] = [];
  if (values.length > 0 && selectedCol?.min_value !== undefined && selectedCol?.max_value !== undefined) {
    const min = selectedCol.min_value ?? Math.min(...values);
    const max = selectedCol.max_value ?? Math.max(...values);
    const numBins = Math.min(10, Math.max(4, Math.floor(Math.sqrt(values.length))));
    const binWidth = (max - min) / numBins || 1;

    const bins = Array.from({ length: numBins }, (_, i) => ({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0
    }));

    values.forEach((v) => {
      const idx = Math.min(numBins - 1, Math.floor((v - min) / binWidth));
      if (idx >= 0 && idx < numBins) {
        bins[idx].count++;
      }
    });

    binsData = bins.map((b) => ({
      binLabel: `${b.start.toFixed(1)} - ${b.end.toFixed(1)}`,
      count: b.count
    }));
  }

  return (
    <div className="space-y-4">
      {/* Column selector */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-maintext">
          Select Clinical Feature to Inspect Distribution:
        </label>
        <select
          value={selectedColName}
          onChange={(e) => setSelectedColName(e.target.value)}
          className="text-xs bg-warmbg border border-lineborder rounded-md px-3 py-1.5 text-maintext font-medium focus:outline-none focus:ring-1 focus:ring-forest-600"
        >
          {numericColumns.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} {c.inferred_type === 'binary' ? '(binary)' : '(continuous)'}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Stat Pills */}
      {selectedCol && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="bg-warmbg/60 border border-lineborder rounded p-2 text-center">
            <span className="text-[10px] text-subtext uppercase block">Min</span>
            <span className="text-xs font-bold font-mono text-maintext">{selectedCol.min_value ?? '—'}</span>
          </div>
          <div className="bg-warmbg/60 border border-lineborder rounded p-2 text-center">
            <span className="text-[10px] text-subtext uppercase block">Mean</span>
            <span className="text-xs font-bold font-mono text-maintext">{selectedCol.mean_value ?? '—'}</span>
          </div>
          <div className="bg-warmbg/60 border border-lineborder rounded p-2 text-center">
            <span className="text-[10px] text-subtext uppercase block">Median</span>
            <span className="text-xs font-bold font-mono text-maintext">{selectedCol.median_value ?? '—'}</span>
          </div>
          <div className="bg-warmbg/60 border border-lineborder rounded p-2 text-center">
            <span className="text-[10px] text-subtext uppercase block">Max</span>
            <span className="text-xs font-bold font-mono text-maintext">{selectedCol.max_value ?? '—'}</span>
          </div>
          <div className="bg-warmbg/60 border border-lineborder rounded p-2 text-center">
            <span className="text-[10px] text-subtext uppercase block">Std Dev</span>
            <span className="text-xs font-bold font-mono text-maintext">{selectedCol.std_value ?? '—'}</span>
          </div>
          <div className="bg-warmbg/60 border border-lineborder rounded p-2 text-center">
            <span className="text-[10px] text-subtext uppercase block">Skewness</span>
            <span className="text-xs font-bold font-mono text-maintext">{selectedCol.skewness ?? '—'}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={binsData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E5" vertical={false} />
            <XAxis
              dataKey="binLabel"
              angle={-20}
              textAnchor="end"
              tick={{ fill: '#6B7280', fontSize: 10 }}
              interval={0}
            />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E3E8E5',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              formatter={(val: any) => [val, 'Patient Count']}
            />
            <Bar dataKey="count" fill="#234B43" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Outlier Alert if present */}
      {outlierInfo && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded text-xs text-amber-900 flex items-start gap-2">
          <span className="font-bold text-clinicamber">Tukey's IQR Outlier Alert:</span>
          <span>
            {outlierInfo.outlier_count} values ({outlierInfo.outlier_percentage}%) exceed the clinical fence [
            {outlierInfo.lower_bound}, {outlierInfo.upper_bound}].
          </span>
        </div>
      )}
    </div>
  );
};
