// src/lib/grid-code/pdf-extract.ts
//
// Client-side PDF text extraction used by the Grid Code Viewer to auto-
// populate clause→page mappings for uploaded PDFs. The viewer otherwise
// has no way to know which page (say) ECC.6.3.7 lives on for the user's
// own copy of The Grid Code.
//
// Strategy:
//   1. Lazy-load PDF.js from the already-bundled /pdfjs/build/pdf.mjs
//      (no extra npm dep — same library the viewer iframe uses).
//   2. Walk every page, pull the text layer, match each candidate clauseId
//      against the page text (with whitespace + separator tolerance).
//   3. Return { clauseId: pageNumber } for the first hit per clause.
//
// Tolerances:
//   • Clause IDs in PDFs frequently wrap (`ECC.\n6.3.7`) or use variable
//     separators (`ECC 6.3.7`, `ECC. 6.3.7`). The matcher normalises both
//     sides before regex.
//   • We require the match to be word-bounded so `13.2` doesn't grab
//     `Table 13.2-1` incidentally — first hit wins.

// Minimal PDF.js types — we only need what we use.
// `transform` is PDF.js's 6-element affine matrix; transform[5] is the Y
// offset of the text-run baseline, which we use to detect line breaks.
interface PdfTextItem { str: string; transform?: number[]; [k: string]: unknown }
interface PdfTextContent { items: PdfTextItem[] }
interface PdfPage { getTextContent(): Promise<PdfTextContent> }
interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
  destroy(): Promise<void>;
}
interface PdfJsModule {
  getDocument(src: { data: ArrayBuffer } | { url: string }): { promise: Promise<PdfDocument> };
  GlobalWorkerOptions: { workerSrc: string };
}

let pdfjsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    // PDF.js lives in /public, so Vite refuses a direct `import()` against
    // it. We bypass static analysis by constructing the dynamic import via
    // `Function`, which the browser resolves as a normal module URL at
    // runtime.
    const dynamicImport = new Function('p', 'return import(p)') as (p: string) => Promise<unknown>;
    pdfjsPromise = dynamicImport('/pdfjs/build/pdf.mjs').then((mod: unknown) => {
      const pdfjs = mod as PdfJsModule;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

// Build a regex that matches a clauseId tolerantly:
//   "ECC.6.3.7"  →  /ECC[.\s]*6[.\s]*3[.\s]*7/
//   "13.2"       →  /13[.\s]*2/
//   "BC3"        →  /BC[.\s]*3/
// We split on dots AND on the boundary between letters and digits so that
// `BC3` matches `BC 3` and `BC\n3`. Each segment is escaped before being
// joined with `[.\s]*`.
export function buildClauseRegex(clauseId: string): RegExp {
  const trimmed = clauseId.trim();
  // Split on dots, then split each non-dot segment on letter/digit boundary
  const segments: string[] = [];
  for (const part of trimmed.split('.')) {
    if (!part) continue;
    // Split where letters meet digits (BC3 -> BC, 3)
    const subparts = part.split(/(?<=\D)(?=\d)|(?<=\d)(?=\D)/);
    for (const sub of subparts) {
      if (sub) segments.push(sub);
    }
  }
  if (segments.length === 0) return /(?!)/; // never matches
  const escaped = segments.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // \b at start would block "(ECC.6.3.7)" matches because ( is non-word;
  // require either start-of-text/space/punctuation before, and end-of-word after.
  const body = escaped.join('[.\\s]*');
  // Negative lookahead excludes [A-Za-z0-9] AND -/_, so we don't accidentally
  // match "13.2" inside "Table 13.2-1" or "ECC.6.3" inside "ECC.6.3-something".
  return new RegExp(`(?:^|[\\s\\(\\[\\.,;:—–§])${body}(?![A-Za-z0-9\\-_])`, 'm');
}

// Normalise the raw text-content items into a single per-page string.
// PDF.js gives us one item per text-run; we join with spaces because the
// physical layout (columns, hyphenation) doesn't survive raw extraction.
function pageText(content: PdfTextContent): string {
  return content.items
    .map(it => (typeof it.str === 'string' ? it.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ');
}

// Line-aware version: emit one logical line per PDF text-run group sharing
// the same Y baseline. Y comparison uses transform[5] from PDF.js, with a
// small epsilon so micro-typographic adjustments don't fragment a line.
// Returns lines stripped of leading/trailing whitespace; empty lines are
// dropped. Falls back gracefully when transform info is absent (treats
// every item as its own line, which is conservative — the heading regex
// will then anchor on item boundaries, still useful).
export function pageLines(content: PdfTextContent): string[] {
  const Y_EPSILON = 1.5;
  const lines: string[] = [];
  let current = '';
  let currentY: number | null = null;
  for (const it of content.items) {
    const str = typeof it.str === 'string' ? it.str : '';
    if (!str) continue;
    const y = it.transform && typeof it.transform[5] === 'number' ? it.transform[5] : null;
    if (currentY === null || y === null || Math.abs(y - currentY) <= Y_EPSILON) {
      current += (current ? ' ' : '') + str;
    } else {
      const trimmed = current.replace(/\s+/g, ' ').trim();
      if (trimmed) lines.push(trimmed);
      current = str;
    }
    if (y !== null) currentY = y;
  }
  const trimmed = current.replace(/\s+/g, ' ').trim();
  if (trimmed) lines.push(trimmed);
  return lines;
}

// Build the three heading-shaped patterns used by the outline extractor.
// Each returns [, id, title] match groups.
export function buildHeadingRegexes(): RegExp[] {
  return [
    // Dotted alphabetic IDs: ECC.6.3.7, CC.A.3.2, BC2.11, CP.11, BC3, etc.
    // The alpha-prefix may be followed by 0-3 digits (BC2, BC3) and then
    // any number of dot-separated sub-segments. Title must start with a
    // capital and span 4..80 chars of letters/punctuation. Requires at
    // least one digit somewhere in the id so plain words don't match.
    /^([A-Z]{1,5}\d{1,3}(?:\.[A-Za-z\d]+)*|[A-Z]{1,5}(?:\.[A-Za-z\d]+)+)\s+([A-Z][^\n]{4,80})$/,
    // Plain numeric IDs: 11, 12.5, 13.2, 11.2.3 — up to 4 dot segments.
    // Allow an optional trailing dot after the id ("13.2.").
    /^(\d+(?:\.\d+){0,3})\.?\s+([A-Z][^\n]{4,80})$/,
    // EU-style: "Article 14", "Annex C.5.7.3", "Appendix B".
    /^(Article\s+\d+|Annex\s+[A-Z](?:\.\d+)*|Appendix\s+[A-Z])\s+([^\n]{4,80})$/,
  ];
}

// Page-footer / running-header noise that the regexes occasionally catch.
// These get filtered out before storage.
const HEADING_REJECT = /^(?:page\s+\d+|continued|see\s+also|figure\s+\d|table\s+\d)/i;

function lineLooksLikeHeading(line: string): boolean {
  // A page footer is often "Page 13 of 380" — short, has digits. Filter.
  if (line.length < 6) return false;
  if (HEADING_REJECT.test(line)) return false;
  return true;
}

export interface ExtractClausePagesOptions {
  // Bail out if the extraction would take longer than this many ms.
  // Default: no timeout. Used by the upload-flow to give large PDFs a chance
  // to finish without blocking the UI forever.
  timeoutMs?: number;
  // Called after each page is processed (1-based page number).
  // Use to update a progress indicator.
  onProgress?: (pageNum: number, totalPages: number) => void;
}

/**
 * Extract clauseId→pageNumber for each candidate clauseId by reading the
 * given PDF blob's text layer. Returns a partial map — only clauses that
 * had at least one hit appear in the result. Page numbers are 1-based.
 *
 * Memory: streams page by page; doesn't hold all text in memory at once.
 * Time: roughly 5–10 ms per page on a modern machine.
 */
export async function extractClausePages(
  blob: Blob,
  candidateClauseIds: string[],
  opts: ExtractClausePagesOptions = {},
): Promise<Record<string, number>> {
  if (candidateClauseIds.length === 0) return {};

  const startedAt = Date.now();
  const pdfjs = await loadPdfJs();
  const buf  = await blob.arrayBuffer();
  const pdf  = await pdfjs.getDocument({ data: buf }).promise;

  // Precompile a regex per clauseId once; track which ones we still need to hit.
  const remaining = new Map<string, RegExp>();
  for (const id of candidateClauseIds) remaining.set(id, buildClauseRegex(id));

  const found: Record<string, number> = {};

  try {
    for (let p = 1; p <= pdf.numPages && remaining.size > 0; p++) {
      if (opts.timeoutMs && Date.now() - startedAt > opts.timeoutMs) break;
      const page = await pdf.getPage(p);
      const txt  = pageText(await page.getTextContent());
      for (const [id, re] of remaining) {
        if (re.test(txt)) {
          found[id] = p;
          remaining.delete(id);
        }
      }
      opts.onProgress?.(p, pdf.numPages);
    }
  } finally {
    await pdf.destroy();
  }

  return found;
}

export interface OutlineHit {
  id:    string;
  title: string;
  page:  number;
}

export interface ExtractOutlineOptions extends ExtractClausePagesOptions {
  // Stop collecting after this many hits. Default 500 — large enough for
  // every doc in the catalogue, small enough to keep IndexedDB happy.
  maxEntries?: number;
}

/**
 * Walk the PDF and emit a heading outline: every line that looks like a
 * clause heading, with its 1-based page number. The three regexes from
 * buildHeadingRegexes() are applied in priority order; the first match per
 * line wins. Within a page, multiple heading lines are emitted in textual
 * order. Across pages, dedup by clause-id (first occurrence wins).
 */
export async function extractDocumentOutline(
  blob: Blob,
  opts: ExtractOutlineOptions = {},
): Promise<OutlineHit[]> {
  const startedAt   = Date.now();
  const maxEntries  = opts.maxEntries ?? 500;
  const pdfjs       = await loadPdfJs();
  const buf         = await blob.arrayBuffer();
  const pdf         = await pdfjs.getDocument({ data: buf }).promise;
  const regexes     = buildHeadingRegexes();
  const seen        = new Set<string>();
  const out: OutlineHit[] = [];

  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      if (opts.timeoutMs && Date.now() - startedAt > opts.timeoutMs) break;
      if (out.length >= maxEntries) break;
      const page = await pdf.getPage(p);
      const lines = pageLines(await page.getTextContent());
      for (const line of lines) {
        if (!lineLooksLikeHeading(line)) continue;
        for (const re of regexes) {
          const m = re.exec(line);
          if (!m) continue;
          const id    = m[1].trim();
          const title = m[2].trim().replace(/[\s.;,:]+$/, '');
          if (!id || !title) break;
          if (seen.has(id)) break;
          seen.add(id);
          out.push({ id, title, page: p });
          break; // first regex wins for this line
        }
        if (out.length >= maxEntries) break;
      }
      opts.onProgress?.(p, pdf.numPages);
    }
  } finally {
    await pdf.destroy();
  }

  return out;
}
