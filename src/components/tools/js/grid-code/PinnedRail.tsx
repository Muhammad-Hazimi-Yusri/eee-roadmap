// Pinned-items section of the left rail. localStorage-backed.

import { useEffect, useState } from 'react';
import type { Pin } from '../../../../lib/grid-code/pinned';
import { getPinned, togglePin } from '../../../../lib/grid-code/pinned';
import type { StandardClause, StandardDocument } from '../../../../lib/grid-code/types';

interface Props {
  clauseLookup: StandardClause[];
  docLookup: StandardDocument[];
  onOpenClause: (c: StandardClause) => void;
}

export default function PinnedRail({ clauseLookup, docLookup, onOpenClause }: Props) {
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    setPins(getPinned());
    function onStorage(e: StorageEvent) {
      if (e.key === 'eee-grid-pinned-v1') setPins(getPinned());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function open(ref: string) {
    const c = clauseLookup.find(x => x.ref === ref);
    if (c) onOpenClause(c);
  }

  function unpin(ref: string) {
    const pin = pins.find(p => p.ref === ref);
    if (!pin) return;
    togglePin({ ref: pin.ref, title: pin.title });
    setPins(getPinned());
  }

  if (pins.length === 0) return null;

  return (
    <div className="pin-root">
      <h4 className="pin-title">Pinned ({pins.length})</h4>
      <ul className="pin-list">
        {pins.map(p => {
          const isClause = clauseLookup.some(c => c.ref === p.ref);
          const isDoc    = docLookup.some(d => d.id === p.ref);
          return (
            <li key={p.ref} className="pin-item">
              {isClause ? (
                <button type="button" className="pin-btn" onClick={() => open(p.ref)}>
                  {p.title}
                </button>
              ) : isDoc ? (
                <span className="pin-static">{p.title}</span>
              ) : (
                <span className="pin-static pin-static--stale">{p.title} (missing)</span>
              )}
              <button type="button" className="pin-remove" onClick={() => unpin(p.ref)} aria-label="Unpin">×</button>
            </li>
          );
        })}
      </ul>

      <style>{`
        .pin-root {
          margin-top: 0.75rem;
          padding-top: 0.6rem;
          border-top: 1px dashed var(--color-border);
        }
        .pin-title {
          font-family: var(--font-mono); font-size: 0.72rem;
          text-transform: uppercase; letter-spacing: 0.06em;
          margin: 0 0 0.4rem;
          color: var(--color-text);
        }
        .pin-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 0.18rem;
        }
        .pin-item {
          display: flex; align-items: center; gap: 0.3rem;
        }
        .pin-btn, .pin-static {
          flex: 1;
          padding: 0.2rem 0.4rem;
          font-family: var(--font-mono); font-size: 0.7rem;
          text-align: left;
          background: var(--color-bg-grid);
          border: 1px solid transparent;
          color: var(--color-text);
          cursor: pointer;
          border-radius: 2px;
          min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pin-btn:hover { border-color: var(--color-copper); }
        .pin-static { cursor: default; }
        .pin-static--stale { color: var(--color-text-muted); font-style: italic; }
        .pin-remove {
          background: none; border: none; padding: 0 0.3rem;
          color: var(--color-text-muted); cursor: pointer;
          font-size: 0.9rem;
        }
        .pin-remove:hover { color: #ef4444; }
      `}</style>
    </div>
  );
}
