import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
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

  // Construct histogram bins: prefer pre-computed full dataset histogram from backend
  let binsData: { binLabel: string; count: number; start?: number; end?: number }[] = [];

  if (selectedCol?.histogram && selectedCol.histogram.length > 0) {
    binsData = selectedCol.histogram;
  } else {
    // Fallback: calculate from previewRows safely converting strings to numbers
    const values = previewRows
      .map((r) => {
        const raw = r[selectedColName];
        if (typeof raw === 'number' && !isNaN(raw)) return raw;
        const parsed = parseFloat(String(raw));
        return isNaN(parsed) ? null : parsed;
      })
      .filter((v): v is number => v !== null);

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
        count: b.count,
        start: b.start,
        end: b.end
      }));
    }
  }

  // Check if a bin falls outside Tukey's IQR fence
  const isBinOutlier = (bin: { start?: number; end?: number }) => {
    if (!outlierInfo || bin.start === undefined || bin.end === undefined) return false;
    return bin.end < outlierInfo.lower_bound || bin.start > outlierInfo.upper_bound;
  };

  return (
    <div className="space-y-4">
      {/* Column selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-semibold text-maintext">
          Select Clinical Feature to Inspect Distribution:
        </label>
        <select
          value={selectedColName}
          onChange={(e) => setSelectedColName(e.target.value)}
          className="text-xs bg-warmbg border border-lineborder rounded-md px-3 py-1.5 text-maintext font-medium focus:outline-none focus:ring-1 focus:ring-forest-600 font-mono"
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

      {/* Chart Section */}
      <div className="w-full bg-warmbg/20 rounded-md border border-lineborder p-3">
        <div className="flex items-center justify-between text-[11px] text-subtext mb-2 px-1">
          <span>Patient Frequency Distribution ({selectedCol?.name})</span>
          <span className="font-mono">Total Bins: {binsData.length}</span>
        </div>

        {binsData.length > 0 ? (
          <div className="w-full h-64 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={binsData}
                margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E5" vertical={false} />
                <XAxis
                  dataKey="binLabel"
                  angle={-20}
                  textAnchor="end"
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  interval={0}
                  height={45}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(35, 75, 67, 0.08)' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E3E8E5',
                    borderRadius: '6px',
                    fontSize: '11px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                  formatter={(val: any) => [`${val} patients`, 'Frequency']}
                  labelFormatter={(lbl: string) => `Clinical Range: ${lbl}`}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {binsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={isBinOutlier(entry) ? '#D97706' : '#234B43'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-subtext">
            No continuous distribution data available for this variable.
          </div>
        )}
      </div>

      {/* Outlier Alert if present */}
      {outlierInfo && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded text-xs text-amber-900 flex items-start gap-2">
          <span className="font-bold text-clinicamber shrink-0">Tukey's IQR Outlier Alert:</span>
          <span>
            {outlierInfo.outlier_count} values ({outlierInfo.outlier_percentage}%) exceed the clinical fence [
            {outlierInfo.lower_bound}, {outlierInfo.upper_bound}]. In the histogram above, outlier bins are highlighted in amber.
          </span>
        </div>
      )}
    </div>
  );
};
