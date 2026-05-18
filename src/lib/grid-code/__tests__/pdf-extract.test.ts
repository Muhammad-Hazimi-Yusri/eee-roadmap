// Unit tests for the clause-id matcher in pdf-extract.ts. We don't test
// the PDF.js loader path here — that's covered by manual integration
// testing in the browser (Node lacks the DOM the worker needs).

import { describe, it, expect } from 'vitest';
import {
  buildClauseRegex, buildHeadingRegexes, pageLines,
  parseTocLine, titleLooksLikeHeading,
} from '../pdf-extract';

describe('buildClauseRegex', () => {
  it('matches an exact clause ID', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('see ECC.6.3.7 for details')).toBe(true);
  });

  it('matches a clause ID with surrounding punctuation', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('(ECC.6.3.7)')).toBe(true);
    expect(buildClauseRegex('13.2').test('Section 13.2 — Frequency Response')).toBe(true);
  });

  it('tolerates whitespace between segments', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('ECC 6 3 7 elsewhere')).toBe(true);
    expect(buildClauseRegex('ECC.6.3.7').test('ECC.\n6.3.7 wrapped')).toBe(true);
  });

  it('tolerates mixed dots and spaces', () => {
    expect(buildClauseRegex('ECC.6.3.7').test('ECC. 6.3.7')).toBe(true);
    expect(buildClauseRegex('ECC.6.3.7').test('ECC 6.3.7')).toBe(true);
  });

  it('handles letter+digit IDs like BC3', () => {
    expect(buildClauseRegex('BC3').test('BC3 is the commercial code')).toBe(true);
    expect(buildClauseRegex('BC3').test('BC 3 is the commercial code')).toBe(true);
  });

  it('handles long dotted IDs like ECC.6.3.15.10', () => {
    expect(buildClauseRegex('ECC.6.3.15.10').test('see ECC.6.3.15.10 envelope')).toBe(true);
  });

  it("doesn't match substrings of larger numbers", () => {
    // Table 13.2-1 should not match 13.2
    expect(buildClauseRegex('13.2').test('Table 13.2-1')).toBe(false);
  });

  it("doesn't match if a digit continues past the end", () => {
    // 6.3.7 should not match 6.3.75
    expect(buildClauseRegex('6.3.7').test('clause 6.3.75')).toBe(false);
  });

  it("doesn't match if a letter continues past the end", () => {
    // ECC.6.3 should not match ECC.6.3X
    expect(buildClauseRegex('ECC.6.3').test('ECC.6.3X')).toBe(false);
  });

  it('handles ENA bare clause IDs (no leading letters)', () => {
    expect(buildClauseRegex('13.2').test('clause 13.2 covers FSM')).toBe(true);
    expect(buildClauseRegex('13.6').test('Section 13.6.')).toBe(true);
  });

  it('returns a never-match regex for empty input', () => {
    expect(buildClauseRegex('').test('anything at all')).toBe(false);
  });
});

// Find the first regex from buildHeadingRegexes() that matches a line.
// Returns [id, title] or null.
function matchHeading(line: string): [string, string] | null {
  for (const re of buildHeadingRegexes()) {
    const m = re.exec(line);
    if (m) return [m[1].trim(), m[2].trim()];
  }
  return null;
}

describe('buildHeadingRegexes', () => {
  it('matches Grid Code dotted alphabetic IDs', () => {
    expect(matchHeading('ECC.6.3.7 Frequency Response')).toEqual(['ECC.6.3.7', 'Frequency Response']);
    expect(matchHeading('CC.A.3.2 Legacy GB Frequency Response')).toEqual(['CC.A.3.2', 'Legacy GB Frequency Response']);
    expect(matchHeading('BC2.11 Operational Notification')).toEqual(['BC2.11', 'Operational Notification']);
  });

  it('matches ENA plain-numeric IDs', () => {
    expect(matchHeading('11 Type A Protection')).toEqual(['11', 'Type A Protection']);
    expect(matchHeading('13.2 Frequency Response')).toEqual(['13.2', 'Frequency Response']);
    expect(matchHeading('12.5.3 Reactive capability')).toEqual(['12.5.3', 'Reactive capability']);
  });

  it('matches numeric IDs with a trailing dot', () => {
    expect(matchHeading('13.2. Frequency Response')).toEqual(['13.2', 'Frequency Response']);
  });

  it('matches EU Article / Annex / Appendix IDs', () => {
    expect(matchHeading('Article 14 General requirements')).toEqual(['Article 14', 'General requirements']);
    expect(matchHeading('Annex C.5.7.3 Frequency response envelope')).toEqual(['Annex C.5.7.3', 'Frequency response envelope']);
    expect(matchHeading('Appendix B Compliance Process')).toEqual(['Appendix B', 'Compliance Process']);
  });

  it('rejects body sentences that start with a lowercase letter', () => {
    expect(matchHeading('the generator must remain connected')).toBeNull();
    expect(matchHeading('13.2 frequency response (lowercase)')).toBeNull();
  });

  it('rejects table captions, figure captions, and page footers', () => {
    expect(matchHeading('Table 13.2-1 Capability envelope')).toBeNull();
    expect(matchHeading('Figure 4 — System overview')).toBeNull();
    expect(matchHeading('Page 13 of 380')).toBeNull();
  });

  it('rejects lines longer than 80 chars in the title portion', () => {
    const longTitle = 'A'.repeat(120);
    expect(matchHeading(`11 ${longTitle}`)).toBeNull();
  });

  it('rejects very short lines that may be noise', () => {
    expect(matchHeading('11 Ok')).toBeNull(); // title under 4 chars
  });
});

