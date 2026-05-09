// HarmonicFFT.tsx — upload a time-domain CSV, run an FFT, show spectrum + THD.
// Reuses analyzeWaveform from src/lib/power/harmonics.ts.

import { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import {
  analyzeWaveform, G5_5_VOLTAGE_LIMITS_HV, G5_5_THD_LIMIT_HV,
} from '../../../lib/power/harmonics';
import ToolDropzone from '../ToolDropzone';
import OutputPanel, { type ToolOutput } from '../OutputPanel';

const FUNDAMENTAL_HZ = 50;

interface ParsedSamples {
  samples: number[];
  fs: number; // sampling frequency, Hz
  duration: number;
}

export default function HarmonicFFT() {
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [valueColumn, setValueColumn] = useState<string>('');
  const [timeColumn, setTimeColumn]   = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, number>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<ToolOutput[]>([]);

  const file = files['waveform'];

  const parseFile = useCallback(async () => {
    if (!file) return;
    setError(null);
    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: 'greedy', dynamicTyping: true });
    const headers = result.meta.fields ?? [];
    const rows = result.data as Record<string, number>[];
    if (rows.length < 16) {
      setError('Need at least 16 samples for an FFT.');
      return;
    }
    setColumns(headers);
    setRawRows(rows);
    // Best-effort auto-pick: time = first numeric, value = second numeric.
    const numericHeaders = headers.filter(h => typeof rows[0]?.[h] === 'number');
    if (numericHeaders[0]) setTimeColumn(numericHeaders[0]);
    if (numericHeaders[1]) setValueColumn(numericHeaders[1]);
  }, [file]);

  const parsed: ParsedSamples | null = useMemo(() => {
    if (!rawRows || !valueColumn) return null;
    const samples = rawRows
      .map(r => Number(r[valueColumn]))
      .filter(n => Number.isFinite(n));
    if (samples.length < 16) return null;
    let fs = 0;
    let duration = 0;
    if (timeColumn) {
      const times = rawRows
        .map(r => Number(r[timeColumn]))
        .filter(n => Number.isFinite(n));
      if (times.length >= 2 && times[1] > times[0]) {
        const dt = (times[times.length - 1] - times[0]) / (times.length - 1);
        fs = 1 / dt;
        duration = times[times.length - 1] - times[0];
      }
    }
    return { samples, fs, duration };
  }, [rawRows, valueColumn, timeColumn]);

  // Determine number of fundamental cycles in the window.
  const cycles = useMemo(() => {
    if (!parsed || parsed.duration === 0) return 1;
    return Math.max(1, Math.round(parsed.duration * FUNDAMENTAL_HZ));
  }, [parsed]);

  const spectrum = useMemo(() => {
    if (!parsed) return null;
    return analyzeWaveform(parsed.samples, 25, cycles);
  }, [parsed, cycles]);

  const exportSpectrum = useCallback(() => {
    if (!spectrum) return;
    const lines = ['Order,Frequency_Hz,Magnitude_pct,G5_5_Limit_pct,Status'];
    for (const c of spectrum.components) {
      const order = c.order;
      const magPct = c.magnitude * 100;
      const limit = G5_5_VOLTAGE_LIMITS_HV[order];
      const status = order === 1 ? 'fundamental'
        : limit === undefined ? 'no limit'
        : magPct > limit ? 'EXCEEDS' : 'within limit';
      lines.push([order, order * FUNDAMENTAL_HZ, magPct.toFixed(3), limit ?? '', status].join(','));
    }
    lines.push('');
    lines.push(`THD_pct,${spectrum.thdPercent.toFixed(3)}`);
    lines.push(`THD_limit_G5_5_pct,${G5_5_THD_LIMIT_HV.toFixed(2)}`);
    setOutputs([{
      name: 'fft-spectrum.csv',
      mime: 'text/csv',
      data: new TextEncoder().encode(lines.join('\n')),
    }]);
  }, [spectrum]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <ToolDropzone
        slots={[{
          name: 'waveform', accept: '.csv', required: true,
          description: 'Time-series CSV with a header row — at least one numeric column.',
        }]}
        files={files}
        onChange={setFiles}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={parseFile} disabled={!file} style={btnPrimary(!!file)}>
          ▶ Parse waveform
        </button>
        {parsed && spectrum && (
          <button onClick={exportSpectrum} style={btn()}>⤓ Spectrum CSV</button>
        )}
      </div>

      {error && <div style={errorStyle()}>{error}</div>}

      {columns.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', marginTop: 10,
          padding: '8px 10px',
          background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)',
          borderRadius: 4,
        }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Time column{' '}
            <select value={timeColumn} onChange={e => setTimeColumn(e.target.value)} style={selectStyle()}>
              <option value="">(infer from sample count)</option>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Value column{' '}
            <select value={valueColumn} onChange={e => setValueColumn(e.target.value)} style={selectStyle()}>
              <option value="">—</option>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {parsed && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {parsed.samples.length} samples
              {parsed.fs > 0 && ` · fs ≈ ${parsed.fs.toFixed(0)} Hz`}
              {parsed.duration > 0 && ` · ${cycles} cycle${cycles === 1 ? '' : 's'}`}
            </span>
          )}
        </div>
      )}

      {spectrum && (
        <SpectrumDisplay
          components={spectrum.components}
          thd={spectrum.thdPercent}
        />
      )}

      <OutputPanel outputs={outputs} />
    </div>
  );
}

