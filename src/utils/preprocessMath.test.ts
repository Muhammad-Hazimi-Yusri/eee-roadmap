import { describe, it, expect } from 'vitest';
import { preprocessMath } from './preprocessMath';
import { parseNotesClient } from './parseNotesClient';

// These tests cover the LaTeX parsing fixes for patterns that the upstream
// `marked-katex-extension` rejected due to strict delimiter boundary rules.

describe('preprocessMath', () => {
  describe('inline math in brackets (regression)', () => {
    it('renders $...$ immediately after an opening paren', () => {
      const result = parseNotesClient('Real pole ($1/s$):');
      expect(result).toContain('<span class="katex">');
      expect(result).not.toContain('$1/s$');
    });

    it('renders $...$ immediately before a closing paren', () => {
      const result = parseNotesClient('Pole at origin ($1/s$).');
      expect(result).toContain('<span class="katex">');
      expect(result).not.toContain('$1/s$');
    });

    it('renders $\\tan\\delta = 0.02$ inside parentheses', () => {
      const result = parseNotesClient('FR4 ($\\tan\\delta = 0.02$) is common.');
      expect(result).toContain('<span class="katex">');
      expect(result).not.toContain('$\\tan');
    });

    it('renders $...$ inside square brackets', () => {
      const result = parseNotesClient('Range [$0$, $1$] is the unit interval.');
      expect(result).toContain('<span class="katex">');
      // Should contain two KaTeX spans (one per $...$)
      const matches = result.match(/<span class="katex">/g) ?? [];
      expect(matches.length).toBe(2);
    });

    it('renders $...$ inside curly braces', () => {
      const result = parseNotesClient('Set {$x$, $y$, $z$}.');
      const matches = result.match(/<span class="katex">/g) ?? [];
      expect(matches.length).toBe(3);
    });
  });

  describe('block math adjacent to text (regression)', () => {
    it('renders $$...$$ followed by trailing text on the same line', () => {
      const result = parseNotesClient('$$\\zeta \\approx \\frac{PM}{100}$$ (rough approximation)');
      expect(result).toContain('<span class="katex-display">');
      expect(result).toContain('(rough approximation)');
    });

    it('renders $$...$$ with text on both sides of the same line', () => {
      const result = parseNotesClient('Before $$x = 1$$ after');
      expect(result).toContain('<span class="katex-display">');
      expect(result).toContain('Before');
      expect(result).toContain('after');
    });

    it('block math is not trapped inside a surrounding <p>', () => {
      const result = parseNotesClient('Before\n\n$$x = 1$$\n\nAfter');
      // katex-display should not be inside a <p> directly
      expect(result).toContain('<span class="katex-display">');
      expect(result).toMatch(/<div class="math-block">[\s\S]*katex-display[\s\S]*<\/div>/);
    });
  });

  describe('existing working patterns still work', () => {
    it('renders plain inline $...$', () => {
      const result = parseNotesClient("Ohm's Law: $V = IR$.");
      expect(result).toContain('<span class="katex">');
    });

    it('renders block $$...$$ on its own line', () => {
      const result = parseNotesClient('Formula:\n\n$$Z = R + jX$$');
      expect(result).toContain('<span class="katex-display">');
    });

    it('renders inline math in list items', () => {
      const result = parseNotesClient('- $\\phi_1$ = angle 1\n- $\\phi_2$ = angle 2');
      const matches = result.match(/<span class="katex">/g) ?? [];
      expect(matches.length).toBe(2);
    });

    it('renders math at end of line with period', () => {
      const result = parseNotesClient('Final value: $x$.');
      expect(result).toContain('<span class="katex">');
    });
  });

  describe('edge cases', () => {
    it('leaves unmatched single $ as literal text', () => {
      const result = parseNotesClient('Price is $5 only on one line');
      // No katex span should be rendered
      expect(result).not.toContain('katex');
      expect(result).toContain('$5 only');
    });

    it('treats escaped \\$ as literal dollar sign', () => {
      const md = 'Literal \\$10 and math $x$.';
      const html = parseNotesClient(md);
      // The \$10 should not be parsed as math
      expect(html).toContain('$10');
      // But $x$ should render as math
      expect(html).toContain('<span class="katex">');
    });

    it('does not parse math inside inline code spans', () => {
      const html = parseNotesClient('Use `$x$` for inline math in source.');
      expect(html).not.toContain('<span class="katex">');
      expect(html).toContain('<code>$x$</code>');
    });

    it('does not parse math inside fenced code blocks', () => {
      const md = '```\n$a + b$\n$$c + d$$\n```';
      const html = parseNotesClient(md);
      expect(html).not.toContain('<span class="katex">');
      expect(html).toContain('$a + b$');
      expect(html).toContain('$$c + d$$');
    });

    it('inline math does not cross a blank line', () => {
      // A single unmatched $ on one line should not consume content after a
      // blank line.
      const html = parseNotesClient('Leading $ unmatched.\n\nA new paragraph.');
      // The unmatched $ remains literal and the paragraphs stay separate
      expect(html).toContain('unmatched');
      expect(html).toContain('A new paragraph');
    });

    it('handles empty $$', () => {
      const html = parseNotesClient('Empty $$ ignored.');
      expect(html).toBeDefined();
    });

    it('renders math with fractions inside parentheses', () => {
      const html = parseNotesClient('Given ($\\frac{a}{b}$) as the ratio.');
      expect(html).toContain('<span class="katex">');
      expect(html).not.toContain('$\\frac');
    });

    it('preprocessMath returns a string when given plain markdown', () => {
      const out = preprocessMath('Just plain text.');
      expect(out).toBe('Just plain text.');
    });
  });
});
