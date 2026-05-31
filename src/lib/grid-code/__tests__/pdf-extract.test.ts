// Unit tests for the clause-id matcher in pdf-extract.ts. We don't test
// the PDF.js loader path here — that's covered by manual integration
// testing in the browser (Node lacks the DOM the worker needs).

import { describe, it, expect, vi } from 'vitest';
import {
  buildClauseRegex, buildHeadingRegexes, pageLines,
  parseTocLine, titleLooksLikeHeading,
  findTocPageRange, extractTocStructure,
  resolveIdsToPages, resolveDestPage, extractEmbeddedOutline,
  cleanOutlineTitle, splitOutlineTitle, extractTocOutline,
  extractHeadingLines, selectDocumentOutline,
} from '../pdf-extract';

// Overrides for the PDF.js document members the outline tiers reach for.
// Default fakes return "no embedded outline" so the ToC/heading tiers run.
type FakeExtra = {
  getOutline?:     () => Promise<unknown>;
  getDestination?: (name: string) => Promise<unknown>;
  getPageIndex?:   (ref: unknown) => Promise<number>;
};

// Build a fake PDF document from an array of pages, each page an array of
// line strings. One text item per line, each given a distinct Y baseline
// so pageLines() keeps them as separate lines. `extra` lets a test supply
// an embedded /Outlines tree and dest→page resolution for tier-1 coverage.
function fakePdf(pages: string[][], extra: FakeExtra = {}) {
  return {
    numPages: pages.length,
    async getPage(n: number) {
      const lines = pages[n - 1] ?? [];
      return {
        async getTextContent() {
          return {
            items: lines.map((str, i) => ({
              str,
              transform: [1, 0, 0, 1, 0, 1000 - i * 20],
            })),
          };
        },
      };
    },
    async destroy() {},
    getOutline:     extra.getOutline     ?? (async () => null),
    getDestination: extra.getDestination ?? (async () => null),
    getPageIndex:   extra.getPageIndex   ?? (async () => 0),
  } as unknown as Parameters<typeof findTocPageRange>[0];
}

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

describe('findTocPageRange', () => {
  // A Grid-Code-style contents page: many code-only section lines, no page
  // numbers. Page 1 is a cover; page 2 is the contents; page 3+ is body.
  const contents = [
    'OC1 Demand Forecasts',
    'OC2 Operational Planning and Data Provision',
    'OC3 Systems Incident Report',
    'OC4 Demand Control',
    'OC5 Testing and Monitoring',
    'BC1 Pre Gate Closure Process',
    'BC2 Post Gate Closure Process',
  ];

  it('finds the contiguous contents page run', async () => {
    const pdf = fakePdf([
      ['THE GRID CODE', 'Issue 6 Revision 39'],   // p1 cover
      contents,                                    // p2 contents
      ['OC1 Demand Forecasts', 'Some body text here that is long.'], // p3 body
    ]);
    expect(await findTocPageRange(pdf)).toEqual([2, 2]);
  });

  it('spans multiple contiguous contents pages', async () => {
    const pdf = fakePdf([
      ['Cover'],
      contents,
      contents,
      ['Body paragraph, not a contents page at all.'],
    ]);
    expect(await findTocPageRange(pdf)).toEqual([2, 3]);
  });

  it('returns null when no page is dense enough', async () => {
    const pdf = fakePdf([
      ['Cover'],
      ['OC1 Demand Forecasts', 'just one heading line'],
      ['Body text only.'],
    ]);
    expect(await findTocPageRange(pdf)).toBeNull();
  });
});

describe('extractTocStructure', () => {
  it('extracts ordered id/title pairs, deduped', async () => {
    const pdf = fakePdf([
      ['Cover'],
      [
        'OC1 Demand Forecasts',
        'OC2 Operational Planning and Data Provision',
        'OC1 Demand Forecasts',          // dup — ignored
        'OC3 Systems Incident Report',
      ],
    ]);
    const entries = await extractTocStructure(pdf, [2, 2]);
    expect(entries.map(e => e.id)).toEqual(['OC1', 'OC2', 'OC3']);
    expect(entries[0]).toEqual({ id: 'OC1', title: 'Demand Forecasts' });
  });

  it('keeps a ToC line page number when present (leader-dot ToC)', async () => {
    const pdf = fakePdf([
      ['Cover'],
      ['13.2 Frequency Response ......... 158'],
    ]);
    const entries = await extractTocStructure(pdf, [2, 2]);
    expect(entries[0]).toEqual({ id: '13.2', title: 'Frequency Response', page: 158 });
  });
});

