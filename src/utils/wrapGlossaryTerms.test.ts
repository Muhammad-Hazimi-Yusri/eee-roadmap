import { describe, it, expect, vi } from 'vitest';

// Mock glossary data before importing the module under test
vi.mock('../data/_glossary.json', () => ({
  default: {
    terms: [
      { id: 'ohms-law', term: "Ohm's Law", acronyms: [] },
      { id: 'kvl', term: "Kirchhoff's Voltage Law", acronyms: ['KVL'] },
      { id: 'resistor', term: 'Resistor', acronyms: [] },
      { id: 'capacitor', term: 'Capacitor', acronyms: [] },
    ],
    lookup: {
      "ohm's law": 'ohms-law',
      "kirchhoff's voltage law": 'kvl',
      'kvl': 'kvl',
      'resistor': 'resistor',
      'capacitor': 'capacitor',
    },
  },
}));

import {
  wrapTermsInText,
  wrapTermsInHtml,
  getTermById,
  getAllTerms,
} from './wrapGlossaryTerms';

describe('wrapGlossaryTerms', () => {
  describe('wrapTermsInText', () => {
    it('wraps a known term with glossary-link span', () => {
      const result = wrapTermsInText('A Resistor limits current');
      expect(result).toContain('<span class="glossary-link" data-term-id="resistor" role="button" tabindex="0">Resistor</span>');
    });

    it('escapes HTML entities in text', () => {
      const result = wrapTermsInText('V < 5 & I > 2');
      expect(result).toContain('&lt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&gt;');
    });

    it('deduplicates by term ID (only wraps first occurrence)', () => {
      const result = wrapTermsInText('A Resistor and another Resistor');
      const matches = result.match(/glossary-link/g) || [];
      expect(matches.length).toBe(1);
    });

    it('handles case-insensitive matching', () => {
      const result = wrapTermsInText('a resistor');
      expect(result).toContain('data-term-id="resistor"');
    });

    it('wraps acronyms with correct term ID', () => {
      const result = wrapTermsInText('Apply KVL to the circuit');
      expect(result).toContain('data-term-id="kvl"');
    });

    it('returns empty string for empty input', () => {
      expect(wrapTermsInText('')).toBe('');
    });

    it('returns escaped text when no terms match', () => {
      const result = wrapTermsInText('No matching terms here');
      expect(result).toBe('No matching terms here');
      expect(result).not.toContain('glossary-link');
    });

    it('wraps multiple different terms', () => {
      const result = wrapTermsInText('A Resistor and a Capacitor');
      expect(result).toContain('data-term-id="resistor"');
      expect(result).toContain('data-term-id="capacitor"');
    });
  });

  describe('wrapTermsInHtml', () => {
    it('wraps terms in plain text portions of HTML', () => {
      const result = wrapTermsInHtml('<p>A Resistor limits current</p>');
      expect(result).toContain('data-term-id="resistor"');
    });

    it('does NOT wrap terms inside <code> tags', () => {
      const result = wrapTermsInHtml('<p>See <code>Resistor</code> class</p>');
      // The "Resistor" inside <code> should not be wrapped
      expect(result).toContain('<code>Resistor</code>');
      expect(result).not.toContain('<code><span class="glossary-link"');
    });

    it('does NOT wrap terms inside <pre> tags', () => {
      const result = wrapTermsInHtml('<pre>Resistor = 100</pre>');
      expect(result).toContain('<pre>Resistor = 100</pre>');
    });

    it('does NOT wrap terms inside <a> tags', () => {
      const result = wrapTermsInHtml('<a href="/resistor">Resistor info</a>');
      expect(result).not.toContain('<a href="/resistor"><span class="glossary-link"');
    });

    it('wraps only first occurrence per term ID in HTML', () => {
      const result = wrapTermsInHtml('<p>Resistor and Resistor</p>');
      const matches = result.match(/glossary-link/g) || [];
      expect(matches.length).toBe(1);
    });

    it('returns original HTML when no terms match', () => {
      const html = '<p>No matching terms</p>';
      expect(wrapTermsInHtml(html)).toBe(html);
    });

    it('returns empty string for empty input', () => {
      expect(wrapTermsInHtml('')).toBe('');
    });

    it('handles self-closing tags', () => {
      const result = wrapTermsInHtml('<p>A Resistor<br/>limits current</p>');
      expect(result).toContain('data-term-id="resistor"');
    });

    it('handles unclosed tags (no closing >)', () => {
      // Edge case: < without a matching >
      const result = wrapTermsInHtml('A Resistor < 100 ohms');
      expect(result).toBeDefined();
    });

    it('handles nested skip tags', () => {
      const result = wrapTermsInHtml('<pre><code>Resistor</code></pre>');
      expect(result).not.toContain('glossary-link');
    });

    it('does NOT wrap terms inside <script> tags', () => {
      const result = wrapTermsInHtml('<script>const Resistor = 5</script>');
      expect(result).not.toContain('glossary-link');
    });

    it('does NOT wrap terms inside <kbd> tags', () => {
      const result = wrapTermsInHtml('<kbd>Resistor</kbd>');
      expect(result).not.toContain('glossary-link');
    });

    it('wraps terms after skip tags close', () => {
      const result = wrapTermsInHtml('<code>code</code> A Resistor');
      expect(result).toContain('data-term-id="resistor"');
    });
  });

  describe('getTermById', () => {
    it('returns term object for valid ID', () => {
      const term = getTermById('resistor');
      expect(term).toBeDefined();
      expect(term?.id).toBe('resistor');
      expect(term?.term).toBe('Resistor');
    });

    it('returns undefined for unknown ID', () => {
      expect(getTermById('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllTerms', () => {
    it('returns all terms', () => {
      const terms = getAllTerms();
      expect(terms).toHaveLength(4);
    });

    it('returns term objects with expected shape', () => {
      const terms = getAllTerms();
      terms.forEach(t => {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('term');
        expect(t).toHaveProperty('acronyms');
      });
    });
  });
});
