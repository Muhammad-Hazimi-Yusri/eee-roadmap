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

// PDF /Outlines tree entries. `dest` can be either a named string (which
// must be resolved via pdf.getDestination()) or an explicit array whose
// first element is a page reference suitable for pdf.getPageIndex().
type PdfDest = string | unknown[] | null;
interface PdfOutlineNode {
  title: string;
  dest?: PdfDest;
  items?: PdfOutlineNode[];
  [k: string]: unknown;
}

interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
  destroy(): Promise<void>;
  getOutline(): Promise<PdfOutlineNode[] | null>;
  getDestination(name: string): Promise<unknown[] | null>;
  getPageIndex(ref: unknown): Promise<number>;
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

// Small connector words that we DON'T penalise when checking title-case.
// Headings are typically Title Case but small connector words remain
// lowercase by convention.
const TITLE_CONNECTOR = new Set([
  'the','of','and','to','for','with','in','on','by','at','a','an',
  'or','as','vs','but','nor','so','via','per','from',
]);

// Month-name prefixes used to detect date strings. Match Jan/Feb/Mar… or
// the full forms; case-insensitive at the call site.
const MONTH_PREFIX = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;

// Reject lines that look like body sentences, dates, or unit-table rows
// even when they happen to match a heading regex shape:
//   - Any short-numeric id followed by a month-name token in the title is
//     a date (covers both "07 May 2026" and "2026 May issue").
//   - The title contains math operators (=, <, >, ±, ≤, ≥, →) — units /
//     equation rows.
//   - The title has > 1 lowercase content word (non-connector). Real
//     headings are title-case or all-caps.
export function titleLooksLikeHeading(id: string, title: string): boolean {
  if (title.length < 4) return false;
  // Date detection: any short-numeric id with a month-name token in the title
  if (/^\d{1,4}$/.test(id) && MONTH_PREFIX.test(title)) return false;
  // Equation / unit-table rows: real headings rarely contain math operators
  if (/[=<>±≤≥→]/.test(title)) return false;
  // Title-case check — count alphabetic words that start lowercase and
  // aren't connectors. Real headings have at most ~1 such (covers the
  // occasional truncated trailing word).
  const words = title.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  let bad = 0;
  for (const w of words) {
    if (!/^[a-z]/.test(w)) continue;
    if (TITLE_CONNECTOR.has(w.toLowerCase())) continue;
    bad++;
    if (bad > 1) return false;
  }
  return true;
}

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
  source: 'outline' | 'toc' | 'auto';
}

export interface ExtractOutlineOptions extends ExtractClausePagesOptions {
  // Stop collecting after this many hits. Default 500 — large enough for
  // every doc in the catalogue, small enough to keep IndexedDB happy.
  maxEntries?: number;
  // Below this hit count, a tier is considered "didn't work" and we fall
  // through to the next one. Default 5.
  minTierEntries?: number;
}

// ─── Tier 1: embedded outline (pdf.getOutline) ──────────────────────────────

// Resolve a PDF destination to a 1-based page number. `dest` may be a
// named destination (string → must be resolved via getDestination) or
// an explicit array whose first element is a page Ref. Returns 0 when
// the destination can't be resolved, which the caller treats as "skip".
async function resolveDestPage(pdf: PdfDocument, dest: PdfDest): Promise<number> {
  if (!dest) return 0;
  let explicit: unknown[] | null;
  if (typeof dest === 'string') {
    explicit = await pdf.getDestination(dest).catch(() => null);
  } else {
    explicit = dest;
  }
  if (!explicit || explicit.length === 0) return 0;
  const pageRef = explicit[0];
  if (pageRef == null) return 0;
  try {
    const idx = await pdf.getPageIndex(pageRef);
    return idx + 1;
  } catch {
    return 0;
  }
}

// Strip a trailing leader+page artefact from outline titles like
// "Section 6 ........ 12". Some PDF generators bake the page number into
// the bookmark text rather than the dest array. We keep the dest's page,
// drop the redundant tail.
function cleanOutlineTitle(raw: string): string {
  return raw.replace(/[\s.·•–—-]{2,}\d{1,4}\s*$/, '').trim();
}

// Split an outline title into (id, title) using the same heading regexes
// as tier 3, falling back to (full-title, full-title) when no regex
// matches. Either way the entry is navigable.
function splitOutlineTitle(raw: string): { id: string; title: string } {
  const cleaned = cleanOutlineTitle(raw);
  for (const re of buildHeadingRegexes()) {
    const m = re.exec(cleaned);
    if (m) {
      const id    = m[1].trim();
      const title = m[2].trim().replace(/[\s.;,:]+$/, '');
      if (id && title) return { id, title };
    }
  }
  return { id: cleaned, title: cleaned };
}

async function extractEmbeddedOutline(pdf: PdfDocument): Promise<OutlineHit[]> {
  let nodes: PdfOutlineNode[] | null;
  try {
    nodes = await pdf.getOutline();
  } catch {
    nodes = null;
  }
  if (!nodes || nodes.length === 0) return [];

  const out: OutlineHit[] = [];
  const seen = new Set<string>();

  async function walk(list: PdfOutlineNode[]): Promise<void> {
    for (const node of list) {
      if (typeof node.title === 'string' && node.title.trim()) {
        const page = await resolveDestPage(pdf, node.dest ?? null);
        if (page > 0) {
          const { id, title } = splitOutlineTitle(node.title);
          if (!seen.has(id)) {
            seen.add(id);
            out.push({ id, title, page, source: 'outline' });
          }
        }
      }
      if (node.items && node.items.length > 0) await walk(node.items);
    }
  }
  await walk(nodes);
  return out;
}