describe('resolveIdsToPages', () => {
  it('records the first page each id appears on', async () => {
    const pdf = fakePdf([
      ['introductory matter'],               // p1
      ['see ECC.6.3.7 for the response'],    // p2
      ['ECC.6.3.7 again', 'clause 13.2 here'], // p3
    ]);
    expect(await resolveIdsToPages(pdf, ['ECC.6.3.7', '13.2']))
      .toEqual({ 'ECC.6.3.7': 2, '13.2': 3 });
  });

  it('starts at startPage so a ToC page cannot match itself', async () => {
    const pdf = fakePdf([
      ['ECC.6.3.7 listed in the contents'],  // p1 (ToC)
      ['unrelated body'],                    // p2
      ['ECC.6.3.7 in the actual body'],      // p3
    ]);
    expect(await resolveIdsToPages(pdf, ['ECC.6.3.7'], { startPage: 2 }))
      .toEqual({ 'ECC.6.3.7': 3 });
  });

  it('returns a partial map when some ids never appear', async () => {
    const pdf = fakePdf([['only ECC.6.3.7 is here']]);
    expect(await resolveIdsToPages(pdf, ['ECC.6.3.7', 'ECC.9.9.9']))
      .toEqual({ 'ECC.6.3.7': 1 });
  });

  it('returns {} for an empty id list without reading pages', async () => {
    expect(await resolveIdsToPages(fakePdf([['anything']]), [])).toEqual({});
  });

  it('fires onTimeout and bails when the budget is exceeded', async () => {
    const pdf = fakePdf([['nothing on p1'], ['ECC.6.3.7 on p2']]);
    const onTimeout = vi.fn();
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(0).mockReturnValue(5000); // startedAt=0, loop check=5000
    const found = await resolveIdsToPages(pdf, ['ECC.6.3.7'], { timeoutMs: 1, onTimeout });
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(found).toEqual({}); // bailed before reaching p2
    now.mockRestore();
  });
});

describe('resolveDestPage', () => {
  it('resolves a named-string destination via getDestination (1-based)', async () => {
    const pdf = fakePdf([[]], {
      getDestination: async n => (n === 'sec1' ? ['pageRef'] : null),
      getPageIndex:   async () => 6,
    });
    expect(await resolveDestPage(pdf, 'sec1')).toBe(7);
  });

  it('resolves an explicit array destination', async () => {
    const pdf = fakePdf([[]], { getPageIndex: async () => 0 });
    expect(await resolveDestPage(pdf, ['pageRef'])).toBe(1);
  });

  it('returns 0 for null and empty destinations', async () => {
    const pdf = fakePdf([[]]);
    expect(await resolveDestPage(pdf, null)).toBe(0);
    expect(await resolveDestPage(pdf, [])).toBe(0);
  });

  it('returns 0 when getPageIndex throws', async () => {
    const pdf = fakePdf([[]], { getPageIndex: async () => { throw new Error('bad ref'); } });
    expect(await resolveDestPage(pdf, ['pageRef'])).toBe(0);
  });

  it('returns 0 when a named destination does not resolve', async () => {
    const pdf = fakePdf([[]], { getDestination: async () => null });
    expect(await resolveDestPage(pdf, 'missing')).toBe(0);
  });
});

describe('cleanOutlineTitle / splitOutlineTitle', () => {
  it('strips a trailing leader+page artefact', () => {
    expect(cleanOutlineTitle('Section 6 ........ 12')).toBe('Section 6');
    expect(cleanOutlineTitle('No leader here')).toBe('No leader here');
  });

  it('splits an id + title using the heading regexes', () => {
    expect(splitOutlineTitle('ECC.6.3.7 Frequency Response'))
      .toEqual({ id: 'ECC.6.3.7', title: 'Frequency Response' });
  });

  it('cleans the leader before splitting', () => {
    expect(splitOutlineTitle('13.2 Frequency Response ..... 158'))
      .toEqual({ id: '13.2', title: 'Frequency Response' });
  });

  it('falls back to (full, full) when no regex matches', () => {
    expect(splitOutlineTitle('Introduction')).toEqual({ id: 'Introduction', title: 'Introduction' });
  });
});

