// BulkPerUnit.tsx — convert a CSV / pasted list of values between physical and per-unit.

import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import {
  bulkConvert, physicalUnit,
  type PuQuantity, type PuPhase, type PuDirection,
} from '../../../lib/power/per-unit';
import OutputPanel, { type ToolOutput } from '../OutputPanel';

const QUANTITIES: { value: PuQuantity; label: string }[] = [
  { value: 'voltage',   label: 'Voltage'   },
  { value: 'current',   label: 'Current'   },
  { value: 'impedance', label: 'Impedance' },
  { value: 'power',     label: 'Power'     },
];

export default function BulkPerUnit() {
  const [direction, setDirection] = useState<PuDirection>('to-pu');
  const [quantity,  setQuantity]  = useState<PuQuantity>('voltage');
  const [phase,     setPhase]     = useState<PuPhase>('3ph');
  const [baseMVA,   setBaseMVA]   = useState<number>(100);
  const [baseKV,    setBaseKV]    = useState<number>(132);
  const [pasted,    setPasted]    = useState<string>('132\n130.5\n128.0\n125.7');
  const [outputs,   setOutputs]   = useState<ToolOutput[]>([]);

  const parseInput = useCallback((): number[] => {
    // Accept one number per line, or a CSV with a single column. Skip empties / non-numerics.
    return pasted
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => Number(s))
      .filter(n => Number.isFinite(n));
  }, [pasted]);

  const run = useCallback(() => {
    const values = parseInput();
    if (values.length === 0) {
      setOutputs([]);
      return;
    }
    const converted = bulkConvert(
      values.map(v => ({ value: v })),
      quantity, direction,
      { baseMVA, baseKV },
      phase,
    );

    const inUnit = direction === 'to-pu' ? physicalUnit(quantity, phase) : 'pu';
    const outUnit = direction === 'to-pu' ? 'pu' : physicalUnit(quantity, phase);

    const rows = converted.map((c, i) => ({
      idx: i + 1,
      [`input_${inUnit}`]: c.value,
      [`output_${outUnit}`]: Number(c.converted.toFixed(6)),
    }));
    const csv = Papa.unparse(rows);

    setOutputs([{
      name: `per-unit-${quantity}-${direction}.csv`,
      mime: 'text/csv',
      data: new TextEncoder().encode(csv),
    }]);
  }, [parseInput, quantity, direction, phase, baseMVA, baseKV]);

  const previewRows = parseInput().slice(0, 8);
  const preview = bulkConvert(
    previewRows.map(v => ({ value: v })),
    quantity, direction,
    { baseMVA, baseKV },
    phase,
  );

  const inUnit = direction === 'to-pu' ? physicalUnit(quantity, phase) : 'pu';
  const outUnit = direction === 'to-pu' ? 'pu' : physicalUnit(quantity, phase);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 8, padding: '8px 10px',
        background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)',
        borderRadius: 4, marginBottom: 10,
      }}>
        <Field label="Direction">
          <select value={direction} onChange={e => setDirection(e.target.value as PuDirection)} style={selectStyle()}>
            <option value="to-pu">physical → pu</option>
            <option value="from-pu">pu → physical</option>
          </select>
        </Field>
        <Field label="Quantity">
          <select value={quantity} onChange={e => setQuantity(e.target.value as PuQuantity)} style={selectStyle()}>
            {QUANTITIES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
          </select>
        </Field>
        <Field label="Phase">
          <select value={phase} onChange={e => setPhase(e.target.value as PuPhase)} style={selectStyle()}>
            <option value="3ph">3-phase</option>
            <option value="1ph">single-phase</option>
          </select>
        </Field>
        <Field label="Base MVA">
          <input type="number" value={baseMVA} onChange={e => setBaseMVA(Number(e.target.value))} style={selectStyle()} />
        </Field>
        <Field label="Base kV">
          <input type="number" value={baseKV} onChange={e => setBaseKV(Number(e.target.value))} style={selectStyle()} />
        </Field>
      </div>

      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        Paste values (one per line or comma-separated, in {inUnit})
      </label>
      <textarea
        value={pasted}
        onChange={e => setPasted(e.target.value)}
        rows={8}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
          background: 'var(--color-bg)', color: 'var(--color-text)',
          border: '1px solid var(--color-border)', borderRadius: 4,
          padding: '6px 8px',
        }}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={run} disabled={previewRows.length === 0} style={btnPrimary(previewRows.length > 0)}>
          ⚡ Convert and download CSV
        </button>
      </div>

      {preview.length > 0 && (
        <table style={{ marginTop: 10, borderCollapse: 'collapse', fontSize: '0.74rem' }}>
          <thead>
            <tr style={{ color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '4px 10px', textAlign: 'left' }}>input ({inUnit})</th>
              <th style={{ padding: '4px 10px', textAlign: 'left' }}>output ({outUnit})</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((p, i) => (
              <tr key={i}>
                <td style={{ padding: '2px 10px' }}>{p.value}</td>
                <td style={{ padding: '2px 10px', color: 'var(--color-copper, #c87533)' }}>
                  {p.converted.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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

function selectStyle(): React.CSSProperties {
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
