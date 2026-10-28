import React from 'react';
import { GitBranch, CheckCircle2 } from 'lucide-react';

interface TreeNodeProps {
  node: any;
  depth?: number;
}

const TreeNodeView: React.FC<TreeNodeProps> = ({ node, depth = 0 }) => {
  if (!node) return null;

  const isLeaf = node.is_leaf;

  return (
    <div className={`ml-3 my-1 pl-3 border-l-2 ${isLeaf ? 'border-forest-400' : 'border-slatemuted-400/50'}`}>
      <div className={`p-2.5 rounded-md text-xs border ${
        isLeaf 
          ? 'bg-forest-50/80 border-forest-200 text-forest-900' 
          : 'bg-warmbg border-lineborder text-maintext'
      }`}>
        <div className="flex items-center gap-2">
          {isLeaf ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-700 shrink-0" />
          ) : (
            <GitBranch className="w-3.5 h-3.5 text-slatemuted-600 shrink-0" />
          )}
          <span className="font-semibold font-mono">
            {isLeaf ? `Prediction: ${node.prediction}` : `Split: ${node.rule}`}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-subtext font-mono">
          <span>Samples: <b>{node.samples}</b></span>
          <span>Gini: <b>{node.impurity}</b></span>
          {node.distribution && (
            <span>Class Counts: [{node.distribution.join(', ')}]</span>
          )}
        </div>
      </div>

      {!isLeaf && (
        <div className="space-y-1 mt-1">
          {node.left && (
            <div>
              <span className="text-[10px] font-semibold text-subtext uppercase tracking-wider ml-4 block">
                ↳ True (≤ threshold):
              </span>
              <TreeNodeView node={node.left} depth={depth + 1} />
            </div>
          )}
          {node.right && (
            <div>
              <span className="text-[10px] font-semibold text-subtext uppercase tracking-wider ml-4 block">
                ↳ False (&gt; threshold):
              </span>
              <TreeNodeView node={node.right} depth={depth + 1} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DecisionTreeViewer: React.FC<{ rules: any }> = ({ rules }) => {
  if (!rules) {
    return <div className="text-xs text-subtext p-4">No decision tree rules available.</div>;
  }

  return (
    <div className="overflow-x-auto max-h-96 p-2 bg-cardbg rounded-md border border-lineborder">
      <div className="mb-2 pb-2 border-b border-lineborder flex items-center justify-between">
        <span className="text-xs font-semibold text-maintext uppercase tracking-tight">
          Clinical Decision Rules (Depth ≤ 4)
        </span>
        <span className="text-[11px] text-subtext font-mono">Transparent Triage Logic</span>
      </div>
      <TreeNodeView node={rules} />
    </div>
  );
};
