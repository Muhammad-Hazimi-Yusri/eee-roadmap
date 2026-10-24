// chart-kit.tsx — small shared pieces for the field-guide React charts.
// Hand-rolled SVG like the other simulators on the site; colours come from
// the CSS variables in src/styles/field-guide.css so light/dark both work.

import type { ReactNode } from 'react';
import type { Jurisdiction } from '../../lib/field-guide/curves';

export const TONE: Record<Jurisdiction, string> = {
  GB: 'var(--fg-gb)',
  IE: 'var(--fg-ie)',
  NI: 'var(--fg-ni)',
  RfG: 'var(--fg-eu)',
};

export interface Frame {
  W: number; H: number;
  L: number; R: number; T: number; B: number;
  x0: number; x1: number; y0: number; y1: number;
}

export function scales(f: Frame) {
  const pw = f.W - f.L - f.R;
  const ph = f.H - f.T - f.B;
  const x = (v: number) => f.L + ((v - f.x0) / (f.x1 - f.x0)) * pw;
  const y = (v: number) => f.T + ph * (1 - (v - f.y0) / (f.y1 - f.y0));
  return { x, y, pw, ph };
}

export function polyline(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export function Axes({ f, xTicks, yTicks, xLabel, yLabel, xFmt = String, yFmt = String }: {
  f: Frame; xTicks: number[]; yTicks: number[]; xLabel: string; yLabel: string;
  xFmt?: (v: number) => string; yFmt?: (v: number) => string;
}) {
  const { x, y } = scales(f);
  return (
    <g fontSize={11}>
      {yTicks.map(v => (
        <g key={`y${v}`}>
          <line x1={f.L} x2={f.W - f.R} y1={y(v)} y2={y(v)} stroke="var(--color-border)" strokeOpacity={0.35} />
          <text x={f.L - 5} y={y(v) + 3} textAnchor="end" fill="var(--color-text-muted)">{yFmt(v)}</text>
        </g>
      ))}
      {xTicks.map(v => (
        <g key={`x${v}`}>
          <line x1={x(v)} x2={x(v)} y1={f.T} y2={f.H - f.B} stroke="var(--color-border)" strokeOpacity={0.2} />
          <text x={x(v)} y={f.H - f.B + 13} textAnchor="middle" fill="var(--color-text-muted)">{xFmt(v)}</text>
        </g>
      ))}
      <line x1={f.L} x2={f.W - f.R} y1={f.H - f.B} y2={f.H - f.B} stroke="var(--color-text-muted)" />
      <line x1={f.L} x2={f.L} y1={f.T} y2={f.H - f.B} stroke="var(--color-text-muted)" />
      <text x={(f.L + f.W - f.R) / 2} y={f.H - 4} textAnchor="middle" fill="var(--color-text-muted)">{xLabel}</text>
      <text x={11} y={(f.T + f.H - f.B) / 2} textAnchor="middle" fill="var(--color-text-muted)"
        transform={`rotate(-90 11 ${(f.T + f.H - f.B) / 2})`}>{yLabel}</text>
    </g>
  );
}

export function ChartBox({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} style={{
      border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', padding: 4,
    }}>
      {children}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, fmt = (v: number) => v.toFixed(2), hint }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt?: (v: number) => string; hint?: string;
}) {
  return (
    <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{label}</span>
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{fmt(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} style={{ width: '100%' }} />
      {hint && <span style={{ display: 'block', fontSize: '0.64rem' }}>{hint}</span>}
    </label>
  );
}

export function Toggle({ options, value, onChange, label }: {
  options: { id: string; label: string }[]; value: string; onChange: (id: string) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={value === o.id}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '3px 9px', cursor: 'pointer',
            borderRadius: 3, border: '1px solid var(--color-border)',
            background: value === o.id ? 'var(--color-text)' : 'transparent',
            color: value === o.id ? 'var(--color-bg)' : 'var(--color-text)',
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const panelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
};

export const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14,
};
