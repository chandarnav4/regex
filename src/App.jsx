import React, { useEffect, useMemo, useState, useCallback } from "react";
import { parseRegex } from "./engine/parser.js";
import { buildNFA } from "./engine/nfa.js";
import { simulate, search } from "./engine/simulate.js";
import NFAGraph from "./components/NFAGraph.jsx";

const EXAMPLES = [
  { pattern: "a(b|c)*d", text: "abccbd", label: "Alternation + star" },
  { pattern: "\\d+-\\d{0,0}\\w+", text: "42-answer", label: "Digits + word (no {n} support yet)" },
  { pattern: "colou?r", text: "the color and colour", label: "Optional char" },
  { pattern: "[A-Z][a-z]+", text: "Hello world From RegexLab", label: "Character class" },
];

export default function App() {
  const [pattern, setPattern] = useState("a(b|c)*d");
  const [text, setText] = useState("abccbd");
  const [error, setError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const nfa = useMemo(() => {
    try {
      const ast = buildNFAOrThrow(pattern);
      setError(null);
      return ast;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [pattern]);

  function buildNFAOrThrow(p) {
    const ast = parseRegex(p);
    return buildNFA(ast);
  }

  const anchoredRun = useMemo(() => {
    if (!nfa) return null;
    try {
      return simulate(nfa, text);
    } catch {
      return null;
    }
  }, [nfa, text]);

  const searchResult = useMemo(() => {
    if (!nfa) return null;
    try {
      return search(nfa, text);
    } catch {
      return null;
    }
  }, [nfa, text]);

  useEffect(() => {
    setStepIndex(0);
  }, [pattern, text]);

  useEffect(() => {
    if (!playing || !anchoredRun) return;
    if (stepIndex >= anchoredRun.history.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIndex((i) => i + 1), 600);
    return () => clearTimeout(t);
  }, [playing, stepIndex, anchoredRun]);

  const activeIds = useMemo(() => {
    if (!anchoredRun) return new Set();
    const idx = Math.min(stepIndex, anchoredRun.history.length - 1);
    return anchoredRun.history[idx] || new Set();
  }, [anchoredRun, stepIndex]);

  const maxStep = anchoredRun ? anchoredRun.history.length - 1 : 0;

  const handleExample = useCallback((ex) => {
    setPattern(ex.pattern);
    setText(ex.text);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>
          Regex<span className="accent">Lab</span>
        </h1>
        <p className="subtitle">
          A regex engine built from scratch — parser → AST → NFA (Thompson's construction) → live simulation.
          No <code>RegExp</code> used under the hood.
        </p>
      </header>

      <section className="controls">
        <label className="field">
          <span>Pattern</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
            className="mono-input"
          />
        </label>
        <label className="field">
          <span>Test string</span>
          <input value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className="mono-input" />
        </label>

        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex.pattern} className="example-chip" onClick={() => handleExample(ex)}>
              {ex.label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="error-banner">Parse error: {error}</div>}

      {!error && nfa && (
        <>
          <section className="result-banner">
            <div className={`badge ${searchResult ? "match" : "no-match"}`}>
              {searchResult
                ? `Match found at index ${searchResult.index} ("${text.slice(
                    searchResult.index,
                    searchResult.index + searchResult.length
                  )}")`
                : "No match anywhere in string"}
            </div>
            <div className="highlighted-text">{renderHighlighted(text, searchResult)}</div>
          </section>

          <section className="graph-section">
            <div className="graph-header">
              <h2>NFA Graph</h2>
              <span className="hint">Cyan states = active right now (epsilon-closure included)</span>
            </div>
            <NFAGraph nfa={nfa} activeIds={activeIds} />
          </section>

          <section className="step-controls">
            <h2>Step-by-step match (anchored at index 0)</h2>
            <div className="step-row">
              <button onClick={() => setStepIndex(0)} disabled={stepIndex === 0}>
                ⏮ Reset
              </button>
              <button onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0}>
                ◀ Prev
              </button>
              <button onClick={() => setPlaying((p) => !p)}>{playing ? "⏸ Pause" : "▶ Play"}</button>
              <button onClick={() => setStepIndex((i) => Math.min(maxStep, i + 1))} disabled={stepIndex >= maxStep}>
                Next ▶
              </button>
              <span className="step-count">
                Step {stepIndex} / {maxStep}
                {stepIndex > 0 && ` — consumed "${text.slice(0, stepIndex)}"`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxStep}
              value={stepIndex}
              onChange={(e) => setStepIndex(Number(e.target.value))}
              className="scrubber"
            />
          </section>
        </>
      )}

      <footer className="footer">
        <p>
          Built with a hand-written parser, Thompson's construction, and subset-simulation (no backtracking) —{" "}
          the same approach used by RE2 and grep's NFA mode.
        </p>
      </footer>
    </div>
  );
}

function renderHighlighted(text, result) {
  if (!result) return <span>{text}</span>;
  const { index, length } = result;
  return (
    <span>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + length)}</mark>
      {text.slice(index + length)}
    </span>
  );
}
