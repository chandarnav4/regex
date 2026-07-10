// Assigns x/y coordinates to NFA states for SVG rendering using a
// simple BFS-depth layout: states reachable in N hops from the start
// state are placed in column N, stacked vertically within the column.

function layoutNFA(nfa) {
  const statesById = new Map(nfa.states.map((s) => [s.id, s]));
  const depth = new Map();
  const queue = [nfa.start.id];
  depth.set(nfa.start.id, 0);

  while (queue.length) {
    const id = queue.shift();
    const state = statesById.get(id);
    for (const t of state.transitions) {
      if (!depth.has(t.to)) {
        depth.set(t.to, depth.get(id) + 1);
        queue.push(t.to);
      }
    }
  }

  // Any unreachable states (shouldn't normally happen) get pushed to the end
  let maxDepth = 0;
  for (const d of depth.values()) maxDepth = Math.max(maxDepth, d);
  for (const s of nfa.states) {
    if (!depth.has(s.id)) depth.set(s.id, maxDepth + 1);
  }

  const columns = new Map(); // depth -> [stateId]
  for (const s of nfa.states) {
    const d = depth.get(s.id);
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d).push(s.id);
  }

  const colWidth = 130;
  const rowHeight = 90;
  const positions = new Map();

  for (const [d, ids] of columns.entries()) {
    ids.forEach((id, i) => {
      const x = 70 + d * colWidth;
      const y = 70 + i * rowHeight + (d % 2 === 0 ? 0 : 20);
      positions.set(id, { x, y });
    });
  }

  const maxCol = Math.max(...columns.values().next ? [0] : [0], columns.size);
  const width = 70 + (maxDepth + 1) * colWidth + 60;
  let maxRows = 1;
  for (const ids of columns.values()) maxRows = Math.max(maxRows, ids.length);
  const height = 70 + maxRows * rowHeight + 40;

  return { positions, width: Math.max(width, 600), height: Math.max(height, 300) };
}

export { layoutNFA };
