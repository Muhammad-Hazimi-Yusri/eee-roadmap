// src/components/simulators/pcb/ImpedanceCalculator.tsx
// Real-time microstrip / stripline impedance calculator.
// Uses Wheeler (1977) and Schneider formulas from lib/impedance/.
// Hydration: client:idle

import { useState, useCallback } from 'react';
import { microstripZ0 } from '../../../lib/impedance/microstrip.js';
import { striplineZ0 } from '../../../lib/impedance/stripline.js';

type Mode = 'microstrip' | 'stripline';

interface State {
  mode: Mode;
  er: number;
  w: number;   // mm
  h: number;   // mm
  t: number;   // µm → converted to mm internally
  b: number;   // mm (stripline: total dielectric height)
}

const DEFAULTS: State = {
  mode: 'microstrip',
  er: 4.4,
  w: 3.0,
  h: 1.6,
  t: 35,
  b: 3.2,
};

// Build a mini Z0-vs-W/H SVG chart (no chart library)
function buildChart(
  mode: Mode,
  params: State,
  z0: number | null
): string {
  const pts: Array<[number, number]> = [];
  const wMin = 0.1;
  const wMax = 6;
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const w = wMin + (i / steps) * (wMax - wMin);
    const res =
      mode === 'microstrip'
        ? microstripZ0({ w: w * 1e-3, h: params.h * 1e-3, t: params.t * 1e-6, er: params.er })
        : striplineZ0({ w: w * 1e-3, b: params.b * 1e-3, t: params.t * 1e-6, er: params.er });
    if (res) pts.push([w, res.z0]);
  }

  if (pts.length < 2) return '';

  const svgW = 280;
  const svgH = 120;
  const pad = { top: 8, right: 8, bottom: 24, left: 36 };
  const chartW = svgW - pad.left - pad.right;
  const chartH = svgH - pad.top - pad.bottom;

  const z0s = pts.map(p => p[1]);
  const zMin = Math.max(0, Math.min(...z0s) - 5);
  const zMax = Math.max(...z0s) + 5;

  const toX = (w: number) => pad.left + ((w - wMin) / (wMax - wMin)) * chartW;
  const toY = (z: number) => pad.top + chartH - ((z - zMin) / (zMax - zMin)) * chartH;

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`).join(' ');

  // Operating point marker
  let marker = '';
  if (z0 !== null) {
    const mx = toX(params.w);
    const my = toY(z0);
    marker = `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="4" fill="#b87333" stroke="#f0a840" stroke-width="1.5"/>`;
  }

  // Axis ticks
  const yTicks = [25, 50, 75, 100].filter(v => v >= zMin && v <= zMax);
  const yTickLines = yTicks
    .map(v => {
      const y = toY(v).toFixed(1);
      return `<line x1="${pad.left}" y1="${y}" x2="${pad.left + chartW}" y2="${y}" stroke="#333" stroke-width="0.5" stroke-dasharray="3,3"/>
