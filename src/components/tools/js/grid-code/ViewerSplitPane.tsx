// Split-pane viewer: PDF (LEFT) + related-clauses panel (RIGHT).
//
// LEFT pane sources, in order of preference:
//   1. User-uploaded local copy (IndexedDB Blob)        — works for any doc
//   2. /eu-codes/<id>.pdf (hostable-eu, same-origin)    — works for EU NCs
//   3. Bare iframe to publisher URL (iframeable: true)  — works for DCode etc.
//   4. UploadDropzone (link-only / paywalled / no URL)  — user provides own copy
//
// The PDF is rendered through the existing /pdfjs/web/viewer.html iframe
// (same pattern as src/utils/parseNotes.ts). For user-uploaded copies we
// pass a blob: URL via the ?file param. For iframeable publisher PDFs we
// skip PDF.js and render a bare <iframe src={publisherUrl}> so the user
// gets the publisher's PDF without needing to upload.

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  StandardDocument, StandardClause, AdjacencyEntry, HighlightSource, OutlineEntry,
} from '../../../../lib/grid-code/types';
import RelatedClausesPanel from './RelatedClausesPanel';
import UploadDropzone from './UploadDropzone';
import HighlightControls from './HighlightControls';
import { isPinned, togglePin } from '../../../../lib/grid-code/pinned';
import {
  getLocalPdf, removeLocalPdf, formatBytes,
  type LocalPdfRecord,
} from '../../../../lib/grid-code/local-pdfs';

interface Props {
  doc: StandardDocument;
  clause?: StandardClause;
  page?: number;
  outgoing: AdjacencyEntry[];
  incoming: AdjacencyEntry[];
  clauses: StandardClause[];
  documents: StandardDocument[];
  onBack: () => void;
  onJumpToClause: (clause: StandardClause) => void;
  onJumpToDoc:   (doc: StandardDocument, page?: number, clause?: string) => void;
  onUploadsChanged?: () => void;
}

function buildViewerSrc(fileUrl: string, page?: number, highlight?: string): string {
  const params = new URLSearchParams();
  params.set('file', fileUrl);
  const hashParts: string[] = [];
  if (page && page > 0)        hashParts.push(`page=${page}`);
  if (highlight) {
    hashParts.push(`search=${encodeURIComponent(highlight)}`);
    // PDF.js v5 splits the search term on whitespace by default
    // (viewer.mjs:1253 → query.match(/\S+/g) when phrase!==true), which
    // turns "Type A Protection" into a per-word search and lights up every
    // standalone "A". Force phrase mode for any multi-word term.
    if (/\s/.test(highlight))  hashParts.push('phrase=true');
  }
  const hash = hashParts.length ? `#${hashParts.join('&')}` : '';
  return `/pdfjs/web/viewer/index.html?${params.toString()}${hash}`;
}

const RAIL_COLLAPSED_KEY = 'eee-grid-rail-collapsed-v1';

