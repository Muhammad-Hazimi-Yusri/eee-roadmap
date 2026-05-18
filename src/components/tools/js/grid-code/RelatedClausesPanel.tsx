// Right-pane "Related clauses" panel — peek view for the current
// document or clause. Four tabs: Related (xrefs), Outline (full ToC),
// Forms (submission artefacts), Plain-English summary.

import { useMemo, useState } from 'react';
import type {
  StandardDocument, StandardClause, AdjacencyEntry, XrefRelation, OutlineEntry,
} from '../../../../lib/grid-code/types';

interface Props {
  doc: StandardDocument;
  clause?: StandardClause;
  outgoing: AdjacencyEntry[];
  incoming: AdjacencyEntry[];
  clauses: StandardClause[];
  documents: StandardDocument[];
  // Auto-extracted heading outline from the local PDF, if available.
  // Empty / undefined when no local copy is uploaded yet.
  outline?: OutlineEntry[];
  // Per-clauseId page hits from the local PDF's auto-indexer, used to
  // give curated outline entries their real page numbers (the YAML
  // `pageStart` is unpopulated for most entries).
  clausePages?: Record<string, number>;
  onJumpToClause: (clause: StandardClause) => void;
  onJumpToDoc:    (doc: StandardDocument) => void;
  // Used for auto-extracted outline entries that don't have a curated
  // _clauses.yaml ref. Triggers a page+highlight change without altering
  // URL state.
  onJumpInDoc?: (page: number, highlight: string) => void;
}

const RELATION_LABEL: Record<XrefRelation, string> = {
  'defined-in':   'defined in',
  'defines':      'defines',
  'modified-by':  'modified by',
  'see-also':     'see also',
  'tested-by':    'tested by',
  'evidenced-by': 'evidenced by',
  'mirrors':      'mirrors',
  'commercial':   'commercial framework',
};

