// HighlightControls — segmented control above the PDF viewer that switches
// which term is highlighted inside the iframe.
//
// The catalogue's left-rail search bar (state.q) used to flow into the iframe
// search term, which created a footgun: filtering the list for "BESS" and
// then clicking a clause left "BESS" highlighted in the PDF. Highlight is
// now driven solely by the user's choice here.

import { useEffect, useRef, useState } from 'react';
import type { HighlightSource } from '../../../../lib/grid-code/types';

interface Props {
  clauseId?: string;
  clauseTitle?: string;
  source: HighlightSource;
  custom: string;
  onChange: (source: HighlightSource, custom: string) => void;
}

export default function HighlightControls({
  clauseId, clauseTitle, source, custom, onChange,
}: Props) {
  const [draft, setDraft] = useState(custom);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the local draft synced if the parent resets it
  useEffect(() => { setDraft(custom); }, [custom]);

  function pickId() {
    if (!clauseId) return;
    onChange('id', '');
  }
  function pickTitle() {
    if (!clauseTitle) return;
    onChange('title', '');
  }
  function pickCustom() {
    onChange('custom', draft);
    requestAnimationFrame(() => inputRef.current?.focus());
  }
  function commitCustom(e: React.FormEvent) {
    e.preventDefault();
    onChange('custom', draft.trim());
  }

  const idDisabled    = !clauseId;
  const titleDisabled = !clauseTitle;

  return (
    <div className="hc-root" role="group" aria-label="Highlight in PDF">
      <span className="hc-label">Highlight:</span>
      <button
        type="button"
        className={`hc-btn ${source === 'id' ? 'hc-btn--active' : ''}`}
        disabled={idDisabled}
        onClick={pickId}
        title={clauseId ? `Highlight clause ID "${clauseId}"` : 'No clause selected'}
      >
        {clauseId ?? 'Clause ID'}
      </button>
      <button
        type="button"
        className={`hc-btn ${source === 'title' ? 'hc-btn--active' : ''}`}
        disabled={titleDisabled}
        onClick={pickTitle}
        title={clauseTitle ? `Highlight clause title "${clauseTitle}"` : 'No clause selected'}
      >
        {clauseTitle ? truncate(clauseTitle, 28) : 'Title'}
      </button>
      <button
        type="button"
        className={`hc-btn ${source === 'custom' ? 'hc-btn--active' : ''}`}
        onClick={pickCustom}
        title="Highlight a custom term"
      >
        Custom…
      </button>
      {source === 'custom' && (
        <form className="hc-custom" onSubmit={commitCustom}>
          <input
            ref={inputRef}
            className="hc-input"
            type="text"
            value={draft}
            placeholder="e.g. FFCI"
            onChange={e => setDraft(e.target.value)}
            aria-label="Custom highlight term"
          />
          <button type="submit" className="hc-go">↵</button>
        </form>
      )}
      <style>{`
        .hc-root {
          display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
          padding: 0.35rem 0.6rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-top: none;
          font-family: var(--font-mono); font-size: 0.72rem;
        }
        .hc-label { color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.62rem; }
        .hc-btn {
          background: var(--color-bg-grid); border: 1px solid var(--color-border);
          color: var(--color-text); cursor: pointer;
          font-family: var(--font-mono); font-size: 0.7rem;
          padding: 0.15rem 0.5rem; border-radius: 2px;
        }
        .hc-btn:hover:not(:disabled) { border-color: var(--color-copper); color: var(--color-copper); }
        .hc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .hc-btn--active {
          background: var(--color-copper);
          color: white;
          border-color: var(--color-copper);
        }
        .hc-custom { display: inline-flex; gap: 0.25rem; }
        .hc-input {
          background: var(--color-bg-grid); border: 1px solid var(--color-border);
          color: var(--color-text); font-family: var(--font-mono); font-size: 0.7rem;
          padding: 0.15rem 0.4rem; width: 9rem; border-radius: 2px;
        }
        .hc-input:focus { outline: none; border-color: var(--color-copper); }
        .hc-go {
          background: var(--color-bg-grid); border: 1px solid var(--color-border);
          color: var(--color-text); cursor: pointer;
          font-family: var(--font-mono); font-size: 0.7rem;
          padding: 0.15rem 0.4rem; border-radius: 2px;
        }
        .hc-go:hover { border-color: var(--color-copper); color: var(--color-copper); }
      `}</style>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
