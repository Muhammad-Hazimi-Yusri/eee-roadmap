// NetworkAnonymiser.tsx — replace bus/site names in a JSON or CSV with anonymous codes.
// Outputs the anonymised file plus a mapping table so the consultant can de-anonymise later.

import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import ToolDropzone from '../ToolDropzone';
import OutputPanel, { type ToolOutput } from '../OutputPanel';

interface MappingRow { original: string; anonymised: string }

export default function NetworkAnonymiser() {
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [prefix, setPrefix] = useState<string>('B');
  const [includeFields, setIncludeFields] = useState<string>('name, busName, BusName, station, site, busbar');
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);

  const file = files['source'];

  const run = useCallback(async () => {
    if (!file) return;
    setError(null);
    const text = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const fieldList = includeFields
      .split(',').map(s => s.trim()).filter(Boolean);
    const fieldSet = new Set(fieldList.map(f => f.toLowerCase()));

    const mapping = new Map<string, string>();
    let counter = 1;
    const anon = (orig: string): string => {
      if (mapping.has(orig)) return mapping.get(orig)!;
      const code = `${prefix}${String(counter).padStart(2, '0')}`;
      counter += 1;
      mapping.set(orig, code);
      return code;
    };

    let outputName = 'anonymised';
    let outputMime = 'text/plain';
    let outputBytes: Uint8Array;

    try {
      if (ext === 'json') {
        const obj = JSON.parse(text);
        const walk = (v: unknown): unknown => {
          if (Array.isArray(v)) return v.map(walk);
          if (v && typeof v === 'object') {
            const o = v as Record<string, unknown>;
            const out: Record<string, unknown> = {};
            for (const [k, val] of Object.entries(o)) {
              if (fieldSet.has(k.toLowerCase()) && typeof val === 'string') {
                out[k] = anon(val);
              } else {
                out[k] = walk(val);
              }
            }
            return out;
          }
          return v;
        };
        const transformed = walk(obj);
        outputName = `${file.name.replace(/\.[^.]+$/, '')}-anon.json`;
        outputMime = 'application/json';
        outputBytes = new TextEncoder().encode(JSON.stringify(transformed, null, 2));
      } else if (ext === 'csv') {
        const result = Papa.parse(text, { header: true, skipEmptyLines: 'greedy' });
        const rows = result.data as Record<string, string>[];
        const headers = result.meta.fields ?? [];
        const nameCols = headers.filter(h => fieldSet.has(h.toLowerCase()));
        if (nameCols.length === 0) {
          setError(`No matching column found. Looking for any of: ${fieldList.join(', ')}.`);
          return;
        }
        for (const r of rows) {
          for (const col of nameCols) {
            if (r[col]) r[col] = anon(r[col]);
          }
        }
        const csv = Papa.unparse(rows, { columns: headers });
        outputName = `${file.name.replace(/\.[^.]+$/, '')}-anon.csv`;
        outputMime = 'text/csv';
        outputBytes = new TextEncoder().encode(csv);
      } else {
        setError('Unsupported file type. Upload .json or .csv.');
        return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    const mappingRows: MappingRow[] = [...mapping.entries()].map(([original, anonymised]) => ({
      original, anonymised,
    }));
    const mappingCsv = Papa.unparse(mappingRows);

    setOutputs([
      { name: outputName,        mime: outputMime,            data: outputBytes },
      { name: 'mapping.csv',     mime: 'text/csv',            data: new TextEncoder().encode(mappingCsv) },
    ]);
  }, [file, prefix, includeFields]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <ToolDropzone
        slots={[{
          name: 'source', accept: '.json,.csv', required: true,
          description: 'Power-network JSON or CSV containing bus/site names.',
        }]}
        files={files}
        onChange={setFiles}
      />

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8,
        marginTop: 10, padding: '8px 10px',
        background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)',
        borderRadius: 4,
      }}>
        <Field label="Code prefix">
          <input value={prefix} onChange={e => setPrefix(e.target.value)} style={inputStyle()} />
        </Field>
        <Field label="Fields to anonymise (comma-separated, case-insensitive)">
          <input value={includeFields} onChange={e => setIncludeFields(e.target.value)} style={inputStyle()} />
        </Field>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={run} disabled={!file} style={btnPrimary(!!file)}>
          🔒 Anonymise
        </button>
      </div>

      {error && <div style={errorStyle()}>{error}</div>}

      <OutputPanel outputs={outputs} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 3,
    padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
  };
}
function btnPrimary(enabled: boolean): React.CSSProperties {
  return {
    background: enabled ? '#2563eb' : 'var(--color-bg-grid)',
    color: enabled ? '#fff' : 'var(--color-text-muted)',
    border: 'none', borderRadius: 4,
    padding: '5px 14px', cursor: enabled ? 'pointer' : 'not-allowed',
    fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 600,
  };
}
function errorStyle(): React.CSSProperties {
  return {
    marginTop: 10, padding: '8px 12px',
    color: '#ef4444', background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid #ef4444', borderRadius: 4, fontSize: '0.78rem',
  };
}