export default function RelatedClausesPanel({
  doc, clause, outgoing, incoming, clauses, documents, outline, clausePages,
  onJumpToClause, onJumpToDoc, onJumpInDoc,
}: Props) {
  const [tab, setTab] = useState<'related' | 'outline' | 'forms' | 'notes'>('related');
  const [outlineQuery, setOutlineQuery] = useState('');

  const docById    = useMemo(() => new Map(documents.map(d => [d.id, d])), [documents]);
  const clauseByRef = useMemo(() => new Map(clauses.map(c => [c.ref, c])), [clauses]);

  function resolveTarget(ref: string): { kind: 'clause'; clause: StandardClause } | { kind: 'doc'; doc: StandardDocument } | null {
    const c = clauseByRef.get(ref);
    if (c) return { kind: 'clause', clause: c };
    const d = docById.get(ref);
    if (d) return { kind: 'doc', doc: d };
    return null;
  }

  function onClickEdge(ref: string) {
    const t = resolveTarget(ref);
    if (!t) return;
    if (t.kind === 'clause') onJumpToClause(t.clause);
    else onJumpToDoc(t.doc);
  }

  // Combine outgoing and incoming for display; show relation direction in label
  const edges = useMemo(() => {
    const items: { ref: string; relation: XrefRelation; note?: string; direction: 'out' | 'in' }[] = [];
    for (const e of outgoing) if (e.to)   items.push({ ref: e.to,   relation: e.relation, note: e.note, direction: 'out' });
    for (const e of incoming) if (e.from) items.push({ ref: e.from, relation: e.relation, note: e.note, direction: 'in'  });
    return items;
  }, [outgoing, incoming]);

  const forms = clause?.forms ?? [];
  const summary = clause?.summary ?? doc.summary ?? '';
  const docClauses = useMemo(() => clauses.filter(c => c.docId === doc.id), [clauses, doc.id]);

  // Combined outline: curated _clauses.yaml entries + auto-extracted ones,
  // deduped by id, sorted in document order (page ascending). Curated
  // entries take their page from the local indexer's clausePages map
  // when available — the YAML pageStart is 0 for most clauses, so without
  // this merge the list would clump unindexed entries at page 0.
  const combinedOutline = useMemo<OutlineEntry[]>(() => {
    const seen = new Set<string>();
    const out: OutlineEntry[] = [];
    for (const c of docClauses) {
      seen.add(c.clauseId);
      const page = clausePages?.[c.clauseId] || c.pageStart || 0;
      out.push({ id: c.clauseId, title: c.title, page, source: 'curated' });
    }
    for (const o of outline ?? []) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      // Preserve the extractor tier — old records without a source get 'auto'.
      out.push({ id: o.id, title: o.title, page: o.page, source: o.source ?? 'auto' });
    }
    // Sort by page (unknown=0 sinks to the bottom), then by id using
    // numeric collation so 13.2 sorts before 13.10.
    return out.sort((a, b) => {
      const ap = a.page > 0 ? a.page : Number.POSITIVE_INFINITY;
      const bp = b.page > 0 ? b.page : Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
  }, [docClauses, outline, clausePages]);

  const filteredOutline = useMemo<OutlineEntry[]>(() => {
    const q = outlineQuery.trim().toLowerCase();
    if (!q) return combinedOutline;
    return combinedOutline.filter(o =>
      o.id.toLowerCase().includes(q) || o.title.toLowerCase().includes(q),
    );
  }, [combinedOutline, outlineQuery]);

  function onOutlineClick(o: OutlineEntry) {
    // Curated entries route through onJumpToClause so URL state stays in
    // sync. Auto entries route through onJumpInDoc which just sets the
    // viewer's page + highlight without touching the URL.
    if (o.source === 'curated') {
      const c = clauses.find(x => x.docId === doc.id && x.clauseId === o.id);
      if (c) { onJumpToClause(c); return; }
    }
    onJumpInDoc?.(o.page, o.id);
  }

  return (
    <div className="rcp-root">
      <div className="rcp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'related'} className={tab === 'related' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('related')}>
          Related <span className="rcp-tab-count">{edges.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'outline'} className={tab === 'outline' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('outline')}>
          Outline <span className="rcp-tab-count">{combinedOutline.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'forms'} className={tab === 'forms' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('forms')}>
          Forms <span className="rcp-tab-count">{forms.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'notes'} className={tab === 'notes' ? 'rcp-tab rcp-tab--active' : 'rcp-tab'} onClick={() => setTab('notes')}>
          Notes
        </button>
      </div>

      <div className="rcp-body">
        {tab === 'related' && (
          edges.length === 0 ? (
            <p className="rcp-empty">
              {clause
                ? 'No cross-references recorded for this clause yet.'
                : 'Open a specific clause to see related references — for now, here are the indexed clauses in this document:'}
            </p>
          ) : (
            <ul className="rcp-list">
              {edges.map((e, i) => {
                const target = resolveTarget(e.ref);
                if (!target) return null;
                const label = target.kind === 'clause' ? `${target.clause.clauseId} — ${target.clause.title}` : target.doc.title;
                const sub = target.kind === 'clause' ? docById.get(target.clause.docId)?.title : target.doc.publisher;
                return (
                  <li key={`${e.ref}-${i}`}>
                    <button type="button" className="rcp-edge" onClick={() => onClickEdge(e.ref)}>
                      <div className="rcp-edge-rel">
                        <span className={`rcp-rel rcp-rel--${e.direction}`}>{RELATION_LABEL[e.relation]}</span>
                        <span className="rcp-rel-dir">{e.direction === 'out' ? '→' : '←'}</span>
                      </div>
                      <div className="rcp-edge-title">{label}</div>
                      <div className="rcp-edge-sub">{sub}</div>
                      {e.note && <div className="rcp-edge-note">{e.note}</div>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        )}

        {tab === 'related' && edges.length === 0 && !clause && docClauses.length > 0 && (
          <ul className="rcp-list rcp-list--clauses">
            {docClauses.map(c => (
              <li key={c.ref}>
                <button type="button" className="rcp-edge" onClick={() => onJumpToClause(c)}>
                  <div className="rcp-edge-title"><code>{c.clauseId}</code>  {c.title}</div>
                  {c.summary && <div className="rcp-edge-note">{c.summary}</div>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === 'outline' && (
          <div className="rcp-outline">
            <input
              type="search"
              className="rcp-outline-search"
              placeholder="Filter outline (id or title)…"
              value={outlineQuery}
              onChange={e => setOutlineQuery(e.target.value)}
              aria-label="Filter outline"
            />
            <p className="rcp-outline-hint">
              Press <kbd>Ctrl</kbd>+<kbd>F</kbd> inside the PDF for full-text search.
            </p>
            {combinedOutline.length === 0 ? (
              <p className="rcp-empty">
                No outline yet. Upload a local copy to build one automatically.
              </p>
            ) : filteredOutline.length === 0 ? (
              <p className="rcp-empty">No matches for &quot;{outlineQuery}&quot;.</p>
            ) : (
              <ul className="rcp-list rcp-list--outline">
                {filteredOutline.map(o => (
                  <li key={`${o.source}-${o.id}`}>
                    <button type="button" className="rcp-edge" onClick={() => onOutlineClick(o)}>
                      <div className="rcp-edge-title">
                        <code>{o.id}</code>  {o.title}
                        {o.source !== 'curated' && (
                          <span className={`rcp-outline-badge rcp-outline-badge--${o.source}`}>
                            {o.source}
                          </span>
                        )}
                      </div>
                      {o.page > 0 && <div className="rcp-edge-sub">page {o.page}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'forms' && (
          forms.length === 0 ? (
            <p className="rcp-empty">No linked submission artefacts for this {clause ? 'clause' : 'document'}.</p>
          ) : (
            <ul className="rcp-forms">
              {forms.map(f => <li key={f}><code>{f}</code></li>)}
            </ul>
          )
        )}

        {tab === 'notes' && (
          summary ? (
            <div className="rcp-summary"><p>{summary}</p></div>
          ) : (
            <p className="rcp-empty">No plain-English summary yet.</p>
          )
        )}
      </div>

      <style>{`
        .rcp-root { display: flex; flex-direction: column; height: 100%; }
        .rcp-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg-grid);
        }
        .rcp-tab {
          flex: 1;
          padding: 0.5rem 0.7rem;
          background: transparent;
          border: none;
          font-family: var(--font-mono); font-size: 0.7rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .rcp-tab--active {
          color: var(--color-text);
          border-bottom-color: var(--color-copper);
          background: var(--color-bg);
        }
        .rcp-tab-count {
          display: inline-block;
          margin-left: 0.3rem;
          padding: 0 0.3rem;
          font-size: 0.65rem;
          background: var(--color-bg);
          border-radius: 2px;
          color: var(--color-text-muted);
        }
        .rcp-tab--active .rcp-tab-count {
          background: var(--color-copper);
          color: white;
        }
        .rcp-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 0.5rem;
        }
        .rcp-empty {
          font-size: 0.78rem;
          color: var(--color-text-muted);
          font-style: italic;
          margin: 0.5rem 0;
          padding: 0.5rem;
        }
        .rcp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.3rem; }
        .rcp-edge {
          display: block;
          width: 100%; text-align: left;
          padding: 0.45rem 0.55rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          cursor: pointer;
          font-family: inherit;
          border-radius: 3px;
        }
        .rcp-edge:hover { border-color: var(--color-copper); }
        .rcp-edge-rel {
          display: flex; align-items: center; gap: 0.3rem;
          font-family: var(--font-mono); font-size: 0.62rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--color-text-muted);
          margin-bottom: 0.2rem;
        }
        .rcp-rel {
          padding: 0.05rem 0.35rem;
          background: var(--color-bg-grid);
          border-radius: 2px;
        }
        .rcp-rel--out { background: rgb(184 115 51 / 12%); color: var(--color-copper); }
        .rcp-rel--in  { background: rgb(45 80 22 / 12%);  color: var(--color-pcb); }
        .rcp-rel-dir { color: var(--color-text-muted); }
        .rcp-edge-title { font-size: 0.8rem; font-weight: 600; }
        .rcp-edge-title code {
          font-family: var(--font-mono); font-size: 0.78rem;
          color: var(--color-copper); margin-right: 0.4rem;
        }
        .rcp-edge-sub {
          font-size: 0.7rem; color: var(--color-text-muted);
          margin-top: 0.1rem;
        }
        .rcp-edge-note {
          font-size: 0.7rem; color: var(--color-text-muted);
          margin-top: 0.25rem;
          line-height: 1.4;
          font-style: italic;
        }
        .rcp-forms {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.3rem;
        }
        .rcp-forms li {
          padding: 0.3rem 0.5rem;
          background: var(--color-bg-grid);
          border: 1px solid var(--color-border);
          border-radius: 2px;
        }
        .rcp-forms code { font-family: var(--font-mono); font-size: 0.78rem; }
        .rcp-summary {
          font-size: 0.85rem; line-height: 1.55;
          color: var(--color-text);
        }
        .rcp-summary p { margin: 0.5rem 0; }
        .rcp-outline { display: flex; flex-direction: column; gap: 0.4rem; }
        .rcp-outline-search {
          background: var(--color-bg-grid); border: 1px solid var(--color-border);
          color: var(--color-text); font-family: var(--font-mono); font-size: 0.78rem;
          padding: 0.35rem 0.55rem; border-radius: 2px;
          width: 100%;
        }
        .rcp-outline-search:focus { outline: none; border-color: var(--color-copper); }
        .rcp-outline-hint {
          margin: 0; font-size: 0.68rem; color: var(--color-text-muted);
          font-family: var(--font-mono);
        }
        .rcp-outline-hint kbd {
          font-family: var(--font-mono); font-size: 0.65rem;
          padding: 0.05rem 0.3rem;
          background: var(--color-bg-grid);
          border: 1px solid var(--color-border);
          border-radius: 2px;
        }
        .rcp-list--outline { gap: 0.2rem; }
        .rcp-outline-badge {
          font-family: var(--font-mono); font-size: 0.58rem;
          margin-left: 0.4rem;
          padding: 0 0.3rem;
          border: 1px solid var(--color-border);
          text-transform: uppercase; letter-spacing: 0.05em;
          border-radius: 2px;
        }
        /* Embedded /Outlines tree — the cleanest source. */
        .rcp-outline-badge--outline {
          background: rgb(34 197 94 / 14%);
          border-color: rgb(34 197 94 / 45%);
          color: #16a34a;
        }
        /* ToC page parse — also high-precision. */
        .rcp-outline-badge--toc {
          background: rgb(59 130 246 / 14%);
          border-color: rgb(59 130 246 / 45%);
          color: #2563eb;
        }
        /* Heading-line heuristic — last resort, may include false positives. */
        .rcp-outline-badge--auto {
          background: var(--color-bg-grid);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
