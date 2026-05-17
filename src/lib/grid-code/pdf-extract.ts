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
interface PdfTextItem { str: string; [k: string]: unknown }
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