describe('extractEmbeddedOutline', () => {
  it('walks nested items and resolves each dest to a 1-based page', async () => {
    const nodes = [
      { title: 'ECC.6.3.7 Frequency Response', dest: ['ref-12'] },
      { title: 'Parent Section', dest: ['ref-3'], items: [
        { title: 'BC2.11 Operational Notification', dest: ['ref-20'] },
      ] },
    ];
    const pageMap: Record<string, number> = { 'ref-3': 2, 'ref-12': 11, 'ref-20': 19 };
    const pdf = fakePdf([[]], {
      getOutline:   async () => nodes,
      getPageIndex: async ref => pageMap[String(ref)] ?? 0,
    });
    expect(await extractEmbeddedOutline(pdf)).toEqual([
      { id: 'ECC.6.3.7', title: 'Frequency Response', page: 12, source: 'outline' },
      { id: 'Parent Section', title: 'Parent Section', page: 3, source: 'outline' },
      { id: 'BC2.11', title: 'Operational Notification', page: 20, source: 'outline' },
    ]);
  });

  it('skips nodes whose destination cannot be resolved (page 0)', async () => {
    const nodes = [
      { title: 'ECC.6.3.7 Frequency Response', dest: null },
      { title: '13.2 Frequency Response', dest: ['ref'] },
    ];
    const pdf = fakePdf([[]], { getOutline: async () => nodes, getPageIndex: async () => 8 });
    expect(await extractEmbeddedOutline(pdf)).toEqual([
      { id: '13.2', title: 'Frequency Response', page: 9, source: 'outline' },
    ]);
  });

  it('dedups repeated ids, keeping the first', async () => {
    const nodes = [
      { title: 'ECC.6.3.7 First Title', dest: ['a'] },
      { title: 'ECC.6.3.7 Second Title', dest: ['b'] },
    ];
    const pdf = fakePdf([[]], { getOutline: async () => nodes, getPageIndex: async () => 4 });
    expect(await extractEmbeddedOutline(pdf)).toEqual([
      { id: 'ECC.6.3.7', title: 'First Title', page: 5, source: 'outline' },
    ]);
  });

  it('returns [] when getOutline throws', async () => {
    const pdf = fakePdf([[]], { getOutline: async () => { throw new Error('no outline'); } });
    expect(await extractEmbeddedOutline(pdf)).toEqual([]);
  });

  it('returns [] when there is no embedded outline', async () => {
    expect(await extractEmbeddedOutline(fakePdf([[]]))).toEqual([]);
  });
});

describe('extractTocOutline', () => {
  it('returns empty hits with null range when no contents page is dense enough', async () => {
    const pdf = fakePdf([['Just body text, not a contents page at all.']]);
    expect(await extractTocOutline(pdf, {})).toEqual({ hits: [], tocRange: null });
  });

  it('keeps leader-dot ToC pages and resolves page-less entries from the body', async () => {
    const toc = [
      '13.1 Scope ......... 10',      // carries its own page
      '13.2 Frequency Response',      // resolved from body
      '13.3 Loss of Mains Protection',
      '13.4 Reactive Power Capability',
      '13.5 Voltage Control Requirements',
    ];
    const pdf = fakePdf([
      ['Cover page'],                              // p1
      toc,                                         // p2 contents
      ['intro body paragraph'],                    // p3
      ['13.2 Frequency Response in the body'],     // p4
      ['13.3 Loss of Mains Protection body'],      // p5
      ['13.4 Reactive Power Capability body'],     // p6
      ['13.5 Voltage Control Requirements body'],  // p7
    ]);
    const { hits, tocRange } = await extractTocOutline(pdf, {});
    expect(tocRange).toEqual([2, 2]);
    const byId = Object.fromEntries(hits.map(h => [h.id, h.page]));
    expect(byId['13.1']).toBe(10); // kept from the ToC line
    expect(byId['13.2']).toBe(4);  // resolved from the body
    expect(byId['13.3']).toBe(5);
    expect(hits.every(h => h.source === 'toc')).toBe(true);
  });
});

