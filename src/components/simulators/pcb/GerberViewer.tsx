// src/components/simulators/pcb/GerberViewer.tsx
// Gerber file viewer using web-gerber.
// Accepts file drag-drop or click-to-upload, renders SVG per layer.
// Hydration: client:only="react" (web-gerber uses browser APIs)

import { useState, useCallback, useRef, useId } from 'react';

// web-gerber exports
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — web-gerber has no TypeScript types
import { renderSVG, parse, plot } from 'web-gerber';

interface LayerFile {
  name: string;
  type: string;
  svgString: string;
  visible: boolean;
}

const LAYER_COLORS: Record<string, string> = {
  copper_top: '#d4a030',
  copper_bottom: '#4a9eff',
  silkscreen_top: '#ffffff',
  silkscreen_bottom: '#999999',
  soldermask_top: '#2d7a2d',
  soldermask_bottom: '#267026',
  drill: '#ff6060',
  outline: '#888888',
  unknown: '#aaaaaa',
};

function guessLayerType(filename: string): string {
  const f = filename.toLowerCase();
  if (f.endsWith('.gtl') || f.includes('f.cu') || f.includes('copper_top')) return 'copper_top';
  if (f.endsWith('.gbl') || f.includes('b.cu') || f.includes('copper_bottom')) return 'copper_bottom';
  if (f.endsWith('.gto') || f.includes('f.silk') || f.includes('silkscreen_top')) return 'silkscreen_top';
  if (f.endsWith('.gbo') || f.includes('b.silk') || f.includes('silkscreen_bottom')) return 'silkscreen_bottom';
  if (f.endsWith('.gts') || f.includes('f.mask') || f.includes('soldermask_top')) return 'soldermask_top';
  if (f.endsWith('.gbs') || f.includes('b.mask') || f.includes('soldermask_bottom')) return 'soldermask_bottom';
  if (f.endsWith('.drl') || f.endsWith('.xln') || f.includes('drill')) return 'drill';
  if (f.endsWith('.gko') || f.includes('edge.cuts') || f.includes('outline')) return 'outline';
  return 'unknown';
}

async function parseGerber(text: string, color: string): Promise<string> {
  try {
    const parsed = parse(text);
    const plotted = plot(parsed);
    const svg: string = renderSVG(plotted, { color, backgroundColor: 'transparent' });
    return svg;
  } catch {
    return '';
  }
}

export default function GerberViewer() {
  const [layers, setLayers] = useState<LayerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dropId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const processFiles = useCallback(async (files: FileList) => {
    setLoading(true);
    setError(null);
    const newLayers: LayerFile[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const validExts = ['gbr', 'gtl', 'gbl', 'gto', 'gbo', 'gts', 'gbs', 'drl', 'xln', 'gko', 'ger'];
      if (!validExts.includes(ext)) continue;

      try {
        const text = await file.text();
        const type = guessLayerType(file.name);
        const color = LAYER_COLORS[type] ?? LAYER_COLORS['unknown'];
        const svgString = await parseGerber(text, color);
        if (svgString) {
          newLayers.push({ name: file.name, type, svgString, visible: true });
        }
      } catch {
        // skip unparseable files
      }
    }

    if (newLayers.length === 0) {
      setError('No valid Gerber files found. Accepted: .gtl .gbl .gto .gbo .gts .gbs .drl .gko');
    } else {
      setLayers(prev => {
        // Replace layers with same name, append new ones
        const merged = [...prev];
        for (const nl of newLayers) {
          const idx = merged.findIndex(l => l.name === nl.name);
          if (idx >= 0) merged[idx] = nl;
          else merged.push(nl);
        }
        return merged;
      });
    }
    setLoading(false);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  }

  function toggleLayer(name: string) {
    setLayers(prev => prev.map(l => l.name === name ? { ...l, visible: !l.visible } : l));
  }

  function clearAll() {
    setLayers([]);
    setError(null);
  }

  const visibleLayers = layers.filter(l => l.visible);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      {/* Drop zone */}
      {layers.length === 0 && (
        <label
          htmlFor={dropId}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            border: `2px dashed ${dragging ? 'var(--color-copper)' : 'var(--color-border)'}`,
            borderRadius: '6px',
            background: dragging ? 'color-mix(in srgb, var(--color-copper) 5%, transparent)' : 'var(--color-bg-grid)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>📁</div>
          <div style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: '0.25rem' }}>
            {loading ? 'Parsing files…' : 'Drop Gerber files here'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 }}>
            .gtl .gbl .gto .gbo .gts .gbs .drl .gko
          </div>
          <input
            id={dropId}
            type="file"
            multiple
            accept=".gbr,.gtl,.gbl,.gto,.gbo,.gts,.gbs,.drl,.xln,.gko,.ger"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>
      )}

      {error && (
        <div style={{ padding: '0.6rem 0.8rem', background: 'color-mix(in srgb, #c04040 12%, transparent)', border: '1px solid #c04040', borderRadius: '4px', color: '#e06060', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          {error}
        </div>
      )}

      {layers.length > 0 && (
        <>
          {/* Layer controls */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
            {layers.map(l => (
              <button
                key={l.name}
                onClick={() => toggleLayer(l.name)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '3px',
                  border: `1px solid ${l.visible ? (LAYER_COLORS[l.type] ?? '#888') : 'var(--color-border)'}`,
                  background: l.visible ? 'color-mix(in srgb, ' + (LAYER_COLORS[l.type] ?? '#888') + ' 14%, transparent)' : 'var(--color-bg)',
                  color: l.visible ? (LAYER_COLORS[l.type] ?? '#aaa') : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  opacity: l.visible ? 1 : 0.5,
                }}
              >
                {l.name}
              </button>
            ))}
            <button onClick={clearAll} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '3px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-muted)', cursor: 'pointer', marginLeft: 'auto' }}>
              Clear
            </button>
          </div>

          {/* Composite SVG viewer */}
          <div
            ref={containerRef}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              background: '#0a1a0a',
              minHeight: '300px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {visibleLayers.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                All layers hidden — toggle layers above to show them
              </div>
            ) : (
              <div style={{ position: 'relative', padding: '1rem' }}>
                {visibleLayers.map((l, i) => (
                  <div
                    key={l.name}
                    dangerouslySetInnerHTML={{ __html: l.svgString }}
                    style={{
                      position: i === 0 ? 'relative' : 'absolute',
                      top: i === 0 ? undefined : '1rem',
                      left: i === 0 ? undefined : '1rem',
                      right: i === 0 ? undefined : '1rem',
                      mixBlendMode: i === 0 ? undefined : 'screen',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add more files */}
          <label style={{ display: 'inline-block', marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-text-muted)', textDecoration: 'underline' }}>
            + Add more files
            <input
              type="file"
              multiple
              accept=".gbr,.gtl,.gbl,.gto,.gbo,.gts,.gbs,.drl,.xln,.gko,.ger"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
        </>
      )}
    </div>
  );
}
