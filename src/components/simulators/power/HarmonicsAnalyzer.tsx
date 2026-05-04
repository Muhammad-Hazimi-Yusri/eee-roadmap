// HarmonicsAnalyzer.tsx — interactive harmonic spectrum + waveform editor.
// Pure React, no chart library. Synthesises a waveform from per-order magnitudes,
// runs an FFT, and overlays ENA G5/5 voltage planning limits.

import { useMemo, useState, useCallback } from 'react';
import {
  analyzeWaveform, synthesizeWaveform,
  G5_5_VOLTAGE_LIMITS_HV, G5_5_THD_LIMIT_HV,
  type HarmonicComponent,
} from '../../../lib/power/harmonics.js';
import { downloadText } from '../../../lib/power/export.js';

const NUM_SAMPLES = 512;
const CYCLES = 1;
const DEFAULT_ORDERS = [1, 3, 5, 7, 9, 11, 13];
const FUNDAMENTAL_HZ = 50; // UK system

interface SliderRow {
  order: number;
  pct: number; // % of fundamental
}

const PRESETS: { name: string; rows: { order: number; pct: number }[] }[] = [
  {
    name: 'Pure 50 Hz sinusoid',
    rows: [{ order: 1, pct: 100 }],
  },
  {
    name: '6-pulse VFD (typical)',
    rows: [
      { order: 1, pct: 100 }, { order: 5, pct: 20 }, { order: 7, pct: 14 },
      { order: 11, pct: 9 }, { order: 13, pct: 8 },
    ],
  },
  {
    name: 'Square wave (odd harmonics)',
    rows: [
      { order: 1, pct: 100 }, { order: 3, pct: 33.3 }, { order: 5, pct: 20 },
      { order: 7, pct: 14.3 }, { order: 9, pct: 11.1 }, { order: 11, pct: 9.1 },
      { order: 13, pct: 7.7 },
    ],
  },
  {
    name: 'LED lighting cluster',
    rows: [
      { order: 1, pct: 100 }, { order: 3, pct: 30 }, { order: 5, pct: 12 },
      { order: 7, pct: 8 }, { order: 9, pct: 5 }, { order: 11, pct: 4 },
    ],
  },
];

