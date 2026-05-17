// Split-pane viewer: PDF (LEFT) + related-clauses panel (RIGHT).
// PDF is rendered via the existing /pdfjs/web/viewer.html iframe — same
// pattern as src/utils/parseNotes.ts.

import { useMemo, useRef, useState, useEffect } from 'react';
import type {
  StandardDocument, StandardClause, AdjacencyEntry,
} from '../../../../lib/grid-code/types';
import RelatedClausesPanel from './RelatedClausesPanel';
import { isPinned, togglePin } from '../../../../lib/grid-code/pinned';

interface Props {
  doc: StandardDocument;
  clause?: StandardClause;
  page?: number;
  query?: string;
  outgoing: AdjacencyEntry[];
  incoming: AdjacencyEntry[];
  clauses: StandardClause[];
  documents: StandardDocument[];
  onBack: () => void;
  onJumpToClause: (clause: StandardClause) => void;
  onJumpToDoc:   (doc: StandardDocument, page?: number, clause?: string) => void;
}

function buildPdfSrc(doc: StandardDocument, page?: number, query?: string): string {
  // Prefer the local copy for EU-hostable docs; deep-link out for link-only and paywalled.
  let fileUrl: string;
  if (doc.license === 'hostable-eu') {
    fileUrl = `/eu-codes/${doc.id}.pdf`;
  } else if (doc.pdfUrl) {
    fileUrl = doc.pdfUrl;
  } else {
    return '';
  }
  const params = new URLSearchParams();
  params.set('file', fileUrl);
  const hashParts: string[] = [];
  if (page && page > 0) hashParts.push(`page=${page}`);
  if (query)            hashParts.push(`search=${encodeURIComponent(query)}`);
  const hash = hashParts.length ? `#${hashParts.join('&')}` : '';
  return `/pdfjs/web/viewer.html?${params.toString()}${hash}`;
}

export default function ViewerSplitPane(props: Props) {
  const { doc, clause, page, query, outgoing, incoming, clauses, documents } = props;

  const pdfSrc = useMemo(() => buildPdfSrc(doc, page, query), [doc, page, query]);
  const hasInAppPdf = pdfSrc !== '' && (doc.license === 'hostable-eu' || doc.pdfUrl);
  const showFallback = !hasInAppPdf;

  // ── Resizable split ─────────────────────────────────────────────────────────
  const [leftPct, setLeftPct] = useState(58);
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
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  // ── Pin state ──────────────────────────────────────────────────────────────
  const pinRef = clause?.ref ?? doc.id;
  const pinTitle = clause ? `${doc.title} — ${clause.clauseId} ${clause.title}` : doc.title;
  const [pinned, setPinned] = useState(() => isPinned(pinRef));
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

  return (
    <div className="vsp-root">
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
          <button type="button" className="vsp-action" onClick={onTogglePin} title={pinned ? 'Unpin' : 'Pin'}>
            {pinned ? '★ Pinned' : '☆ Pin'}
          </button>
          <button type="button" className="vsp-action" onClick={copyPermalink}>
            {copied ? '✓ Copied' : '¶ Copy link'}
          </button>
          {doc.pdfUrl && (
            <a className="vsp-action" href={doc.pdfUrl} target="_blank" rel="noreferrer">↗ Publisher</a>
          )}
        </div>
      </header>

      <div
        className="vsp-split"
        ref={containerRef}
        style={{ gridTemplateColumns: `${leftPct}fr 6px ${100 - leftPct}fr` }}
      >
        <div className="vsp-pdf">
          {hasInAppPdf ? (
            <iframe
              key={pdfSrc}
              src={pdfSrc}
              title={`${doc.title} PDF viewer`}
              className="vsp-iframe"
            />
          ) : (
            <div className="vsp-fallback">
              <h3>No in-app preview available</h3>
              {doc.license === 'paywalled' ? (
                <>
                  <p>This standard is paywalled — purchase from the publisher and view your own copy locally.</p>
                  <p><a href={doc.landingUrl ?? doc.pdfUrl} target="_blank" rel="noreferrer">Open publisher page →</a></p>
                </>
              ) : (
                <>
                  <p>This document doesn't have a direct PDF link in the catalogue.</p>
                  {doc.landingUrl && <p><a href={doc.landingUrl} target="_blank" rel="noreferrer">Open publisher landing page →</a></p>}
                </>
              )}
            </div>
          )}
          {showFallback ? null : (
            <div className="vsp-pdf-foot">
              <small>Hosted by publisher — content © its rights-holder.</small>
            </div>
          )}
        </div>

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

        <aside className="vsp-aside">
          <RelatedClausesPanel
            doc={doc}
            clause={clause}
            outgoing={outgoing}
            incoming={incoming}
            clauses={clauses}
            documents={documents}
            onJumpToClause={props.onJumpToClause}
            onJumpToDoc={props.onJumpToDoc}
          />
        </aside>
      </div>

      <style>{`
        .vsp-root { display: flex; flex-direction: column; height: calc(100vh - 200px); min-height: 520px; }
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
        .vsp-action {
          background: var(--color-bg); border: 1px solid var(--color-border);
          padding: 0.2rem 0.5rem; cursor: pointer; color: var(--color-text);
          font-family: var(--font-mono); font-size: 0.7rem;
          text-decoration: none;
          border-radius: 2px;
        }
        .vsp-action:hover { border-color: var(--color-copper); color: var(--color-copper); }

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
        .vsp-fallback h3 {
          font-family: var(--font-mono); font-size: 0.85rem;
          margin: 0;
        }
        .vsp-pdf-foot {
          padding: 0.25rem 0.5rem;
          border-top: 1px dashed var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-mono); font-size: 0.65rem;
        }
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
