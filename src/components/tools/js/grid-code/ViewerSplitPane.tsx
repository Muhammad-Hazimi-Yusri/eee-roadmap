// Split-pane viewer: PDF (LEFT) + related-clauses panel (RIGHT).
//
// LEFT pane sources, in order of preference:
//   1. User-uploaded local copy (IndexedDB Blob)        — works for any doc
//   2. /eu-codes/<id>.pdf (hostable-eu, same-origin)    — works for EU NCs
//   3. UploadDropzone (link-only / paywalled / no URL)  — user provides own copy
//
// The PDF is rendered through the existing /pdfjs/web/viewer.html iframe
// (same pattern as src/utils/parseNotes.ts). For user-uploaded copies we
// pass a blob: URL via the ?file param.

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  StandardDocument, StandardClause, AdjacencyEntry,
} from '../../../../lib/grid-code/types';
import RelatedClausesPanel from './RelatedClausesPanel';
import UploadDropzone from './UploadDropzone';
import { isPinned, togglePin } from '../../../../lib/grid-code/pinned';
import {
  getLocalPdf, removeLocalPdf, formatBytes,
  type LocalPdfRecord,
} from '../../../../lib/grid-code/local-pdfs';

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
  onUploadsChanged?: () => void;
}

function buildViewerSrc(fileUrl: string, page?: number, query?: string): string {
  const params = new URLSearchParams();
  params.set('file', fileUrl);
  const hashParts: string[] = [];
  if (page && page > 0) hashParts.push(`page=${page}`);
  if (query)            hashParts.push(`search=${encodeURIComponent(query)}`);
  const hash = hashParts.length ? `#${hashParts.join('&')}` : '';
  return `/pdfjs/web/viewer/index.html?${params.toString()}${hash}`;
}

export default function ViewerSplitPane(props: Props) {
  const { doc, clause, page, query, outgoing, incoming, clauses, documents } = props;

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

  // ── Decide what to render in the left pane ─────────────────────────────────
  // Priority: local upload > hostable-eu > dropzone fallback
  const pdfFileUrl = useMemo<string | null>(() => {
    if (blobUrl) return blobUrl;
    if (doc.license === 'hostable-eu') return `/eu-codes/${doc.id}.pdf`;
    return null;
  }, [blobUrl, doc.license, doc.id]);

  const pdfSrc = useMemo(
    () => pdfFileUrl ? buildViewerSrc(pdfFileUrl, page, query) : '',
    [pdfFileUrl, page, query],
  );

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
          {!localChecked ? (
            <div className="vsp-fallback"><p>Checking for local copy…</p></div>
          ) : pdfSrc ? (
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
          ) : (
            <UploadDropzone doc={doc} onUploaded={refreshLocal} />
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
        .vsp-foot-action {
          background: none; border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-family: var(--font-mono); font-size: 0.62rem;
          padding: 0.1rem 0.4rem; cursor: pointer; border-radius: 2px;
        }
        .vsp-foot-action:hover { border-color: #ef4444; color: #ef4444; }
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
