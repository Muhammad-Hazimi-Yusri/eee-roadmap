// PFCsvCleaner.tsx — clean a solver/PowerFactory result CSV and re-export as XLSX.
// Drops blank rows, re-orders columns, applies number formatting, downloads .xlsx.

import { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ToolDropzone from '../ToolDropzone';
import OutputPanel, { type ToolOutput } from '../OutputPanel';
import ExampleLoader from '../ExampleLoader';

interface ParsedTable {
  headers: string[];
  rows: Record<string, unknown>[];
  errors: string[];
}

const EXAMPLES: { label: string; description: string; filename: string; csv: string }[] = [
  {
    label: 'PowerFactory bus dump',
    description: 'Wide solver export with blank trailing rows — the classic case this tool was built for.',
    filename: 'powerfactory-buses.csv',
    csv: `BusID,Bus_Name,Voltage_pu,Voltage_kV,Angle_deg,P_load_MW,Q_load_MVAr,P_gen_MW,Q_gen_MVAr
1,GSP_132,1.024500,135.234,0.000,0.000,0.000,80.000,15.234
2,Anvil_132,1.011200,133.479,-2.341,0.000,0.000,0.000,0.000
3,Anvil_33,0.992100,32.739,-3.875,55.000,12.500,0.000,0.000
4,WTG1_33,0.985200,32.512,-4.213,0.000,0.000,30.000,5.872
5,WTG2_33,0.984100,32.475,-4.298,0.000,0.000,30.000,5.812
,,,,,,,,
6,Beacon_132,1.005400,132.713,-1.892,0.000,0.000,0.000,0.000
7,Beacon_33,0.978500,32.291,-3.124,42.000,9.800,0.000,0.000
,,,,,,,,
,,,,,,,,`,
  },
  {
    label: 'Line flows',
    description: 'Branch results with three numeric columns and a couple of blank separator rows.',
    filename: 'line-flows.csv',
    csv: `From,To,Circuit,P_MW,Q_MVAr,Loading_pct
GSP,Anvil,1,80.234,15.871,42.500
GSP,Beacon,1,42.119,9.231,28.300
Anvil,WTG1,1,-30.012,-5.892,18.700
Anvil,WTG2,1,-30.008,-5.871,18.700
,,,,,
Beacon,T1_LV,1,42.000,9.800,67.200
Beacon,T2_LV,1,0.000,0.000,0.000
,,,,,`,
  },
];

export default function PFCsvCleaner() {
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [parsed, setParsed] = useState<ParsedTable | null>(null);
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [includeColumns, setIncludeColumns] = useState<Record<string, boolean>>({});
  const [decimals, setDecimals] = useState<number>(4);

  const file = files['csv'];

  const parse = useCallback(async () => {
    if (!file) return;
    setError(null);
    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: 'greedy', dynamicTyping: true });
    if (result.errors.length > 0 && result.data.length === 0) {
      setError(result.errors.map(e => e.message).join('; '));
      return;
    }
    const headers = result.meta.fields ?? [];
    setParsed({
      headers,
      rows: result.data as Record<string, unknown>[],
      errors: result.errors.map(e => e.message),
    });
    setIncludeColumns(Object.fromEntries(headers.map(h => [h, true])));
  }, [file]);

  const loadExample = useCallback((ex: typeof EXAMPLES[number]) => {
    const f = new File([ex.csv], ex.filename, { type: 'text/csv' });
    setFiles({ csv: f });
    setParsed(null);
    setOutputs([]);
    setError(null);
  }, []);

  const cleanedRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.filter(r =>
      Object.values(r).some(v => v !== null && v !== '' && v !== undefined),
    );
  }, [parsed]);

  const exportXlsx = useCallback(() => {
    if (!parsed) return;
    const cols = parsed.headers.filter(h => includeColumns[h]);
    const projected = cleanedRows.map(r =>
      Object.fromEntries(cols.map(c => [c, r[c]])),
    );

    const ws = XLSX.utils.json_to_sheet(projected, { header: cols });
    // Apply number format on numeric columns.
    const fmt = '0.' + '0'.repeat(decimals);
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell && typeof cell.v === 'number') cell.z = fmt;
      }
    }
    ws['!cols'] = cols.map(c => ({ wch: Math.max(c.length + 2, 12) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cleaned');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    setOutputs([{
      name: 'cleaned.xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data: new Uint8Array(buf),
    }]);
  }, [parsed, cleanedRows, includeColumns, decimals]);

  const exportCleanCsv = useCallback(() => {
    if (!parsed) return;
    const cols = parsed.headers.filter(h => includeColumns[h]);
    const projected = cleanedRows.map(r =>
      Object.fromEntries(cols.map(c => [c, r[c]])),
    );
    const csv = Papa.unparse(projected, { columns: cols });
    setOutputs([{
      name: 'cleaned.csv',
      mime: 'text/csv',
      data: new TextEncoder().encode(csv),
    }]);
  }, [parsed, cleanedRows, includeColumns]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <ExampleLoader
        examples={EXAMPLES.map(ex => ({
          label: ex.label,
          description: ex.description,
          onLoad: () => loadExample(ex),
        }))}
      />

      <ToolDropzone
        slots={[{
          name: 'csv', accept: '.csv,text/csv', required: true,
          description: 'PowerFactory / solver export — first row is the header.',
        }]}
        files={files}
        onChange={setFiles}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={parse} disabled={!file} style={btnPrimary(!!file)}>
          ▶ Parse CSV
        </button>
        {parsed && (
          <>
            <button onClick={exportXlsx} style={btn()}>⤓ Cleaned XLSX</button>
            <button onClick={exportCleanCsv} style={btn()}>⤓ Cleaned CSV</button>
          </>
        )}
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {parsed && `${cleanedRows.length} non-empty rows · ${parsed.headers.length} columns`}
        </span>
      </div>

      {error && (
        <div style={errorStyle()}>{error}</div>
      )}

      {parsed && (
        <>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
            marginTop: 12, padding: '8px 10px',
            background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)', borderRadius: 4,
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Decimals
            </span>
            <input
              type="number" min={0} max={8} step={1} value={decimals}
              onChange={e => setDecimals(Math.max(0, Number(e.target.value)))}
              style={{ ...inputStyle(), width: 50 }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: 12 }}>
              Include columns
            </span>
            {parsed.headers.map(h => (
              <label key={h} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem',
              }}>
                <input
                  type="checkbox" checked={!!includeColumns[h]}
                  onChange={e => setIncludeColumns(p => ({ ...p, [h]: e.target.checked }))}
                />
                {h}
              </label>
            ))}
          </div>

          <PreviewTable
            headers={parsed.headers.filter(h => includeColumns[h])}
            rows={cleanedRows.slice(0, 20)}
          />
          {cleanedRows.length > 20 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              showing first 20 of {cleanedRows.length} rows
            </div>
          )}
        </>
      )}

      <OutputPanel outputs={outputs} />
    </div>
  );
}

function PreviewTable({ headers, rows }: { headers: string[]; rows: Record<string, unknown>[] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 10, border: '1px solid var(--color-border)', borderRadius: 4 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.74rem', width: '100%' }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-grid)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {headers.map(h => (
                <td key={h} style={{ padding: '4px 10px', borderTop: '1px solid var(--color-border)' }}>
                  {String(r[h] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function btn(): React.CSSProperties {
  return {
    background: 'transparent', color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)', borderRadius: 3,
    padding: '4px 10px', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
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
function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 3,
    padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
  };
}
