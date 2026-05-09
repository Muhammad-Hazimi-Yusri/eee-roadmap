// ToolDropzone.tsx — drag-and-drop / click-to-upload zone for one or more file slots.
// Mirrors the GerberViewer pattern but multi-slot and accept-aware.

import { useState, useCallback, useId } from 'react';

export interface DropzoneSlot {
  /** Logical slot name (matches Python tool input.name). */
  name: string;
  /** HTML accept attribute. */
  accept: string;
  required: boolean;
  description: string;
}

interface Props {
  slots: DropzoneSlot[];
  files: Record<string, File | undefined>;
  onChange: (next: Record<string, File | undefined>) => void;
  /** Optional sample-data downloads, one per slot. Each fills the slot when clicked. */
  sampleUrls?: Record<string, { label: string; href: string }>;
}

export default function ToolDropzone({ slots, files, onChange, sampleUrls }: Props) {
  const idBase = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {slots.map(slot => (
        <SlotZone
          key={slot.name}
          slot={slot}
          file={files[slot.name]}
          inputId={`${idBase}-${slot.name}`}
          onSet={f => onChange({ ...files, [slot.name]: f })}
          onClear={() => onChange({ ...files, [slot.name]: undefined })}
          sample={sampleUrls?.[slot.name]}
        />
      ))}
    </div>
  );
}

function SlotZone({
  slot, file, inputId, onSet, onClear, sample,
}: {
  slot: DropzoneSlot;
  file: File | undefined;
  inputId: string;
  onSet: (f: File) => void;
  onClear: () => void;
  sample?: { label: string; href: string };
}) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onSet(f);
  }, [onSet]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onSet(f);
  }, [onSet]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
          {slot.name}{slot.required && <span style={{ color: '#ef4444' }}> *</span>}
          <span style={{ marginLeft: 8, fontSize: '0.7rem', opacity: 0.85 }}>{slot.description}</span>
        </span>
        {sample && (
          <a
            href={sample.href}
            download
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-copper, #c87533)',
              textDecoration: 'none',
            }}
          >⤓ {sample.label}</a>
        )}
      </div>

      {file ? (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 12px', borderRadius: 4,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-grid)',
          fontSize: '0.78rem',
        }}>
          <span>
            <span style={{ color: '#22c55e' }}>✓</span>{' '}
            <span style={{ fontWeight: 600 }}>{file.name}</span>{' '}
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
              ({formatBytes(file.size)})
            </span>
          </span>
          <button
            onClick={onClear}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '0.78rem',
            }}
          >change</button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 64,
            border: `1.5px dashed ${dragging ? 'var(--color-copper)' : 'var(--color-border)'}`,
            borderRadius: 4,
            background: dragging
              ? 'color-mix(in srgb, var(--color-copper) 6%, transparent)'
              : 'transparent',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
          }}
        >
          drop or click — accepts {slot.accept}
          <input
            id={inputId}
            type="file"
            accept={slot.accept}
            onChange={handleInput}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
