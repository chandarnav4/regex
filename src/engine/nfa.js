// Thompson's construction algorithm: converts a regex AST into an
// NFA (Nondeterministic Finite Automaton) made of states and labeled
// (possibly epsilon) transitions. This is the same technique used
// internally by grep, PCRE-lite engines, and RE2.

let stateCounter = 0;
function newState() {
  return { id: stateCounter++, transitions: [] }; // transitions: [{symbolTest, to, label}]
}

// symbolTest: null means epsilon; otherwise a function (char) => boolean
function addTransition(state, to, symbolTest, label) {
  state.transitions.push({ to: to.id, test: symbolTest, label });
}

function matchesCharClass(node) {
  return (ch) => {
    if (ch === undefined) return false;
    let hit = node.ranges.some(([a, b]) => ch >= a && ch <= b);
    if (!hit && node.extra) hit = node.extra.includes(ch);
    return node.negate ? !hit : hit;
  };
}

// Build a fragment (start state, accept state) for a given AST node.
function build(node, states) {
  switch (node.type) {
    case "Empty": {
      const s = newState();
      states.push(s);
      return { start: s, accept: s };
    }
    case "Char": {
      const s = newState();
      const a = newState();
      states.push(s, a);
      addTransition(s, a, (ch) => ch === node.value, `'${node.value}'`);
      return { start: s, accept: a };
    }
    case "AnyChar": {
      const s = newState();
      const a = newState();
      states.push(s, a);
      addTransition(s, a, (ch) => ch !== undefined, ".");
      return { start: s, accept: a };
    }
    case "CharClass": {
      const s = newState();
      const a = newState();
      states.push(s, a);
      const label =
        (node.negate ? "[^" : "[") +
        node.ranges.map(([x, y]) => `${x}-${y}`).join("") +
        (node.extra ? node.extra.join("") : "") +
        "]";
      addTransition(s, a, matchesCharClass(node), label);
      return { start: s, accept: a };
    }
    case "Group": {
      return build(node.child, states);
    }
    case "Concat": {
      let frag = build(node.parts[0], states);
      for (let i = 1; i < node.parts.length; i++) {
        const next = build(node.parts[i], states);
        addTransition(frag.accept, next.start, null, "ε");
        frag = { start: frag.start, accept: next.accept };
      }
      return frag;
    }
    case "Alt": {
      const s = newState();
      const a = newState();
      states.push(s, a);
      for (const branch of node.branches) {
        const frag = build(branch, states);
        addTransition(s, frag.start, null, "ε");
        addTransition(frag.accept, a, null, "ε");
      }
      return { start: s, accept: a };
    }
    case "Repeat": {
      const inner = build(node.child, states);
      const s = newState();
      const a = newState();
      states.push(s, a);
      if (node.op === "*") {
        addTransition(s, inner.start, null, "ε");
        addTransition(s, a, null, "ε");
        addTransition(inner.accept, inner.start, null, "ε");
        addTransition(inner.accept, a, null, "ε");
      } else if (node.op === "+") {
        addTransition(s, inner.start, null, "ε");
        addTransition(inner.accept, inner.start, null, "ε");
        addTransition(inner.accept, a, null, "ε");
      } else if (node.op === "?") {
        addTransition(s, inner.start, null, "ε");
        addTransition(s, a, null, "ε");
        addTransition(inner.accept, a, null, "ε");
      }
      return { start: s, accept: a };
    }
    default:
      throw new Error(`Unknown AST node type: ${node.type}`);
  }
}

// Builds a full NFA from an AST. Returns { states, start, accept }.
function buildNFA(ast) {
  stateCounter = 0;
  const states = [];
  const frag = build(ast, states);
  frag.accept.isAccept = true;
  return { states, start: frag.start, accept: frag.accept };
}

export { buildNFA };