describe('pageLines', () => {
  it('groups items by Y baseline', () => {
    const content = {
      items: [
        { str: 'Heading',  transform: [1, 0, 0, 1, 10, 800] },
        { str: 'line',     transform: [1, 0, 0, 1, 80, 800] },
        { str: 'body',     transform: [1, 0, 0, 1, 10, 770] },
        { str: 'text',     transform: [1, 0, 0, 1, 50, 770] },
      ],
    };
    expect(pageLines(content)).toEqual(['Heading line', 'body text']);
  });

  it('drops empty items and collapses whitespace', () => {
    const content = {
      items: [
        { str: '',     transform: [1, 0, 0, 1, 0, 800] },
        { str: 'hi',   transform: [1, 0, 0, 1, 0, 800] },
        { str: '   ',  transform: [1, 0, 0, 1, 0, 800] },
        { str: 'you',  transform: [1, 0, 0, 1, 0, 800] },
      ],
    };
    expect(pageLines(content)).toEqual(['hi    you'].map(s => s.replace(/\s+/g, ' ')));
  });

  it('tolerates micro Y differences within Y_EPSILON', () => {
    const content = {
      items: [
        { str: 'same', transform: [1, 0, 0, 1, 0, 800.0] },
        { str: 'line', transform: [1, 0, 0, 1, 0, 800.8] },
      ],
    };
    expect(pageLines(content)).toEqual(['same line']);
  });

  it('falls back to single-item lines when transforms are missing', () => {
    const content = { items: [{ str: 'a' }, { str: 'b' }, { str: 'c' }] };
    // No transform means currentY stays null, so all items keep accumulating
    // — the single-line fallback. Conservative: outline regex still anchors
    // on item boundaries via the trim/replace step.
    const lines = pageLines(content);
    expect(lines).toEqual(['a b c']);
  });
});

describe('parseTocLine', () => {
  it('parses a typical Grid-Code ToC line with leader dots', () => {
    expect(parseTocLine('BC3.7 RESPONSE TO HIGH FREQUENCY ....... 6'))
      .toEqual({ id: 'BC3.7', title: 'RESPONSE TO HIGH FREQUENCY', page: 6 });
  });

  it('parses an ENA-style numeric ToC line', () => {
    expect(parseTocLine('13.2 Frequency Response (Type B/C/D) ........ 158'))
      .toEqual({ id: '13.2', title: 'Frequency Response (Type B/C/D)', page: 158 });
  });

  it('parses an EU-style Article ToC line', () => {
    expect(parseTocLine('Article 14 General requirements for Type C ........ 22'))
      .toEqual({ id: 'Article', title: '14 General requirements for Type C', page: 22 });
    // ↑ With the current regex `Article` is captured as id, `14 ...` as title.
    // The downstream tier-2 filter rejects this when tocIdLooksClausey
    // returns false, so EU outlines come through the embedded-outline tier
    // instead. This test pins the current behaviour so we know if it shifts.
  });

  it('rejects body lines that have no leader dots', () => {
    expect(parseTocLine('ECC.6.3.7 Frequency Response is mandatory')).toBeNull();
    expect(parseTocLine('The Grid Code requires that ECC.6.3.7 be observed')).toBeNull();
  });

  it('rejects lines without a trailing page number', () => {
    expect(parseTocLine('BC3.7 RESPONSE TO HIGH FREQUENCY ....... continued')).toBeNull();
  });

  it('rejects very short lines and pure-numeric titles', () => {
    expect(parseTocLine('1 ... 2')).toBeNull();
  });

  it('handles tight leaders (just 3 dots)', () => {
    expect(parseTocLine('PC.1 Planning Code ... 12')).toEqual({
      id: 'PC.1', title: 'Planning Code', page: 12,
    });
  });
});

describe('titleLooksLikeHeading', () => {
  it('accepts proper heading titles', () => {
    expect(titleLooksLikeHeading('ECC.6.3.7', 'Frequency Response')).toBe(true);
    expect(titleLooksLikeHeading('11', 'Type A Protection')).toBe(true);
    expect(titleLooksLikeHeading('BC3', 'Frequency Control (commercial delivery)')).toBe(true);
    expect(titleLooksLikeHeading('Annex C.5', 'Frequency Response Envelope')).toBe(true);
  });

  it('accepts ALL-CAPS headings', () => {
    expect(titleLooksLikeHeading('BC3.7', 'RESPONSE TO HIGH FREQUENCY REQUIRED')).toBe(true);
  });

  it('tolerates connector words in titles', () => {
    expect(titleLooksLikeHeading('13.2', 'Reactive Power and Voltage Control')).toBe(true);
    expect(titleLooksLikeHeading('13.6', 'Loss of Mains Protection')).toBe(true);
  });

  it('rejects body sentences disguised as headings', () => {
    expect(titleLooksLikeHeading('2019', 'In this case, all connections to the National Electricity')).toBe(false);
    expect(titleLooksLikeHeading('Appendix P', 'of the relevant Construction Agreement as amended from')).toBe(false);
  });

  it('rejects date strings (year + month)', () => {
    expect(titleLooksLikeHeading('2026', 'May 2026 issue')).toBe(false);
    expect(titleLooksLikeHeading('07', 'May 2026')).toBe(false);
    expect(titleLooksLikeHeading('2019', 'September 2018, and prior amendments')).toBe(false);
  });

  it('rejects unit-table rows', () => {
    // "1000" id, "Wh = 1 kWh" — "kWh" starts lowercase and isn't a connector
    expect(titleLooksLikeHeading('1000', 'Wh = 1 kWh')).toBe(false);
  });

  it('rejects very short titles', () => {
    expect(titleLooksLikeHeading('5', 'OK')).toBe(false);
  });
});
