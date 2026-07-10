// Simulates the NFA character-by-character, computing epsilon-closures
// at each step (the classic subset-construction-style simulation used
// to avoid exponential backtracking). Returns a full history of active
// state sets so the UI can scrub through the match step by step.

function epsilonClosure(stateIds, statesById) {
  const stack = [...stateIds];
  const closure = new Set(stateIds);
  while (stack.length) {
    const id = stack.pop();
    const state = statesById.get(id);
    for (const t of state.transitions) {
      if (t.test === null && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }
  return closure;
}

function step(activeIds, ch, statesById) {
  const moved = new Set();
  for (const id of activeIds) {
    const state = statesById.get(id);
    for (const t of state.transitions) {
      if (t.test !== null && t.test(ch)) {
        moved.add(t.to);
      }
    }
  }
  return epsilonClosure(moved, statesById);
}

// Runs the NFA against `input`, matching from the start of the string
// (anchored). Returns { history, matched, matchLength }.
// history[i] = Set of active state ids after consuming i characters.
function simulate(nfa, input) {
  const statesById = new Map(nfa.states.map((s) => [s.id, s]));
  const history = [];

  let active = epsilonClosure([nfa.start.id], statesById);
  history.push(active);

  let lastAcceptIndex = active.has(nfa.accept.id) ? 0 : -1;

  for (let i = 0; i < input.length; i++) {
    active = step(active, input[i], statesById);
    history.push(active);
    if (active.has(nfa.accept.id)) lastAcceptIndex = i + 1;
    if (active.size === 0) break; // dead end, no need to continue
  }

  return {
    history,
    matched: lastAcceptIndex !== -1,
    matchLength: lastAcceptIndex,
  };
}

// Scans the input for the earliest position where the pattern matches
// (unanchored search, like a normal regex.exec would do), by trying
// simulate() starting at each offset. Returns { index, length } or null.
function search(nfa, input) {
  for (let start = 0; start <= input.length; start++) {
    const { matched, matchLength } = simulate(nfa, input.slice(start));
    if (matched) {
      return { index: start, length: matchLength };
    }
  }
  return null;
}

export { simulate, search, epsilonClosure };