export default function HarmonicsAnalyzer() {
  const [rows, setRows] = useState<SliderRow[]>(
    DEFAULT_ORDERS.map(o => ({ order: o, pct: o === 1 ? 100 : 0 })),
  );

  const setRow = useCallback((order: number, pct: number) => {
    setRows(prev => prev.map(r => r.order === order ? { ...r, pct } : r));
  }, []);

  const applyPreset = useCallback((idx: number) => {
    const preset = PRESETS[idx];
    setRows(DEFAULT_ORDERS.map(o => ({
      order: o,
      pct: preset.rows.find(r => r.order === o)?.pct ?? 0,
    })));
  }, []);

  // Build harmonic component list from sliders, synth + analyse.
  const { samples, spectrum } = useMemo(() => {
    const harmonics: HarmonicComponent[] = rows
      .filter(r => r.pct > 0)
      .map(r => ({ order: r.order, magnitude: r.pct / 100, phase: 0 }));
    const samples = synthesizeWaveform(harmonics, NUM_SAMPLES, CYCLES);
    const spectrum = analyzeWaveform(samples, 25, CYCLES);
    return { samples, spectrum };
  }, [rows]);

  const exportCSV = useCallback(() => {
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
    downloadText('harmonic-spectrum.csv', lines.join('\n'));
  }, [spectrum]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>preset:</span>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => applyPreset(i)}
            style={btnStyle()}
          >{p.name}</button>
        ))}
        <button onClick={exportCSV} style={btnStyle('export')}>⤓ Spectrum CSV</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)', gap: 14 }}>
        {/* Waveform + spectrum */}
        <div>
          <WaveformChart samples={samples} cycles={CYCLES} />
          <SpectrumChart spectrum={spectrum} />
          <THDPanel thdPercent={spectrum.thdPercent} />
        </div>

        {/* Slider panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
            Harmonic content (% of fundamental)
          </div>
          {rows.map(r => (
            <HarmonicSlider
              key={r.order}
              order={r.order}
              pct={r.pct}
              limit={G5_5_VOLTAGE_LIMITS_HV[r.order]}
              onChange={v => setRow(r.order, v)}
            />
          ))}
          <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Limits shown are ENA G5/5 EHV planning levels (UK).
            LV / MV systems have higher allowances.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HarmonicSlider({ order, pct, limit, onChange }: {
  order: number; pct: number; limit?: number; onChange: (v: number) => void;
}) {
  const exceeds = limit !== undefined && pct > limit;
  const isFundamental = order === 1;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40px 1fr 60px',
      alignItems: 'center', gap: 6,
      padding: '4px 6px',
      background: exceeds ? 'rgba(239,68,68,0.08)' : 'transparent',
      borderRadius: 3,
    }}>
      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
        h{order}
      </span>
      <input
        type="range"
        min={0}
        max={isFundamental ? 100 : 50}
        step={0.5}
        value={pct}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: exceeds ? '#ef4444' : '#2563eb' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.7rem' }}>
        <span style={{ color: exceeds ? '#ef4444' : 'var(--color-text)', fontWeight: 600 }}>
          {pct.toFixed(1)}%
        </span>
        {limit !== undefined && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.62rem' }}>
            ≤{limit}%
          </span>
        )}
      </div>
    </div>
  );
}

function WaveformChart({ samples, cycles }: { samples: number[]; cycles: number }) {
  const W = 520, H = 130, PAD = 22;
  const maxAbs = Math.max(...samples.map(Math.abs), 1);
  const yScale = (v: number) => H / 2 - (v / maxAbs) * (H / 2 - PAD);
  const xScale = (i: number) => PAD + (i / (samples.length - 1)) * (W - PAD * 2);
  const path = samples
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`)
    .join(' ');

  const cycleTicks = Array.from({ length: cycles + 1 }, (_, i) => i);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        Synthesised waveform ({cycles} cycle, peak = {maxAbs.toFixed(2)} pu)
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg)' }}>
        {/* zero line */}
        <line x1={PAD} x2={W - PAD} y1={H/2} y2={H/2} stroke="var(--color-border)" strokeDasharray="2 3" />
        {/* x-axis ticks */}
        {cycleTicks.map(t => {
          const x = PAD + (t / cycles) * (W - PAD * 2);
          return (
            <g key={t}>
              <line x1={x} x2={x} y1={H/2 - 4} y2={H/2 + 4} stroke="var(--color-border)" />
              <text x={x} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--color-text-muted)">
                {t === 0 ? '0' : `${(t * 1000 / 50 / cycles).toFixed(0)} ms`}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#2563eb" strokeWidth={1.5} />
      </svg>
    </div>
  );
}

function SpectrumChart({ spectrum }: { spectrum: ReturnType<typeof analyzeWaveform> }) {
  const W = 520, H = 130, PAD_L = 32, PAD_B = 22, PAD_T = 8, PAD_R = 8;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const components = spectrum.components.slice(1); // drop fundamental for distortion view
  const maxOrder = 25;
  const maxMag = Math.max(
    ...components.map(c => c.magnitude * 100),
    ...Object.values(G5_5_VOLTAGE_LIMITS_HV),
    3,
  );

  const xForOrder = (o: number) => PAD_L + ((o - 2) / (maxOrder - 2)) * plotW;
  const yForPct = (p: number) => PAD_T + plotH * (1 - Math.min(p / maxMag, 1));

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        Harmonic spectrum (% of fundamental, h2–h25). Orange dashes = G5/5 EHV limits.
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg)' }}>
        {/* y-axis ticks */}
        {[0, maxMag/4, maxMag/2, 3*maxMag/4, maxMag].map((v, i) => {
          const y = yForPct(v);
          return (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="var(--color-border)" strokeOpacity={0.3} />
              <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize={8} fill="var(--color-text-muted)">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* G5/5 limit markers */}
        {Object.entries(G5_5_VOLTAGE_LIMITS_HV).map(([o, lim]) => {
          const order = Number(o);
          if (order < 2 || order > maxOrder) return null;
          const x = xForOrder(order);
          const y = yForPct(lim);
          return (
            <line key={order}
              x1={x - 8} x2={x + 8} y1={y} y2={y}
              stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 2"
            />
          );
        })}

        {/* Bars */}
        {components.map(c => {
          const x = xForOrder(c.order);
          const pct = c.magnitude * 100;
          const limit = G5_5_VOLTAGE_LIMITS_HV[c.order];
          const exceeds = limit !== undefined && pct > limit;
          const y = yForPct(pct);
          return (
            <g key={c.order}>
              <rect
                x={x - 5}
                y={y}
                width={10}
                height={Math.max(0, PAD_T + plotH - y)}
                fill={exceeds ? '#ef4444' : '#2563eb'}
                fillOpacity={0.85}
              >
                <title>h{c.order}: {pct.toFixed(2)}% {limit ? `(limit ${limit}%)` : ''}</title>
              </rect>
              <text x={x} y={H - 8} textAnchor="middle" fontSize={7} fill="var(--color-text-muted)">
                {c.order}
              </text>
            </g>
          );
        })}
        <text x={W/2} y={H - 1} textAnchor="middle" fontSize={8} fill="var(--color-text-muted)">Harmonic order</text>
      </svg>
    </div>
  );
}

function THDPanel({ thdPercent }: { thdPercent: number }) {
  const exceeds = thdPercent > G5_5_THD_LIMIT_HV;
  return (
    <div style={{
      border: `1px solid ${exceeds ? '#ef4444' : 'var(--color-border)'}`,
      borderRadius: 4, padding: '8px 12px',
      background: exceeds ? 'rgba(239,68,68,0.06)' : 'var(--color-bg)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>THDv</span>
        <span style={{
          marginLeft: 8, fontSize: '1.1rem', fontWeight: 600,
          color: exceeds ? '#ef4444' : 'var(--color-text)',
        }}>
          {thdPercent.toFixed(2)}%
        </span>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
        G5/5 EHV limit: {G5_5_THD_LIMIT_HV}% — {exceeds ? 'EXCEEDS' : 'within limit'}
      </div>
    </div>
  );
}

function btnStyle(kind?: 'export'): React.CSSProperties {
  return {
    background: kind === 'export' ? 'transparent' : 'var(--color-bg-grid)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 3, padding: '3px 8px', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
  };
}