describe('extractHeadingLines', () => {
  it('collects heading lines across the body, deduping ids', async () => {
    const pdf = fakePdf([
      ['ECC.6.3.7 Frequency Response', 'this is just a body sentence, not a heading'],
      ['ECC.6.3.7 Frequency Response', 'BC2.11 Operational Notification Process'],
    ]);
    expect(await extractHeadingLines(pdf, {})).toEqual([
      { id: 'ECC.6.3.7', title: 'Frequency Response', page: 1, source: 'auto' },
      { id: 'BC2.11', title: 'Operational Notification Process', page: 2, source: 'auto' },
    ]);
  });

  it('honours maxEntries', async () => {
    const pdf = fakePdf([
      ['ECC.6.3.7 Frequency Response', 'ECC.6.3.8 Reactive Power Capability'],
    ]);
    const out = await extractHeadingLines(pdf, { maxEntries: 1 });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('ECC.6.3.7');
  });

  it('skips pages inside skipRange (the contents pages)', async () => {
    const pdf = fakePdf([
      ['ECC.6.3.7 Frequency Response'],         // p1 — skipped
      ['ECC.6.3.8 Reactive Power Capability'],  // p2 — kept
    ]);
    const out = await extractHeadingLines(pdf, {}, [1, 1]);
    expect(out.map(h => h.id)).toEqual(['ECC.6.3.8']);
  });

  it('fires onTimeout and bails early', async () => {
    const pdf = fakePdf([
      ['ECC.6.3.7 Frequency Response'],
      ['ECC.6.3.8 Reactive Power Capability'],
    ]);
    const onTimeout = vi.fn();
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(0).mockReturnValue(5000);
    const out = await extractHeadingLines(pdf, { timeoutMs: 1, onTimeout });
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(out).toEqual([]);
    now.mockRestore();
  });
});

describe('selectDocumentOutline (tier selection)', () => {
  // Embedded /Outlines nodes whose titles parse to ECC.6.3.<i> headings.
  const embeddedNodes = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      title: `ECC.6.3.${i} Heading Number ${i}`,
      dest: [`ref-${i}`],
    }));

  it('returns the embedded outline when it meets minTier', async () => {
    const pdf = fakePdf([[]], {
      getOutline:   async () => embeddedNodes(6),
      getPageIndex: async () => 0,
    });
    const out = await selectDocumentOutline(pdf, { minTierEntries: 5 });
    expect(out).toHaveLength(6);
    expect(out.every(e => e.source === 'outline')).toBe(true);
  });

  it('falls through to the ToC tier when the embedded outline is too small', async () => {
    const toc = [
      '13.1 Scope and Purpose',
      '13.2 Frequency Response',
      '13.3 Loss of Mains Protection',
      '13.4 Reactive Power Capability',
      '13.5 Voltage Control Requirements',
    ];
    const pdf = fakePdf([
      ['Cover'], toc,
      ['13.1 Scope and Purpose body'],
      ['13.2 Frequency Response body'],
      ['13.3 Loss of Mains Protection body'],
      ['13.4 Reactive Power Capability body'],
      ['13.5 Voltage Control Requirements body'],
    ], { getOutline: async () => [], getPageIndex: async () => 0 });
    const out = await selectDocumentOutline(pdf, { minTierEntries: 5 });
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out.every(e => e.source === 'toc')).toBe(true);
  });

  it('merges tiers (deduped) and caps at maxEntries when none meets minTier', async () => {
    const pdf = fakePdf([
      ['ECC.6.3.7 Frequency Response'],
      ['ECC.6.3.8 Reactive Power Capability'],
      ['ECC.6.3.9 Voltage Control Requirements'],
    ], { getOutline: async () => [], getPageIndex: async () => 0 });
    const out = await selectDocumentOutline(pdf, { minTierEntries: 50, maxEntries: 2 });
    expect(out).toHaveLength(2);
    expect(out.every(e => e.source === 'auto')).toBe(true);
  });
});
