// src/components/simulators/digital/TruthTableGenerator.tsx
// Boolean expression truth table generator.
// Parses AND OR NOT XOR NAND NOR XNOR and parentheses; evaluates all 2^n rows.
// Hydration: client:idle

import { useState, useMemo } from 'react';

// ─── Tokeniser / Parser ────────────────────────────────────────────────────────

type Token =
  | { type: 'VAR'; name: string }
  | { type: 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' }
  | { type: 'LPAREN' | 'RPAREN' };

function tokenise(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.trim().toUpperCase();
  while (i < s.length) {
    if (s[i] === ' ' || s[i] === '\t') { i++; continue; }
    if (s[i] === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (s[i] === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }

    // Keywords (longest match first)
    const rest = s.slice(i);
    const kw = (['XNOR','NAND','NOR','XOR','AND','NOT','OR'] as const).find(k => rest.startsWith(k) && (rest.length === k.length || !/[A-Z0-9_]/.test(rest[k.length])));
    if (kw) {
      tokens.push({ type: kw });
      i += kw.length;
      continue;
    }

    // Variable: single letter or letter+digits
    const varMatch = /^([A-Z][A-Z0-9_]*)/.exec(rest);
    if (varMatch) {
      tokens.push({ type: 'VAR', name: varMatch[1] });
      i += varMatch[1].length;
      continue;
    }

    return null; // unknown character
  }
  return tokens;
}

// Recursive descent parser → AST
type ASTNode =
  | { op: 'VAR'; name: string }
  | { op: 'NOT'; child: ASTNode }
  | { op: 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR'; left: ASTNode; right: ASTNode };

function parse(tokens: Token[]): ASTNode | null {
  let pos = 0;

  function parseOr(): ASTNode | null {
    let left = parseAnd();
    if (!left) return null;
    while (pos < tokens.length && (tokens[pos].type === 'OR' || tokens[pos].type === 'NOR' || tokens[pos].type === 'XOR' || tokens[pos].type === 'XNOR')) {
      const op = tokens[pos].type as 'OR' | 'NOR' | 'XOR' | 'XNOR';
      pos++;
      const right = parseAnd();
      if (!right) return null;
      left = { op, left, right };
    }
    return left;
  }

  function parseAnd(): ASTNode | null {
    let left = parseNot();
    if (!left) return null;
    while (pos < tokens.length && (tokens[pos].type === 'AND' || tokens[pos].type === 'NAND')) {
      const op = tokens[pos].type as 'AND' | 'NAND';
      pos++;
      const right = parseNot();
      if (!right) return null;
      left = { op, left, right };
    }
    return left;
  }

  function parseNot(): ASTNode | null {
    if (pos < tokens.length && tokens[pos].type === 'NOT') {
      pos++;
      const child = parseNot();
      if (!child) return null;
      return { op: 'NOT', child };
    }
    return parseAtom();
  }

  function parseAtom(): ASTNode | null {
    if (pos >= tokens.length) return null;
    const tok = tokens[pos];
    if (tok.type === 'VAR') { pos++; return { op: 'VAR', name: tok.name }; }
    if (tok.type === 'LPAREN') {
      pos++;
      const node = parseOr();
      if (!node) return null;
      if (pos >= tokens.length || tokens[pos].type !== 'RPAREN') return null;
      pos++;
      return node;
    }
    return null;
  }

  const ast = parseOr();
  if (ast === null || pos !== tokens.length) return null;
  return ast;
}

function evaluate(node: ASTNode, env: Record<string, boolean>): boolean {
  switch (node.op) {
    case 'VAR': return env[node.name] ?? false;
    case 'NOT': return !evaluate(node.child, env);
    case 'AND':  return evaluate(node.left, env) && evaluate(node.right, env);
    case 'OR':   return evaluate(node.left, env) || evaluate(node.right, env);
    case 'XOR':  return evaluate(node.left, env) !== evaluate(node.right, env);
    case 'NAND': return !(evaluate(node.left, env) && evaluate(node.right, env));
    case 'NOR':  return !(evaluate(node.left, env) || evaluate(node.right, env));
    case 'XNOR': return evaluate(node.left, env) === evaluate(node.right, env);
  }
}

function collectVars(node: ASTNode): string[] {
  const set = new Set<string>();
  function walk(n: ASTNode) {
    if (n.op === 'VAR') { set.add(n.name); return; }
    if (n.op === 'NOT') { walk(n.child); return; }
    walk(n.left); walk(n.right);
  }
  walk(node);
  return [...set].sort();
}

// ─── SOP simplification (basic: collect minterms) ────────────────────────────

function sopExpression(vars: string[], rows: Array<{ vals: boolean[]; out: boolean }>): string {
  const minterms = rows.filter(r => r.out);
  if (minterms.length === 0) return '0';
  if (minterms.length === rows.length) return '1';
  return minterms.map(m =>
    vars.map((v, i) => (m.vals[i] ? v : `NOT ${v}`)).join(' AND ')
  ).join('\n  OR  ');
}

// ─── Component ───────────────────────────────────────────────────────────────

const EXAMPLE = 'A AND B OR NOT C';

export default function TruthTableGenerator() {
  const [expr, setExpr] = useState(EXAMPLE);

  const result = useMemo(() => {
    const tokens = tokenise(expr);
    if (!tokens) return { error: 'Unexpected character in expression.' };
    if (tokens.length === 0) return { error: 'Enter a boolean expression.' };

    const ast = parse(tokens);
    if (!ast) return { error: 'Syntax error — check parentheses and operators.' };

    const vars = collectVars(ast);
    if (vars.length === 0) return { error: 'No variables found.' };
    if (vars.length > 8) return { error: 'Too many variables (max 8).' };

    const n = vars.length;
    const rows: Array<{ vals: boolean[]; out: boolean }> = [];
    for (let mask = 0; mask < (1 << n); mask++) {
      const vals = vars.map((_, i) => Boolean((mask >> (n - 1 - i)) & 1));
      const env: Record<string, boolean> = {};
      vars.forEach((v, i) => { env[v] = vals[i]; });
      rows.push({ vals, out: evaluate(ast, env) });
    }

    const sop = sopExpression(vars, rows);
    return { vars, rows, sop };
  }, [expr]);

  const hasTable = result && 'vars' in result;

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Expression input */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="tt-expr" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Boolean Expression
        </label>
        <input
          id="tt-expr"
          type="text"
          value={expr}
          onChange={e => setExpr(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            padding: '0.5rem 0.65rem',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '3px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
          Operators: AND OR NOT XOR NAND NOR XNOR — e.g. <em>(A AND B) OR NOT C</em>
        </p>
      </div>

      {/* Error */}
      {'error' in result && (
        <div style={{ padding: '0.6rem 0.8rem', background: 'color-mix(in srgb, #e84040 10%, transparent)', border: '1px solid #c04040', borderRadius: '3px', color: '#e84040', fontSize: '0.78rem', marginBottom: '1rem' }}>
          {result.error}
        </div>
      )}

      {/* Truth table */}
      {hasTable && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  {result.vars.map(v => (
                    <th key={v} style={{ padding: '0.3rem 0.75rem', borderBottom: '2px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                      {v}
                    </th>
                  ))}
                  <th style={{ padding: '0.3rem 0.75rem', borderBottom: '2px solid var(--color-border)', textAlign: 'center', color: 'var(--color-copper)', fontWeight: 600 }}>
                    OUT
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} style={{ background: row.out ? 'color-mix(in srgb, var(--color-copper) 8%, transparent)' : undefined }}>
                    {row.vals.map((v, j) => (
                      <td key={j} style={{ padding: '0.25rem 0.75rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {v ? '1' : '0'}
                      </td>
                    ))}
                    <td style={{ padding: '0.25rem 0.75rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center', fontWeight: 700, color: row.out ? 'var(--color-copper)' : 'var(--color-text-muted)' }}>
                      {row.out ? '1' : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SOP form */}
          <details style={{ marginTop: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-text-muted)', userSelect: 'none' }}>
              Sum of Products (SOP)
            </summary>
            <pre style={{ marginTop: '0.4rem', padding: '0.6rem 0.8rem', background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)', borderRadius: '3px', fontSize: '0.75rem', color: 'var(--color-text)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {result.sop}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
