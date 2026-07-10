# RegexLab

A regex engine **built entirely from scratch** — no `RegExp`, no third-party parsing library —
paired with a live visual debugger that shows exactly how the engine matches your string,
state by state.

**[Live demo →](#)** *(deploy to Vercel/Netlify and drop the link here)*


## Why this project exists

Most regex tools (regex101, RegExr) show you *whether* something matches. RegexLab shows you
*why* — by rendering the actual finite-state machine underneath your pattern and animating it
character by character as it consumes your test string.

## How it works

1. **Parser** (`src/engine/parser.js`) — a hand-written recursive-descent parser converts the
   pattern string into an AST. Supports concatenation, alternation (`|`), grouping (`()`),
   Kleene star/plus/optional (`* + ?`), wildcard (`.`), character classes (`[a-z]`, `[^abc]`),
   and common escapes (`\d`, `\w`, `\s`).
2. **NFA builder** (`src/engine/nfa.js`) — implements **Thompson's construction**, the classic
   algorithm (used internally by `grep`, RE2, and most production regex engines) that converts
   the AST into a nondeterministic finite automaton with epsilon transitions.
3. **Simulator** (`src/engine/simulate.js`) — runs the NFA using **subset simulation**
   (epsilon-closures over sets of active states), which matches in linear time and — unlike
   naive backtracking regex engines — can't suffer catastrophic backtracking / ReDoS.
4. **Visualizer** (`src/components/NFAGraph.jsx`) — auto-layouts and renders the NFA as an SVG
   graph, highlighting the exact set of active states at each step of the match.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Edit the pattern or test string and watch the graph update
live; use the step controls to scrub through the match one character at a time.

## Supported syntax

| Syntax | Meaning |
|---|---|
| `abc` | literal concatenation |
| `a\|b` | alternation |
| `(...)` | grouping |
| `a*` `a+` `a?` | Kleene star / plus / optional |
| `.` | any character |
| `[a-z]` `[^abc]` | character classes |
| `\d` `\w` `\s` | digit / word / whitespace shorthand |

Not yet supported (good next contributions): `{n,m}` bounded repetition, anchors (`^` `$`),
capture groups with backreferences, lookahead/lookbehind.

## Project structure

```
src/
  engine/
    parser.js     # pattern string -> AST
    nfa.js         # AST -> NFA (Thompson's construction)
    simulate.js    # NFA -> match result + step history
    layout.js      # NFA -> graph coordinates for rendering
  components/
    NFAGraph.jsx   # SVG rendering of the NFA
  App.jsx          # UI, wiring, step controls
```

---

Built to demonstrate parsing, automata theory, and interactive visualization in one project.