<text x="${pad.left - 4}" y="${(parseFloat(y) + 4).toFixed(1)}" class="ct">${v}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
  <style>.ct{font:8px monospace;fill:#888;text-anchor:end}.ca{font:8px monospace;fill:#888;text-anchor:middle}</style>
  ${yTickLines}
  <path d="${pathD}" fill="none" stroke="#4a9eff" stroke-width="1.5"/>
  ${marker}
  <text x="${pad.left + chartW / 2}" y="${svgH - 2}" class="ca">W (mm)</text>
</svg>`;
}

export default function ImpedanceCalculator() {
  const [s, setS] = useState<State>(DEFAULTS);

  const update = useCallback(<K extends keyof State>(key: K, val: State[K]) => {
    setS(prev => ({ ...prev, [key]: val }));
  }, []);

  const result =
    s.mode === 'microstrip'
      ? microstripZ0({ w: s.w * 1e-3, h: s.h * 1e-3, t: s.t * 1e-6, er: s.er })
      : striplineZ0({ w: s.w * 1e-3, b: s.b * 1e-3, t: s.t * 1e-6, er: s.er });

  const z0 = result?.z0 ?? null;
  const erEff = result && 'erEff' in result ? result.erEff : null;
  const chart = buildChart(s.mode, s, z0);

  const isWarning = s.mode === 'microstrip' && (s.w / s.h < 0.05 || s.w / s.h > 20);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['microstrip', 'stripline'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => update('mode', m)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              textTransform: 'capitalize',
              padding: '0.3rem 0.8rem',
              borderRadius: '3px',
              border: s.mode === m ? '1px solid var(--color-copper)' : '1px solid var(--color-border)',
              background: s.mode === m ? 'color-mix(in srgb, var(--color-copper) 12%, transparent)' : 'var(--color-bg)',
              color: s.mode === m ? 'var(--color-copper)' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
        {/* Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Slider label="εr (dielectric constant)" id="er" min={1} max={16} step={0.05} value={s.er} onChange={v => update('er', v)} unit="" />
          <Slider label="W — trace width" id="w" min={0.1} max={6} step={0.05} value={s.w} onChange={v => update('w', v)} unit="mm" />
          {s.mode === 'microstrip' ? (
            <Slider label="H — substrate height" id="h" min={0.1} max={3.2} step={0.05} value={s.h} onChange={v => update('h', v)} unit="mm" />
          ) : (
            <Slider label="b — total dielectric height" id="b" min={0.2} max={6.4} step={0.1} value={s.b} onChange={v => update('b', v)} unit="mm" />
          )}
          <Slider label="T — trace thickness" id="t" min={9} max={105} step={1} value={s.t} onChange={v => update('t', v)} unit="µm" />
        </div>

        {/* Z0 display + chart */}
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, color: z0 ? 'var(--color-copper)' : 'var(--color-text-muted)', lineHeight: 1 }}>
            {z0 !== null ? `${z0.toFixed(1)} Ω` : '—'}
          </div>
          {erEff !== null && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              εr,eff = {erEff.toFixed(2)}
            </div>
          )}
          {isWarning && (
            <div style={{ fontSize: '0.7rem', color: '#e8b04a', marginTop: '0.4rem', maxWidth: '180px', lineHeight: 1.4 }}>
              W/H outside Wheeler valid range (0.05–20)
            </div>
          )}
        </div>
      </div>

      {/* Z0 vs W chart */}
      <div style={{ marginTop: '1rem', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
          Z₀ (Ω) vs trace width — operating point ●
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: chart }}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Formula reference */}
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.72rem', userSelect: 'none' }}>
          Formula reference
        </summary>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)' }}>
          {s.mode === 'microstrip' ? (
            <>
              <p><strong>Wheeler (1977)</strong> — Microstrip Z₀:</p>
              <p>Wide trace (W/H ≥ 1): Z₀ = 120π / (√ε_eff · (W/H + 1.393 + 0.667·ln(W/H + 1.444)))</p>
              <p>Narrow trace (W/H &lt; 1): Z₀ = (60/√ε_eff) · ln(8H/W + W/(4H))</p>
            </>
          ) : (
            <>
              <p><strong>Schneider</strong> — Stripline Z₀:</p>
              <p>Z₀ = (60/√εr) · ln(4b / (0.67π·(0.8W + T)))</p>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

// ─── Slider sub-component ─────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
}

function Slider({ label, id, min, max, step, value, onChange, unit }: SliderProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <label htmlFor={id}>{label}</label>
        <span style={{ color: 'var(--color-text)' }}>
          <input
            type="number"
            id={`${id}-num`}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            style={{
              width: '60px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '2px',
              padding: '0.1rem 0.25rem',
              textAlign: 'right',
            }}
          />
          {unit && <span style={{ marginLeft: '0.25rem', color: 'var(--color-text-muted)' }}>{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-copper)' }}
      />
    </div>
  );
}