export default function ViewerSplitPane(props: Props) {
  const { doc, clause, page, outgoing, incoming, clauses, documents } = props;

  // ── Local PDF lookup ───────────────────────────────────────────────────────
  const [localPdf, setLocalPdf] = useState<LocalPdfRecord | null>(null);
  const [localChecked, setLocalChecked] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLocalChecked(false);
    getLocalPdf(doc.id)
      .then(rec => { if (!cancelled) { setLocalPdf(rec); setLocalChecked(true); } })
      .catch(() => { if (!cancelled) { setLocalPdf(null); setLocalChecked(true); } });
    return () => { cancelled = true; };
  }, [doc.id]);

  // Manage Blob URL lifecycle
  useEffect(() => {
    if (!localPdf) { setBlobUrl(null); return; }
    const url = URL.createObjectURL(localPdf.blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [localPdf]);

  // ── Highlight state ────────────────────────────────────────────────────────
  // Default: highlight the current clause ID when one is selected.
  const [highlightSource, setHighlightSource] = useState<HighlightSource>('id');
  const [customHighlight, setCustomHighlight] = useState('');
  // Set by outline tab clicks for auto-extracted entries — overrides the
  // clause-driven page until the user navigates elsewhere.
  const [pageOverride, setPageOverride] = useState<number | null>(null);
  useEffect(() => {
    // Reset to clause-id highlight when the clause changes
    setHighlightSource('id');
    setCustomHighlight('');
    setPageOverride(null);
  }, [clause?.ref, doc.id]);

  const highlightTerm = useMemo(() => {
    if (highlightSource === 'custom') return customHighlight;
    if (highlightSource === 'title')  return clause?.title ?? '';
    return clause?.clauseId ?? '';
  }, [highlightSource, customHighlight, clause?.clauseId, clause?.title]);

  // ── Resolved page ──────────────────────────────────────────────────────────
  // Priority: explicit outline override > locally-indexed clausePages > catalogue pageStart
  const resolvedPage = useMemo<number | undefined>(() => {
    if (pageOverride && pageOverride > 0) return pageOverride;
    const local = clause && localPdf?.clausePages?.[clause.clauseId];
    if (local && local > 0) return local;
    return page;
  }, [pageOverride, clause, localPdf, page]);

  // Auto-extracted outline entries get a `source: 'auto'` marker so the
  // panel can badge them and route clicks through onJumpInDoc.
  const outlineForPanel = useMemo<OutlineEntry[]>(
    () => (localPdf?.outline ?? []).map(o => ({ ...o, source: 'auto' as const })),
    [localPdf?.outline],
  );

  function onJumpInDoc(page: number, highlight: string) {
    setPageOverride(page);
    setHighlightSource('custom');
    setCustomHighlight(highlight);
  }

  // ── Decide what to render in the left pane ─────────────────────────────────
  // Priority: local upload > hostable-eu > iframeable publisher URL > dropzone
  type RenderMode = 'pdfjs' | 'bare-iframe' | 'dropzone';
  const { mode, fileUrl } = useMemo<{ mode: RenderMode; fileUrl: string | null }>(() => {
    if (blobUrl)                              return { mode: 'pdfjs', fileUrl: blobUrl };
    if (doc.license === 'hostable-eu')        return { mode: 'pdfjs', fileUrl: `/eu-codes/${doc.id}.pdf` };
    if (doc.iframeable && doc.pdfUrl)         return { mode: 'bare-iframe', fileUrl: doc.pdfUrl };
    return { mode: 'dropzone', fileUrl: null };
  }, [blobUrl, doc.license, doc.id, doc.iframeable, doc.pdfUrl]);

  const pdfSrc = useMemo(() => {
    if (mode !== 'pdfjs' || !fileUrl) return '';
    return buildViewerSrc(fileUrl, resolvedPage, highlightTerm || undefined);
  }, [mode, fileUrl, resolvedPage, highlightTerm]);

  // ── Resizable split + rail collapse ─────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(58);
  const [railCollapsed, setRailCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(RAIL_COLLAPSED_KEY) === '1';
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RAIL_COLLAPSED_KEY, railCollapsed ? '1' : '0');
  }, [railCollapsed]);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef  = useRef(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.max(25, Math.min(80, pct)));
    }
    function onUp() {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  function startDrag() {
    if (railCollapsed) return; // no drag when rail is hidden
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  function toggleFullscreen() {
    const el = rootRef.current;
    if (!el) return;
    const d = document as Document & { webkitFullscreenElement?: Element };
    const inFs = !!(document.fullscreenElement ?? d.webkitFullscreenElement);
    if (inFs) {
      const exit = document.exitFullscreen?.bind(document)
        ?? (document as Document & { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.bind(document);
      exit?.();
    } else {
      const req = el.requestFullscreen?.bind(el)
        ?? (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(el);
      req?.();
    }
  }

  // ── Pin state ──────────────────────────────────────────────────────────────
  const pinRef = clause?.ref ?? doc.id;
  const pinTitle = clause ? `${doc.title} — ${clause.clauseId} ${clause.title}` : doc.title;
  const [pinned, setPinned] = useState(() => isPinned(pinRef));
  useEffect(() => { setPinned(isPinned(pinRef)); }, [pinRef]);
  function onTogglePin() {
    togglePin({ ref: pinRef, title: pinTitle });
    setPinned(isPinned(pinRef));
  }

  // ── Copy permalink ─────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  function copyPermalink() {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── Local-copy actions ─────────────────────────────────────────────────────
  async function onRemoveLocal() {
    await removeLocalPdf(doc.id);
    setLocalPdf(null);
    props.onUploadsChanged?.();
  }
  function refreshLocal() {
    setLocalChecked(false);
    getLocalPdf(doc.id)
      .then(rec => { setLocalPdf(rec); setLocalChecked(true); })
      .catch(() => { setLocalPdf(null); setLocalChecked(true); });
    props.onUploadsChanged?.();
  }

  const showHighlightBar = mode === 'pdfjs' && (clause || highlightSource === 'custom');
  const gridTemplate = railCollapsed
    ? '1fr 0 0'
    : `${leftPct}fr 6px ${100 - leftPct}fr`;

  return (
    <div className="vsp-root" ref={rootRef}>
      <header className="vsp-bar">
        <button type="button" className="vsp-back" onClick={props.onBack}>← Catalogue</button>
        <nav className="vsp-crumb" aria-label="Breadcrumb">
          <span className="vsp-pub">{doc.publisher}</span>
          <span aria-hidden="true">/</span>
          <span className="vsp-doc">{doc.title}</span>
          {clause && (
            <>
              <span aria-hidden="true">/</span>
              <span className="vsp-clause">{clause.clauseId} — {clause.title}</span>
            </>
          )}
        </nav>
        <div className="vsp-actions">
          {doc.version && <span className="vsp-version">{doc.version}</span>}
          {localPdf && (
            <span className="vsp-local-badge" title={`${localPdf.fileName} · ${formatBytes(localPdf.sizeBytes)} · uploaded ${new Date(localPdf.uploadedAt).toLocaleDateString()}`}>
              local copy
            </span>
          )}
          <button type="button" className="vsp-action" onClick={onTogglePin} title={pinned ? 'Unpin' : 'Pin'}>
            {pinned ? '★ Pinned' : '☆ Pin'}
          </button>
          <button type="button" className="vsp-action" onClick={copyPermalink}>
            {copied ? '✓ Copied' : '¶ Copy link'}
          </button>
          <button
            type="button"
            className="vsp-action"
            onClick={() => setRailCollapsed(c => !c)}
            title={railCollapsed ? 'Show related-clauses panel' : 'Hide related-clauses panel'}
            aria-pressed={railCollapsed}
          >
            {railCollapsed ? '◧ Show panel' : '◨ Hide panel'}
          </button>
          <button
            type="button"
            className="vsp-action"
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
          >
            ⛶ Fullscreen
          </button>
          {doc.pdfUrl && (
            <a className="vsp-action" href={doc.pdfUrl} target="_blank" rel="noreferrer">↗ Publisher</a>
          )}
        </div>
      </header>

      {showHighlightBar && (
        <HighlightControls
          clauseId={clause?.clauseId}
          clauseTitle={clause?.title}
          source={highlightSource}
          custom={customHighlight}
          onChange={(src, custom) => {
            setHighlightSource(src);
            if (src === 'custom') setCustomHighlight(custom);
          }}
        />
      )}

      <div
        className="vsp-split"
        ref={containerRef}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="vsp-pdf">
          {!localChecked ? (
            <div className="vsp-fallback"><p>Checking for local copy…</p></div>
          ) : mode === 'pdfjs' && pdfSrc ? (
            <>
              <iframe
                key={pdfSrc}
                src={pdfSrc}
                title={`${doc.title} PDF viewer`}
                className="vsp-iframe"
              />
              <div className="vsp-pdf-foot">
                {localPdf ? (
                  <>
                    <small>
                      Your local copy · <code>{localPdf.fileName}</code> · {formatBytes(localPdf.sizeBytes)}
                      {localPdf.clausePages && (
                        <> · indexed {Object.keys(localPdf.clausePages).length} clauses</>
                      )}
                    </small>
                    <button type="button" className="vsp-foot-action" onClick={onRemoveLocal}>
                      Remove
                    </button>
                  </>
                ) : (
                  <small>Served from <code>/eu-codes/{doc.id}.pdf</code> · © European Union, re-used under Decision 2011/833/EU</small>
                )}
              </div>
            </>
          ) : mode === 'bare-iframe' && fileUrl ? (
            <>
              <iframe
                key={fileUrl}
                src={fileUrl}
                title={`${doc.title} PDF viewer`}
                className="vsp-iframe"
              />
              <div className="vsp-pdf-foot vsp-pdf-foot--bare">
                <small>
                  Embedded from <code>{new URL(fileUrl).hostname}</code> ·
                  {' '}
                  <button type="button" className="vsp-foot-link" onClick={refreshLocal}>
                    upload a local copy
                  </button>
                  {' '}for clause-level page jumps and highlighting
                </small>
              </div>
            </>
          ) : (
            <UploadDropzone doc={doc} clauses={clauses} onUploaded={refreshLocal} />
          )}
        </div>

        {!railCollapsed && (
          <div
            className="vsp-divider"
            onMouseDown={startDrag}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={leftPct}
            aria-valuemin={25}
            aria-valuemax={80}
          >
            <span aria-hidden="true">⋮</span>
          </div>
        )}

        {!railCollapsed && (
          <aside className="vsp-aside">
            <RelatedClausesPanel
              doc={doc}
              clause={clause}
              outgoing={outgoing}
              incoming={incoming}
              clauses={clauses}
              documents={documents}
              outline={outlineForPanel}
              clausePages={localPdf?.clausePages}
              onJumpToClause={props.onJumpToClause}
              onJumpToDoc={props.onJumpToDoc}
              onJumpInDoc={onJumpInDoc}
            />
          </aside>
        )}
      </div>

      <style>{`
        .vsp-root { display: flex; flex-direction: column; height: calc(100vh - 120px); min-height: 560px; }
        .vsp-root:fullscreen { height: 100vh; background: var(--color-bg); padding: 0; }
        .vsp-bar {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.45rem 0.6rem;
          background: var(--color-bg-grid);
          border: 1px solid var(--color-border);
          border-bottom: none;
          font-family: var(--font-mono); font-size: 0.74rem;
          flex-wrap: wrap;
        }
        .vsp-back {
          background: var(--color-bg); border: 1px solid var(--color-border);
          padding: 0.2rem 0.55rem; cursor: pointer; color: var(--color-text);
          font-family: var(--font-mono); font-size: 0.72rem;
          border-radius: 2px;
        }
        .vsp-back:hover { border-color: var(--color-copper); color: var(--color-copper); }
        .vsp-crumb { display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; flex: 1; min-width: 0; }
        .vsp-pub    { color: var(--color-text-muted); }
        .vsp-doc    { color: var(--color-text); font-weight: 600; }
        .vsp-clause { color: var(--color-copper); }
        .vsp-actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
        .vsp-version {
          font-size: 0.65rem; padding: 0.1rem 0.4rem;
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: 2px; color: var(--color-text-muted);
        }
        .vsp-local-badge {
          font-size: 0.62rem;
          padding: 0.1rem 0.4rem;
          background: rgb(34 197 94 / 14%);
          color: #16a34a;
          border: 1px solid rgb(34 197 94 / 45%);
          border-radius: 2px;
          font-family: var(--font-mono);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .vsp-action {
          background: var(--color-bg); border: 1px solid var(--color-border);
          padding: 0.2rem 0.5rem; cursor: pointer; color: var(--color-text);
          font-family: var(--font-mono); font-size: 0.7rem;
          text-decoration: none;
          border-radius: 2px;
        }
        .vsp-action:hover { border-color: var(--color-copper); color: var(--color-copper); }
        .vsp-action[aria-pressed="true"] {
          background: var(--color-copper); color: white; border-color: var(--color-copper);
        }

        .vsp-split {
          display: grid;
          flex: 1;
          min-height: 0;
          border: 1px solid var(--color-border);
        }
        .vsp-pdf {
          display: flex; flex-direction: column;
          min-width: 0; min-height: 0;
          background: var(--color-bg);
        }
        .vsp-iframe {
          flex: 1;
          width: 100%; height: 100%;
          border: 0;
          background: white;
        }
        .vsp-fallback {
          padding: 2rem;
          display: flex; flex-direction: column; gap: 0.6rem;
          align-items: center; justify-content: center;
          text-align: center; height: 100%;
        }
        .vsp-pdf-foot {
          padding: 0.25rem 0.5rem;
          border-top: 1px dashed var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-mono); font-size: 0.65rem;
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.5rem;
        }
        .vsp-pdf-foot code {
          font-family: var(--font-mono); font-size: 0.65rem;
          color: var(--color-text);
        }
        .vsp-pdf-foot--bare {
          background: rgb(245 158 11 / 8%);
          border-top: 1px dashed rgb(245 158 11 / 35%);
        }
        .vsp-foot-action {
          background: none; border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-mono); font-size: 0.62rem;
          padding: 0.1rem 0.4rem; cursor: pointer; border-radius: 2px;
        }
        .vsp-foot-action:hover { border-color: #ef4444; color: #ef4444; }
        .vsp-foot-link {
          background: none; border: none; padding: 0;
          color: var(--color-copper); cursor: pointer;
          font-family: var(--font-mono); font-size: 0.65rem;
          text-decoration: underline;
        }
        .vsp-foot-link:hover { color: var(--color-copper-light); }
        .vsp-divider {
          background: var(--color-bg-grid);
          border-left: 1px solid var(--color-border);
          border-right: 1px solid var(--color-border);
          cursor: col-resize;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text-muted);
          font-size: 0.7rem;
          user-select: none;
        }
        .vsp-divider:hover { background: var(--color-copper); color: white; }
        .vsp-aside {
          min-width: 0; min-height: 0;
          overflow-y: auto;
          background: var(--color-bg);
        }

        @media (max-width: 900px) {
          .vsp-split {
            grid-template-columns: 1fr !important;
            grid-template-rows: 60vh auto auto;
          }
          .vsp-divider { display: none; }
        }
      `}</style>
    </div>
  );
}
