// src/components/tools/js/GridCodeViewer.tsx
// Grid Code & Standards Viewer — main React island.
//
// Renders the faceted catalogue browser and, when a document is selected,
// the split-pane viewer (PDF on the left, related clauses on the right).
// State is URL-driven (URLSearchParams) so any view is a shareable permalink.

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { StandardsPayload, ViewerState, FacetState, StandardDocument, StandardClause } from '../../../lib/grid-code/types';
import { readState, writeState } from '../../../lib/grid-code/url-state';
import FacetRail from './grid-code/FacetRail';
import CatalogueList from './grid-code/CatalogueList';
import ViewerSplitPane from './grid-code/ViewerSplitPane';
import SearchPalette from './grid-code/SearchPalette';
import PinnedRail from './grid-code/PinnedRail';
import LocalCopiesRail from './grid-code/LocalCopiesRail';

export default function GridCodeViewer() {
  const [data, setData]     = useState<StandardsPayload | null>(null);
  const [loadError, setErr] = useState<string | null>(null);
  const [state, setState]   = useState<ViewerState>(() =>
    typeof window === 'undefined' ? { view: 'list' } : readState()
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [uploadsKey, setUploadsKey]   = useState(0);

  // Load standards payload once on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/data/standards.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((payload: StandardsPayload) => {
        if (!cancelled) setData(payload);
      })
      .catch(err => {
        if (!cancelled) setErr(err.message);
      });
    return () => { cancelled = true; };
  }, []);

  // Sync state to URL on every change
  useEffect(() => {
    writeState(state);
  }, [state]);

  // Back/forward navigation: react to history changes
  useEffect(() => {
    function onPop() { setState(readState()); }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ⌘K / Ctrl+K to open the search palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setFacets = useCallback((facets: FacetState | undefined) => {
    setState(s => ({ ...s, facets }));
  }, []);

  const openDocument = useCallback((doc: StandardDocument, page?: number, clause?: string) => {
    setState(s => ({ ...s, doc: doc.id, page, clause, view: 'viewer' }));
  }, []);

  const openClause = useCallback((clause: StandardClause) => {
    setState(s => ({
      ...s,
      doc:    clause.docId,
      clause: clause.clauseId,
      page:   clause.pageStart && clause.pageStart > 0 ? clause.pageStart : undefined,
      view:   'viewer',
    }));
  }, []);

  const backToList = useCallback(() => {
    setState(s => ({ ...s, view: 'list', doc: undefined, clause: undefined, page: undefined }));
  }, []);

  // Resolve the currently-viewed document and clause
  const currentDoc = useMemo<StandardDocument | undefined>(() => {
    if (!data || !state.doc) return undefined;
    return data.documents.find(d => d.id === state.doc);
  }, [data, state.doc]);

  const currentClause = useMemo<StandardClause | undefined>(() => {
    if (!data || !state.doc || !state.clause) return undefined;
    const direct = data.clauses.find(c => c.docId === state.doc && c.clauseId === state.clause);
    if (direct) return direct;
    const byRef  = data.clauses.find(c => c.ref === `${state.doc}/${state.clause}`);
    return byRef;
  }, [data, state.doc, state.clause]);

  // Filter the catalogue by active facets + query
  const filteredDocuments = useMemo<StandardDocument[]>(() => {
    if (!data) return [];
    const f = state.facets;
    const q = state.q?.toLowerCase().trim();
    return data.documents.filter(d => {
      if (f?.publisher    && f.publisher.length    && !f.publisher.includes(d.publisher))   return false;
      if (f?.license      && f.license.length      && !f.license.includes(d.license))       return false;
      if (f?.jurisdiction && f.jurisdiction.length && d.jurisdiction && !f.jurisdiction.includes(d.jurisdiction)) return false;
      if (f?.projectTypes && f.projectTypes.length) {
        const have = new Set(d.projectTypes ?? []);
        if (!f.projectTypes.some(pt => have.has(pt))) return false;
      }
      if (f?.studyTypes && f.studyTypes.length) {
        const have = new Set(d.studyTypes ?? []);
        if (!f.studyTypes.some(st => have.has(st))) return false;
      }
      if (q) {
        const hay = `${d.title} ${d.publisher} ${d.summary ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, state.facets, state.q]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="gcv-error" role="alert">
        Failed to load standards catalogue: {loadError}
        <br />
        <small>Run <code>npm run build:data</code> to generate <code>public/data/standards.json</code>.</small>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="gcv-loading" aria-busy="true">Loading standards catalogue…</div>
    );
  }

  return (
    <div className="gcv-root">
      <div className="gcv-layout">

        <aside className="gcv-rail">
          <FacetRail
            documents={data.documents}
            facets={state.facets ?? {}}
            onChange={setFacets}
            resultCount={filteredDocuments.length}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <PinnedRail
            clauseLookup={data.clauses}
            docLookup={data.documents}
            onOpenClause={openClause}
          />
          <LocalCopiesRail
            documents={data.documents}
            onOpenDoc={d => openDocument(d)}
            invalidationKey={uploadsKey}
          />
        </aside>

        <main className="gcv-main">
          {state.view === 'viewer' && currentDoc ? (
            <ViewerSplitPane
              doc={currentDoc}
              clause={currentClause}
              page={state.page}
              query={state.q}
              outgoing={data.outgoing[currentClause?.ref ?? currentDoc.id] ?? []}
              incoming={data.incoming[currentClause?.ref ?? currentDoc.id] ?? []}
              clauses={data.clauses}
              documents={data.documents}
              onBack={backToList}
              onJumpToClause={openClause}
              onJumpToDoc={openDocument}
              onUploadsChanged={() => setUploadsKey(k => k + 1)}
            />
          ) : (
            <CatalogueList
              documents={filteredDocuments}
              totalCount={data.documents.length}
              onOpen={openDocument}
            />
          )}
        </main>
      </div>

      {paletteOpen && (
        <SearchPalette
          documents={data.documents}
          clauses={data.clauses}
          onClose={() => setPaletteOpen(false)}
          onPickDoc={(d) => { setPaletteOpen(false); openDocument(d); }}
          onPickClause={(c) => { setPaletteOpen(false); openClause(c); }}
        />
      )}

      <style>{`
        .gcv-root { min-height: 70vh; font-family: var(--font-body); }
        .gcv-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1rem;
          align-items: flex-start;
        }
        .gcv-rail {
          position: sticky;
          top: 1rem;
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
          padding: 0.75rem;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          border-radius: 4px;
        }
        .gcv-main { min-width: 0; }
        .gcv-loading, .gcv-error {
          padding: 2rem;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--color-text-muted);
          text-align: center;
        }
        .gcv-error { color: #ef4444; }
        .gcv-error code {
          background: var(--color-bg-grid);
          padding: 0.1rem 0.3rem;
          border-radius: 2px;
        }
        @media (max-width: 900px) {
          .gcv-layout { grid-template-columns: 1fr; }
          .gcv-rail { position: static; max-height: none; }
        }
      `}</style>
    </div>
  );
}
