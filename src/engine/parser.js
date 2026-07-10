// A recursive-descent parser for a practical regex subset:
//   literals, concatenation, alternation (|), grouping (),
//   Kleene star (*), plus (+), optional (?), character classes ([abc], [^abc], [a-z]),
//   escape sequences (\d \w \s and literal escapes), and the wildcard (.)
//
// Grammar (precedence low -> high):
//   expr    := term ('|' term)*
//   term    := factor+
//   factor  := atom ('*' | '+' | '?')?
//   atom    := literal | '.' | '(' expr ')' | charclass

let input = "";
let pos = 0;

function peek() {
  return input[pos];
}
function next() {
  return input[pos++];
}
function eof() {
  return pos >= input.length;
}

function parseRegex(pattern) {
  input = pattern;
  pos = 0;
  const ast = parseExpr();
  if (!eof()) {
    throw new Error(`Unexpected character '${peek()}' at position ${pos}`);
  }
  return ast;
}

function parseExpr() {
  const branches = [parseTerm()];
  while (!eof() && peek() === "|") {
    next();
    branches.push(parseTerm());
  }
  return branches.length === 1 ? branches[0] : { type: "Alt", branches };
}

function parseTerm() {
  const factors = [];
  while (!eof() && peek() !== "|" && peek() !== ")") {
    factors.push(parseFactor());
  }
  if (factors.length === 0) return { type: "Empty" };
  return factors.length === 1 ? factors[0] : { type: "Concat", parts: factors };
}

function parseFactor() {
  let atom = parseAtom();
  while (!eof() && (peek() === "*" || peek() === "+" || peek() === "?")) {
    const op = next();
    atom = { type: "Repeat", op, child: atom };
  }
  return atom;
}

function parseAtom() {
  if (eof()) throw new Error("Unexpected end of pattern");
  const ch = peek();

  if (ch === "(") {
    next();
    const expr = parseExpr();
    if (peek() !== ")") throw new Error("Expected closing ')'");
    next();
    return { type: "Group", child: expr };
  }

  if (ch === ".") {
    next();
    return { type: "AnyChar" };
  }

  if (ch === "[") {
    return parseCharClass();
  }

  if (ch === "\\") {
    next();
    const esc = next();
    return escapeToNode(esc);
  }

  next();
  return { type: "Char", value: ch };
}

function escapeToNode(esc) {
  switch (esc) {
    case "d":
      return { type: "CharClass", negate: false, ranges: [["0", "9"]] };
    case "w":
      return {
        type: "CharClass",
        negate: false,
        ranges: [
          ["a", "z"],
          ["A", "Z"],
          ["0", "9"],
        ],
        extra: ["_"],
      };
    case "s":
      return { type: "CharClass", negate: false, ranges: [], extra: [" ", "\t", "\n", "\r"] };
    default:
      return { type: "Char", value: esc }; // literal escape e.g. \. \* \\
  }
}

function parseCharClass() {
  next(); // consume '['
  let negate = false;
  if (peek() === "^") {
    negate = true;
    next();
  }
  const ranges = [];
  const extra = [];
  while (!eof() && peek() !== "]") {
    let c = next();
    if (c === "\\") {
      c = next();
    }
    if (peek() === "-" && input[pos + 1] !== "]" && pos + 1 < input.length) {
      next(); // consume '-'
      let c2 = next();
      if (c2 === "\\") c2 = next();
      ranges.push([c, c2]);
    } else {
      extra.push(c);
    }
  }
  if (peek() !== "]") throw new Error("Expected closing ']'");
  next();
  return { type: "CharClass", negate, ranges, extra };
}

export { parseRegex };
