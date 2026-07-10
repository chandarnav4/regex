import React, { useMemo } from "react";
import { layoutNFA } from "../engine/layout.js";

export default function NFAGraph({ nfa, activeIds }) {
  const { positions, width, height } = useMemo(() => layoutNFA(nfa), [nfa]);

  const edges = [];
  for (const state of nfa.states) {
    for (const t of state.transitions) {
      const from = positions.get(state.id);
      const to = positions.get(t.to);
      if (!from || !to) continue;
      edges.push({ from, to, label: t.label, isEpsilon: t.test === null, key: `${state.id}-${t.to}-${t.label}` });
    }
  }

  return (
    <div className="graph-scroll">
      <svg width={width} height={height} className="nfa-svg">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge-color, #7d8590)" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const self = e.from.x === e.to.x && e.from.y === e.to.y;
          const midX = (e.from.x + e.to.x) / 2;
          const midY = (e.from.y + e.to.y) / 2 - 18;

          const path = self
            ? `M ${e.from.x} ${e.from.y} C ${e.from.x - 40} ${e.from.y - 50}, ${e.from.x + 40} ${e.from.y - 50}, ${e.to.x} ${e.to.y}`
            : `M ${e.from.x} ${e.from.y} Q ${midX} ${midY} ${e.to.x} ${e.to.y}`;

          return (
            <g key={e.key} opacity={e.isEpsilon ? 0.55 : 1}>
              <path
                d={path}
                fill="none"
                stroke={e.isEpsilon ? "#8b949e" : "#58a6ff"}
                strokeWidth={1.6}
                strokeDasharray={e.isEpsilon ? "4 3" : "none"}
                markerEnd="url(#arrow)"
              />
              <text x={midX} y={midY - 4} textAnchor="middle" className="edge-label">
                {e.label}
              </text>
            </g>
          );
        })}

        {nfa.states.map((s) => {
          const p = positions.get(s.id);
          if (!p) return null;
          const isActive = activeIds.has(s.id);
          const isStart = s.id === nfa.start.id;
          const isAccept = s.isAccept;
          return (
            <g key={s.id} transform={`translate(${p.x},${p.y})`}>
              {isAccept && <circle r={17} fill="none" stroke={isActive ? "#22d3ee" : "#3fb950"} strokeWidth={2} />}
              <circle
                r={13}
                fill={isActive ? "#22d3ee" : isStart ? "#30363d" : "#161b22"}
                stroke={isActive ? "#67e8f9" : "#30363d"}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <text textAnchor="middle" dy="4" className="state-label" fill={isActive ? "#0d1117" : "#c9d1d9"}>
                {s.id}
              </text>
              {isStart && (
                <text x={-24} y={4} textAnchor="end" className="start-label">
                  start
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