function SpectrumDisplay({ components, thd }: {
  components: { order: number; magnitude: number }[];
  thd: number;
}) {
  const exceeds = thd > G5_5_THD_LIMIT_HV;
  const W = 540, H = 130, PAD_L = 32, PAD_B = 22, PAD_T = 8, PAD_R = 8;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const orders = components.filter(c => c.order >= 2 && c.order <= 25);
  const maxMag = Math.max(
    3,
    ...orders.map(c => c.magnitude * 100),
    ...Object.values(G5_5_VOLTAGE_LIMITS_HV),
  );
  const xForOrder = (o: number) => PAD_L + ((o - 2) / 23) * plotW;
  const yForPct   = (p: number) => PAD_T + plotH * (1 - Math.min(p / maxMag, 1));

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        Spectrum (h2–h25, % of fundamental). Orange dashes = G5/5 EHV limits.
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{
        width: '100%', height: 'auto',
        border: '1px solid var(--color-border)', borderRadius: 4,
        background: 'var(--color-bg)',
      }}>
        {Object.entries(G5_5_VOLTAGE_LIMITS_HV).map(([o, lim]) => {
          const order = Number(o);
          if (order < 2 || order > 25) return null;
          const x = xForOrder(order);
          const y = yForPct(lim);
          return (
            <line key={order} x1={x - 8} x2={x + 8} y1={y} y2={y}
              stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 2" />
          );
        })}
        {orders.map(c => {
          const x = xForOrder(c.order);
          const pct = c.magnitude * 100;
          const limit = G5_5_VOLTAGE_LIMITS_HV[c.order];
          const ex = limit !== undefined && pct > limit;
          const y = yForPct(pct);
          return (
            <g key={c.order}>
              <rect
                x={x - 5} y={y} width={10}
                height={Math.max(0, PAD_T + plotH - y)}
                fill={ex ? '#ef4444' : '#2563eb'} fillOpacity={0.85}
              >
                <title>h{c.order}: {pct.toFixed(2)}% {limit ? `(limit ${limit}%)` : ''}</title>
              </rect>
              <text x={x} y={H - 8} textAnchor="middle" fontSize={7} fill="var(--color-text-muted)">{c.order}</text>
            </g>
          );
        })}
      </svg>
      <div style={{
        marginTop: 8, padding: '6px 12px',
        border: `1px solid ${exceeds ? '#ef4444' : 'var(--color-border)'}`,
        borderRadius: 4,
        background: exceeds ? 'rgba(239,68,68,0.06)' : 'var(--color-bg)',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>
          THDv{' '}
          <span style={{ fontWeight: 600, color: exceeds ? '#ef4444' : 'var(--color-text)' }}>
            {thd.toFixed(2)}%
          </span>
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          G5/5 EHV limit {G5_5_THD_LIMIT_HV}% — {exceeds ? 'EXCEEDS' : 'within limit'}
        </span>
      </div>
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
function selectStyle(): React.CSSProperties {
  return {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 3,
    padding: '3px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
  };
}
function errorStyle(): React.CSSProperties {
  return {
    marginTop: 10, padding: '8px 12px',
    color: '#ef4444', background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid #ef4444', borderRadius: 4, fontSize: '0.78rem',
  };
}
