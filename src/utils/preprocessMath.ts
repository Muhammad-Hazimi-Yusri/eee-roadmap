// src/utils/preprocessMath.ts
// Pre-render LaTeX math expressions in markdown to KaTeX HTML before marked parses.
//
// Why? The upstream `marked-katex-extension` has strict delimiter boundary rules:
//   - Inline `$...$` requires the opening `$` to be preceded by a space / start of
//     line, and the closing `$` to be followed by whitespace or punctuation. This
//     means natural patterns like `($\phi_1$)` (math inside parentheses) fail to
//     render, producing literal `$` text.
//   - Block `$$...$$` requires the `$$` delimiters to be on their own lines, so
//     `$$x=1$$ (note)` on a single line either doesn't parse cleanly or ends up
//     awkwardly wrapped inside a `<p>`.
//
// Rather than forcing every author to remember these quirks, we pre-extract math
// ourselves and hand marked fully-rendered HTML. Marked treats raw HTML as opaque,
// so the final output is identical to what KaTeX would produce natively.
//
// Behavior summary:
//   - `$$...$$` → block (displayMode) KaTeX, wrapped in its own block so it
//     never collides with surrounding paragraph text.
//   - `$...$`   → inline KaTeX span.
//   - Math inside code fences (```...```) and inline code spans (`...`) is
//     preserved as-is.
//   - `\$` is treated as a literal dollar sign.

import katex from 'katex';

const BLOCK_MATH_CLASS = 'math-block';

/**
 * Extract and render LaTeX math from markdown. Returns markdown with math
 * replaced by pre-rendered KaTeX HTML (as raw HTML blocks/spans) that marked
 * will pass through untouched.
 */
export function preprocessMath(markdown: string): string {
  // Protect code regions first so we don't treat `$` inside code as math.
  const codeRegions: string[] = [];
  const CODE_TOKEN = '\uE100CODE';
  const CODE_TOKEN_END = '\uE101';

  let working = markdown
    // Fenced code blocks: ```lang\n...\n```
    .replace(/```[\s\S]*?```/g, (match) => {
      const idx = codeRegions.length;
      codeRegions.push(match);
      return `${CODE_TOKEN}${idx}${CODE_TOKEN_END}`;
    })
    // Inline code spans: `...` (single line)
    .replace(/`[^`\n]*`/g, (match) => {
      const idx = codeRegions.length;
      codeRegions.push(match);
      return `${CODE_TOKEN}${idx}${CODE_TOKEN_END}`;
    });

  // Walk the string and replace `$$...$$` and `$...$` with rendered HTML.
  working = scanAndRender(working);

  // Restore code regions
  working = working.replace(
    new RegExp(`${CODE_TOKEN}(\\d+)${CODE_TOKEN_END}`, 'g'),
    (_m, idx) => codeRegions[Number(idx)] ?? '',
  );

  return working;
}

function scanAndRender(src: string): string {
  const out: string[] = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    // Preserve escaped chars: `\$`, `\\`, etc.
    if (ch === '\\' && i + 1 < n) {
      out.push(ch, src[i + 1]);
      i += 2;
      continue;
    }

    if (ch === '$') {
      const isBlock = src[i + 1] === '$';
      const delimLen = isBlock ? 2 : 1;
      const contentStart = i + delimLen;
      const closeIdx = findClosingDelimiter(src, contentStart, isBlock);

      if (closeIdx === -1) {
        // Unmatched delimiter — leave it as literal text.
        out.push(ch);
        i += 1;
        continue;
      }

      const rawContent = src.slice(contentStart, closeIdx);
      const content = rawContent.trim();

      if (!content) {
        // Empty `$$` or `$ $` — treat as literal.
        out.push(ch);
        i += 1;
        continue;
      }

      const rendered = renderMath(content, isBlock);

      if (isBlock) {
        // Force the block onto its own line with blank lines around it so
        // marked never wraps it inside a surrounding `<p>`.
        out.push('\n\n', `<div class="${BLOCK_MATH_CLASS}">`, rendered, '</div>', '\n\n');
      } else {
        out.push(rendered);
      }

      i = closeIdx + delimLen;
      continue;
    }

    out.push(ch);
    i += 1;
  }

  return out.join('');
}

/**
 * Given an opening `$` or `$$` at `start`, find the index of the matching
 * closing delimiter. Returns -1 if none found.
 *
 * Inline math never spans a blank line (mirrors marked-katex-extension's
 * line-scoped inline rule) so an unmatched `$` on one line doesn't eat the
 * rest of the document.
 */
function findClosingDelimiter(src: string, start: number, isBlock: boolean): number {
  let j = start;
  const n = src.length;
  while (j < n) {
    const c = src[j];
    if (c === '\\' && j + 1 < n) {
      j += 2;
      continue;
    }
    if (c === '$') {
      if (isBlock) {
        if (src[j + 1] === '$') return j;
      } else {
        // Single `$` closes inline — but if the next char is also `$`, this
        // is actually a `$$` delimiter in the source, which means our
        // single-`$` open was spurious (e.g. empty `$$`). Bail out.
        if (src[j + 1] === '$') return -1;
        return j;
      }
    }
    // Inline math must not cross a blank line (paragraph break).
    if (!isBlock && c === '\n' && src[j + 1] === '\n') return -1;
    j += 1;
  }
  return -1;
}

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode });
  } catch {
    // KaTeX should not throw with throwOnError:false, but be defensive.
    const escaped = tex.replace(/[&<>]/g, (c) =>
      c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;',
    );
    return `<code>${escaped}</code>`;
  }
}
