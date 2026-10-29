import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ColumnProfile } from '../../types';
import { TrendingUp, Layers, Activity, SlidersHorizontal, Info } from 'lucide-react';

interface BivariateScatterExplorerProps {
  columns: ColumnProfile[];
  previewRows: Record<string, any>[];
  isClevelandHeartDisease?: boolean;
}

export const BivariateScatterExplorer: React.FC<BivariateScatterExplorerProps> = ({
  columns,
  previewRows,
  isClevelandHeartDisease
}) => {
  // Continuous/numeric columns suitable for axes
  const numericCols = useMemo(() => {
    return columns.filter(
      (c) => (c.inferred_type === 'numeric' || c.inferred_type === 'binary') && !c.is_id && !c.is_constant
    );
  }, [columns]);

  // Categorical or target columns suitable for stratification/coloring
  const groupingCols = useMemo(() => {
    return columns.filter(
      (c) =>
        c.suggested_role === 'target_candidate' ||
        c.inferred_type === 'binary' ||
        c.inferred_type === 'categorical' ||
        ['target', 'num', 'target_binary', 'diagnosis', 'class', 'risklevel', 'sex', 'cp'].includes(c.name.toLowerCase())
    );
  }, [columns]);

  // Default axes selection
  const defaultX = numericCols.find((c) => c.name.toLowerCase() === 'age')?.name || numericCols[0]?.name || '';
  const defaultY =
    numericCols.find((c) => c.name.toLowerCase() === 'thalach')?.name ||
    numericCols.find((c) => c.name.toLowerCase() === 'chol')?.name ||
    numericCols[1]?.name ||
    numericCols[0]?.name ||
    '';

  const defaultGroup =
    groupingCols.find((c) => c.suggested_role === 'target_candidate')?.name ||
    groupingCols.find((c) => ['target', 'target_binary', 'diagnosis', 'class', 'risklevel'].includes(c.name.toLowerCase()))?.name ||
    groupingCols[0]?.name ||
    '';

  const [xCol, setXCol] = useState<string>(defaultX);
  const [yCol, setYCol] = useState<string>(defaultY);
  const [groupCol, setGroupCol] = useState<string>(defaultGroup);

  // Quick preset pairings
  const presets = useMemo(() => {
    const list: { label: string; x: string; y: string; group?: string }[] = [];
    const colNames = numericCols.map((c) => c.name.toLowerCase());

    if (colNames.includes('age') && colNames.includes('thalach')) {
      list.push({ label: 'Age vs Max Heart Rate (thalach)', x: 'age', y: 'thalach' });
    }
    if (colNames.includes('chol') && colNames.includes('trestbps')) {
      list.push({ label: 'Serum Cholesterol vs Blood Pressure', x: 'chol', y: 'trestbps' });
    }
    if (colNames.includes('age') && colNames.includes('oldpeak')) {
      list.push({ label: 'Age vs ST Depression (oldpeak)', x: 'oldpeak', y: 'age' });
    }
    if (colNames.includes('radius1') && colNames.includes('texture1')) {
      list.push({ label: 'Tumor Radius vs Texture', x: 'radius1', y: 'texture1' });
    }
    if (colNames.includes('bmi') && colNames.includes('genhlth')) {
      list.push({ label: 'BMI vs General Health Index', x: 'BMI', y: 'GenHlth' });
    }
    if (colNames.includes('systolicbp') && colNames.includes('diastolicbp')) {
      list.push({ label: 'Systolic vs Diastolic BP', x: 'SystolicBP', y: 'DiastolicBP' });
    }
    return list;
  }, [numericCols]);

  // Parse valid data pairs
  const { validPoints, stats, groupsData } = useMemo(() => {
    if (!xCol || !yCol || previewRows.length === 0) {
      return { validPoints: [], stats: null, groupsData: {} };
    }

    const points: { x: number; y: number; group: string; raw: Record<string, any> }[] = [];
    let sumX = 0;
    let sumY = 0;

    for (const r of previewRows) {
      const vx = parseFloat(r[xCol]);
      const vy = parseFloat(r[yCol]);
      if (!isNaN(vx) && !isNaN(vy)) {
        let gVal = groupCol && r[groupCol] !== undefined && r[groupCol] !== null ? String(r[groupCol]) : 'All Cohort';
        // Friendly labeling for Cleveland target
        if (groupCol && groupCol.toLowerCase() === 'target' && (gVal === '0' || gVal === '1')) {
          gVal = gVal === '1' ? 'Heart Disease (Presence)' : 'No Disease (Absence)';
        } else if (groupCol && groupCol.toLowerCase() === 'diagnosis' && (gVal === 'M' || gVal === 'B')) {
          gVal = gVal === 'M' ? 'Malignant (M)' : 'Benign (B)';
        }
        points.push({ x: vx, y: vy, group: gVal, raw: r });
        sumX += vx;
        sumY += vy;
      }
    }

    const n = points.length;
    if (n < 2) return { validPoints: points, stats: null, groupsData: {} };

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Pearson correlation
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (const p of points) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const rVal = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;

    // Grouping stratification
    const groups: Record<string, { x: number; y: number }[]> = {};
    const groupStats: Record<string, { count: number; meanX: number; meanY: number }> = {};

    points.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push({ x: p.x, y: p.y });
    });

    Object.entries(groups).forEach(([gName, gPts]) => {
      const gSumX = gPts.reduce((acc, pt) => acc + pt.x, 0);
      const gSumY = gPts.reduce((acc, pt) => acc + pt.y, 0);
      groupStats[gName] = {
        count: gPts.length,
        meanX: +(gSumX / gPts.length).toFixed(1),
        meanY: +(gSumY / gPts.length).toFixed(1)
      };
    });

    return {
      validPoints: points,
      stats: {
        n,
        meanX: +meanX.toFixed(1),
        meanY: +meanY.toFixed(1),
        correlation: +rVal.toFixed(3)
      },
      groupsData: groups
    };
  }, [xCol, yCol, groupCol, previewRows]);

  // Color palette for cohort groups
  const groupColors: string[] = ['#DC2626', '#234B43', '#315F62', '#D97706', '#7C3AED', '#2563EB'];

  // Clinical threshold guide lines
  const clinicalThresholds = useMemo(() => {
    const lines: { axis: 'x' | 'y'; val: number; label: string; color: string }[] = [];
    const checkCol = (colName: string, axis: 'x' | 'y') => {
      const low = colName.toLowerCase();
      if (low === 'chol') {
        lines.push({ axis, val: 240, label: 'Hypercholesterolemia (≥240 mg/dl)', color: '#DC2626' });
        lines.push({ axis, val: 200, label: 'Borderline (≥200 mg/dl)', color: '#D97706' });
      } else if (low === 'trestbps' || low === 'systolicbp') {
        lines.push({ axis, val: 140, label: 'Stage 2 HTN (≥140 mmHg)', color: '#DC2626' });
        lines.push({ axis, val: 130, label: 'Stage 1 HTN (≥130 mmHg)', color: '#D97706' });
      } else if (low === 'diastolicbp') {
        lines.push({ axis, val: 90, label: 'Diastolic HTN (≥90 mmHg)', color: '#DC2626' });
      } else if (low === 'bmi') {
        lines.push({ axis, val: 30, label: 'Obesity Class I (≥30)', color: '#DC2626' });
        lines.push({ axis, val: 25, label: 'Overweight (≥25)', color: '#D97706' });
      } else if (low === 'oldpeak') {
        lines.push({ axis, val: 1.5, label: 'Significant Ischemia (≥1.5 mm)', color: '#DC2626' });
      }
    };

    if (xCol) checkCol(xCol, 'x');
    if (yCol) checkCol(yCol, 'y');
    return lines;
  }, [xCol, yCol]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="p-4 bg-warmbg/40 rounded-lg border border-lineborder space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* X Variable */}
          <div>
            <label className="text-[11px] font-semibold text-maintext uppercase tracking-wider block mb-1">
              Horizontal Axis (X-Feature)
            </label>
            <select
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
              className="w-full text-xs bg-cardbg border border-lineborder rounded-md px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              {numericCols.map((c) => (
                <option key={`x-${c.name}`} value={c.name}>
                  {c.name} ({c.inferred_type})
                </option>
              ))}
            </select>
          </div>

          {/* Y Variable */}
          <div>
            <label className="text-[11px] font-semibold text-maintext uppercase tracking-wider block mb-1">
              Vertical Axis (Y-Feature)
            </label>
            <select
              value={yCol}
              onChange={(e) => setYCol(e.target.value)}
              className="w-full text-xs bg-cardbg border border-lineborder rounded-md px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              {numericCols.map((c) => (
                <option key={`y-${c.name}`} value={c.name}>
                  {c.name} ({c.inferred_type})
                </option>
              ))}
            </select>
          </div>

          {/* Group / Cohort Variable */}
          <div>
            <label className="text-[11px] font-semibold text-maintext uppercase tracking-wider block mb-1">
              Cohort Stratification (Color By)
            </label>
            <select
              value={groupCol}
              onChange={(e) => setGroupCol(e.target.value)}
              className="w-full text-xs bg-cardbg border border-lineborder rounded-md px-2.5 py-1.5 text-maintext font-mono focus:outline-none focus:ring-1 focus:ring-forest-600"
            >
              <option value="">None (Single Unified Cohort)</option>
              {groupingCols.map((c) => (
                <option key={`g-${c.name}`} value={c.name}>
                  {c.name} {c.suggested_role === 'target_candidate' ? '★ Target Outcome' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        {presets.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-lineborder/60 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-subtext flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-forest-700" />
              <span>Recommended Pairs:</span>
            </span>
            {presets.map((p) => {
              const isActive =
                xCol.toLowerCase() === p.x.toLowerCase() && yCol.toLowerCase() === p.y.toLowerCase();
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const foundX = numericCols.find((c) => c.name.toLowerCase() === p.x.toLowerCase())?.name || p.x;
                    const foundY = numericCols.find((c) => c.name.toLowerCase() === p.y.toLowerCase())?.name || p.y;
                    setXCol(foundX);
                    setYCol(foundY);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-forest-700 text-white font-semibold'
                      : 'bg-cardbg border border-lineborder text-subtext hover:text-maintext'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Statistical KPI Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-cardbg p-3 rounded border border-lineborder shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-subtext">Pearson Correlation (r)</div>
            <div className="text-lg font-bold font-mono text-maintext mt-0.5 flex items-center gap-1.5">
              <span>{stats.correlation}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-medium ${
                  Math.abs(stats.correlation) >= 0.5
                    ? 'bg-purple-100 text-purple-800'
                    : Math.abs(stats.correlation) >= 0.3
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-warmbg text-subtext'
                }`}
              >
                {Math.abs(stats.correlation) >= 0.5
                  ? stats.correlation > 0
                    ? 'Strong Positive'
                    : 'Strong Negative'
                  : Math.abs(stats.correlation) >= 0.3
                  ? stats.correlation > 0
                    ? 'Moderate Positive'
                    : 'Moderate Negative'
                  : 'Weak / Dispersed'}
              </span>
            </div>
          </div>

          <div className="bg-cardbg p-3 rounded border border-lineborder shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-subtext">X-Mean ({xCol})</div>
            <div className="text-lg font-bold font-mono text-maintext mt-0.5">{stats.meanX}</div>
          </div>

          <div className="bg-cardbg p-3 rounded border border-lineborder shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-subtext">Y-Mean ({yCol})</div>
            <div className="text-lg font-bold font-mono text-maintext mt-0.5">{stats.meanY}</div>
          </div>

          <div className="bg-cardbg p-3 rounded border border-lineborder shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-subtext">Sample Size</div>
            <div className="text-lg font-bold font-mono text-forest-800 mt-0.5">
              {stats.n} Patients
            </div>
          </div>
        </div>
      )}

      {/* Recharts Scatter View */}
      <div className="w-full h-80 bg-cardbg rounded-lg border border-lineborder p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 25, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E5" />
            <XAxis
              type="number"
              dataKey="x"
              name={xCol}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              label={{
                value: xCol,
                position: 'insideBottom',
                offset: -12,
                fontSize: 11,
                fill: '#374151',
                fontWeight: 600
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yCol}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              label={{
                value: yCol,
                angle: -90,
                position: 'insideLeft',
                fontSize: 11,
                fill: '#374151',
                fontWeight: 600
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-cardbg border border-lineborder p-2.5 rounded shadow-md text-xs font-mono space-y-1">
                      <div className="font-sans font-bold text-maintext border-b border-lineborder pb-1">
                        Patient Record Details
                      </div>
                      <div className="text-subtext">
                        {xCol}: <span className="font-bold text-maintext">{data.x}</span>
                      </div>
                      <div className="text-subtext">
                        {yCol}: <span className="font-bold text-maintext">{data.y}</span>
                      </div>
                      {groupCol && (
                        <div className="text-forest-800 font-sans font-semibold pt-0.5">
                          Cohort: {payload[0].name}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
            />

            {/* Mean Reference Lines */}
            {stats && (
              <>
                <ReferenceLine
                  x={stats.meanX}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  label={{ value: `Mean ${xCol}: ${stats.meanX}`, fill: '#9CA3AF', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={stats.meanY}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  label={{ value: `Mean ${yCol}: ${stats.meanY}`, fill: '#9CA3AF', fontSize: 10, position: 'insideRight' }}
                />
              </>
            )}

            {/* Clinical Cutoff Reference Lines */}
            {clinicalThresholds.map((thr, idx) => (
              thr.axis === 'x' ? (
                <ReferenceLine
                  key={`thr-x-${idx}`}
                  x={thr.val}
                  stroke={thr.color}
                  strokeDasharray="3 3"
                  label={{ value: thr.label, fill: thr.color, fontSize: 10, position: 'insideTopLeft' }}
                />
              ) : (
                <ReferenceLine
                  key={`thr-y-${idx}`}
                  y={thr.val}
                  stroke={thr.color}
                  strokeDasharray="3 3"
                  label={{ value: thr.label, fill: thr.color, fontSize: 10, position: 'insideBottomRight' }}
                />
              )
            ))}

            {/* Stratified Scatters */}
            {Object.keys(groupsData).length > 0 ? (
              Object.entries(groupsData).map(([gName, gPoints], idx) => (
                <Scatter
                  key={gName}
                  name={gName}
                  data={gPoints}
                  fill={groupColors[idx % groupColors.length]}
                  opacity={0.8}
                />
              ))
            ) : (
              <Scatter
                name="All Patients"
                data={validPoints.map((p) => ({ x: p.x, y: p.y }))}
                fill="#234B43"
                opacity={0.8}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Cohort Comparison Callout */}
      {groupCol && Object.keys(groupsData).length > 1 && (
        <div className="bg-warmbg/40 p-3.5 rounded-md border border-lineborder text-xs">
          <div className="font-semibold text-maintext mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-forest-700" />
            <span>Stratified Cohort Group Differences:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
            {Object.entries(groupsData).map(([gName, gPts], idx) => {
              const gX = +(gPts.reduce((acc, p) => acc + p.x, 0) / gPts.length).toFixed(1);
              const gY = +(gPts.reduce((acc, p) => acc + p.y, 0) / gPts.length).toFixed(1);
              return (
                <div
                  key={gName}
                  className="bg-cardbg p-2.5 rounded border border-lineborder/80 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5 font-sans font-bold text-maintext">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: groupColors[idx % groupColors.length] }}
                    />
                    <span className="truncate">{gName}</span>
                    <span className="text-subtext font-normal text-[10px]">({gPts.length})</span>
                  </div>
                  <div className="mt-1 text-subtext">
                    Mean {xCol}: <b className="text-maintext">{gX}</b> | Mean {yCol}:{' '}
                    <b className="text-maintext">{gY}</b>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