// ─── Tier 2: ToC page extraction (leader-dot lines) ─────────────────────────

// Match a typical ToC line:
//   ECC.6.3.7   Frequency Response   .........  42
//   13.2  Frequency Response (Type B/C/D)  ......  158
// Capture groups: id, title, page. Leader is 3+ dot/space chars.
const TOC_LINE_RE = /^(\S+)\s+(.+?)\s*[.\s]{3,}\s*(\d{1,4})$/;

// Maximum pages we'll scan looking for ToC pages. ToCs typically sit in
// the first few pages of a long doc; 20 is generous.
const TOC_SCAN_PAGE_LIMIT = 20;

// A page with >= this many ToC-shaped lines counts as a ToC page.
const TOC_PAGE_LINE_THRESHOLD = 3;

export function parseTocLine(line: string): { id: string; title: string; page: number } | null {
  const m = TOC_LINE_RE.exec(line);
  if (!m) return null;
  const id    = m[1].trim();
  const title = m[2].trim();
  const page  = Number(m[3]);
  if (!id || !title || !Number.isFinite(page) || page <= 0) return null;
  // The title must contain at least one alphabetic character — a bare
  // dot or digits-only string is a pathological match, not a real ToC
  // line (e.g. "1 ... 2" where the regex sees `1`+`. .`+`2`).
  if (!/[a-zA-Z]/.test(title)) return null;
  if (title.length < 3) return null;
  return { id, title, page };
}

// Does the captured id look like a clause id (vs a stray word)?
function tocIdLooksClausey(id: string): boolean {
  // Plain numeric, dotted-numeric, alpha-dotted, EU-style: anything that
  // any of the heading regexes accept as an id.
  for (const re of buildHeadingRegexes()) {
    if (re.test(`${id} Title Of Section`)) return true;
  }
  return false;
}

async function extractTocPageEntries(
  pdf: PdfDocument,
  opts: ExtractOutlineOptions,
): Promise<OutlineHit[]> {
  const startedAt = Date.now();
  const seen = new Set<string>();
  const out: OutlineHit[] = [];
  const lastPage = Math.min(pdf.numPages, TOC_SCAN_PAGE_LIMIT);
  let foundTocPage = false;

  for (let p = 1; p <= lastPage; p++) {
    if (opts.timeoutMs && Date.now() - startedAt > opts.timeoutMs) break;
    const page = await pdf.getPage(p);
    const lines = pageLines(await page.getTextContent());

    const hits: { id: string; title: string; page: number }[] = [];
    for (const line of lines) {
      const parsed = parseTocLine(line);
      if (!parsed) continue;
      if (!tocIdLooksClausey(parsed.id)) continue;
      hits.push(parsed);
    }
    if (hits.length >= TOC_PAGE_LINE_THRESHOLD) {
      foundTocPage = true;
      for (const h of hits) {
        if (seen.has(h.id)) continue;
        seen.add(h.id);
        out.push({ ...h, source: 'toc' });
      }
    } else if (foundTocPage) {
      // ToC pages typically run contiguously. The first page after the
      // ToC with no ToC-shaped lines is the end. Stop scanning.
      break;
    }
  }

  return out;
}

// ─── Tier 3: heading-line heuristic (with date + title-case filters) ────────

async function extractHeadingLines(
  pdf: PdfDocument,
  opts: ExtractOutlineOptions,
): Promise<OutlineHit[]> {
  const startedAt  = Date.now();
  const maxEntries = opts.maxEntries ?? 500;
  const regexes    = buildHeadingRegexes();
  const seen       = new Set<string>();
  const out: OutlineHit[] = [];

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
        if (!titleLooksLikeHeading(id, title)) break;
        seen.add(id);
        out.push({ id, title, page: p, source: 'auto' });
        break; // first regex wins for this line
      }
      if (out.length >= maxEntries) break;
    }
    opts.onProgress?.(p, pdf.numPages);
  }
  return out;
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

/**
 * Walk the PDF and emit a per-document outline. Tries three canonical
 * sources in order of cleanliness:
 *   1. The PDF's embedded /Outlines tree (`pdf.getOutline()`)
 *   2. ToC pages in the body, parsed via leader-dot regex
 *   3. Heading-line heuristic over body text (with date + title-case filters)
 * The first source that yields >= `minTierEntries` entries wins. Caps the
 * result at `maxEntries` regardless of source. Each entry carries a
 * `source` field so the UI can badge it.
 */
export async function extractDocumentOutline(
  blob: Blob,
  opts: ExtractOutlineOptions = {},
): Promise<OutlineHit[]> {
  const minTier    = opts.minTierEntries ?? 5;
  const maxEntries = opts.maxEntries ?? 500;
  const pdfjs      = await loadPdfJs();
  const buf        = await blob.arrayBuffer();
  const pdf        = await pdfjs.getDocument({ data: buf }).promise;

  try {
    const embedded = await extractEmbeddedOutline(pdf);
    if (embedded.length >= minTier) return embedded.slice(0, maxEntries);

    const toc = await extractTocPageEntries(pdf, opts);
    if (toc.length >= minTier) return toc.slice(0, maxEntries);

    const auto = await extractHeadingLines(pdf, opts);
    // Mix in any partial hits from earlier tiers so we don't lose them.
    const seen = new Set<string>();
    const merged: OutlineHit[] = [];
    for (const e of [...embedded, ...toc, ...auto]) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
      if (merged.length >= maxEntries) break;
    }
    return merged;
  } finally {
    await pdf.destroy();
  }
}
