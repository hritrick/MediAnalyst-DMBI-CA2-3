import React, { useState } from 'react';

interface CorrelationHeatmapProps {
  data: {
    columns: string[];
    matrix: number[][];
  };
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ data }) => {
  const { columns, matrix } = data;
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(null);

  if (!columns || columns.length === 0 || !matrix || matrix.length === 0) {
    return <div className="text-xs text-subtext p-4">Insufficient numeric features for correlation analysis.</div>;
  }

  // Get background color for correlation value [-1, 1]
  const getColor = (val: number) => {
    if (isNaN(val)) return '#F6F7F5';
    if (val >= 0) {
      // White/warm to deep green
      const opacity = Math.min(1, Math.max(0, val));
      return `rgba(35, 75, 67, ${opacity.toFixed(2)})`;
    } else {
      // White/warm to muted slate/rose
      const opacity = Math.min(1, Math.max(0, Math.abs(val)));
      return `rgba(98, 125, 152, ${opacity.toFixed(2)})`;
    }
  };

  const getTextColor = (val: number) => {
    return Math.abs(val) > 0.55 ? '#FFFFFF' : '#202A32';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-fit p-2">
        {/* Cell tooltip */}
        <div className="h-6 mb-2 text-xs font-mono text-subtext">
          {hoveredCell ? (
            <span>
              <b>{hoveredCell.row}</b> vs <b>{hoveredCell.col}</b>: r ={' '}
              <span className="font-bold text-maintext">{hoveredCell.val.toFixed(3)}</span>
            </span>
          ) : (
            <span className="text-subtext/70">Hover over any matrix cell to inspect correlation coefficient</span>
          )}
        </div>

        <table className="border-collapse text-[10px] select-none font-mono">
          <thead>
            <tr>
              <th className="p-1"></th>
              {columns.map((c) => (
                <th key={c} className="p-1.5 font-medium text-subtext text-center max-w-[50px] truncate" title={c}>
                  {c.length > 8 ? `${c.slice(0, 7)}…` : c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {columns.map((rCol, rIdx) => (
              <tr key={rCol}>
                <td className="p-1.5 font-medium text-subtext text-right whitespace-nowrap max-w-[80px] truncate" title={rCol}>
                  {rCol}
                </td>
                {columns.map((cCol, cIdx) => {
                  const val = matrix[rIdx]?.[cIdx] ?? 0;
                  return (
                    <td
                      key={cCol}
                      onMouseEnter={() => setHoveredCell({ row: rCol, col: cCol, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        backgroundColor: getColor(val),
                        color: getTextColor(val),
                      }}
                      className="w-10 h-9 text-center border border-white/40 cursor-pointer transition-transform hover:scale-105 rounded-[2px]"
                      title={`${rCol} × ${cCol} = ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[11px] text-subtext font-sans">
          <span>Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[rgba(98,125,152,0.8)] inline-block"></span>
            <span>Negative (-1.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-warmbg border border-lineborder inline-block"></span>
            <span>Near Zero (0.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-[rgba(35,75,67,0.85)] inline-block"></span>
            <span>Positive (+1.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
