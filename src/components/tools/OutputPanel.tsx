// OutputPanel.tsx — renders tool outputs by MIME type with download buttons.

import { useEffect, useState } from 'react';

export interface ToolOutput {
  /** Filename. */
  name: string;
  mime: string;
  /** Binary content. */
  data: Uint8Array;
}

interface Props {
  outputs: ToolOutput[];
}

export default function OutputPanel({ outputs }: Props) {
  if (!outputs.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
      <div style={{
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
      }}>
        // outputs
      </div>
      {outputs.map(o => <OutputCard key={o.name} output={o} />)}
    </div>
  );
}

function OutputCard({ output }: { output: ToolOutput }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = output.mime.startsWith('image/');
  const isText  = output.mime.startsWith('text/') || output.mime === 'application/json';

  useEffect(() => {
    if (!isImage && !isText) return;
    const blob = new Blob([new Uint8Array(output.data)], { type: output.mime });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [output, isImage, isText]);

  function download() {
    const blob = new Blob([new Uint8Array(output.data)], { type: output.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = output.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 4,
      background: 'var(--color-bg)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px',
        borderBottom: '1px solid var(--color-border)',
        background: 'color-mix(in srgb, var(--color-text) 4%, transparent)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.74rem',
      }}>
        <span>
          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{output.name}</span>
          <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>
            {output.mime} · {formatBytes(output.data.length)}
          </span>
        </span>
        <button
          onClick={download}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
            background: 'var(--color-bg)', color: 'var(--color-copper, #c87533)',
            border: '1px solid var(--color-copper, #c87533)',
            borderRadius: 3, padding: '2px 9px', cursor: 'pointer',
          }}
        >⤓ download</button>
      </div>

      {isImage && previewUrl && (
        <img src={previewUrl} alt={output.name} style={{ maxWidth: '100%', display: 'block' }} />
      )}
      {isText && previewUrl && (
        <TextPreview url={previewUrl} />
      )}
      {!isImage && !isText && (
        <div style={{ padding: 12, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          Binary output — use the download button.
        </div>
      )}
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    fetch(url).then(r => r.text()).then(t => setText(t.length > 5000 ? t.slice(0, 5000) + '\n…' : t));
  }, [url]);
  if (text === null) return null;
  return (
    <pre style={{
      margin: 0, padding: '10px 14px',
      fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
      maxHeight: 320, overflow: 'auto',
      whiteSpace: 'pre',
    }}>{text}</pre>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
