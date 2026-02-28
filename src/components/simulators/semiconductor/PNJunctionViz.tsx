// src/components/simulators/semiconductor/PNJunctionViz.tsx
// Abrupt PN junction analytical model with 4 synchronised SVG panels.
// Panels: charge density, electric field, electrostatic potential, carrier concentrations.
// Includes Shockley I-V curve with operating point.
// Hydration: client:visible

import { useState, useMemo } from 'react';
import {
  q, eps0, epsSi,
  intrinsicConcentration, thermalVoltage,
  electronMobility, holeMobility,
} from '../../../lib/semiconductor/carrier-stats.js';

// ─── Physics ──────────────────────────────────────────────────────────────────

function computeJunction(Na: number, Nd: number, Vbias: number, T: number) {
  const ni  = intrinsicConcentration(T);
  const Vt  = thermalVoltage(T);
  const eps = eps0 * epsSi;

  // Built-in potential (V)
  const Vbi = Vt * Math.log((Na * Nd) / (ni * ni));
  const Veff = Math.max(Vbi - Vbias, 0.001); // clamp: full depletion limit

  // Depletion widths (m)
  const xn = Math.sqrt((2 * eps * Veff) / q * Na / (Nd * (Na + Nd)));
  const xp = xn * Nd / Na;
  const W  = xn + xp;

  // Peak electric field (V/m)
  const Emax = (q * Nd * xn) / eps;

  // Saturation current density (A/m²) — simplified, using minority diffusion lengths
  const Dn = 0.0025 * electronMobility(Nd); // cm²/s → m²/s ÷ 100²... simplified constant
  const Dp = 0.0025 * holeMobility(Na);
  const Ln = 1e-4; // m — minority carrier diffusion length
  const Lp = 1e-4;
  const Js = q * ni * ni * (Math.sqrt(Dn) / (Nd * Ln) + Math.sqrt(Dp) / (Na * Lp));

  // Shockley current (A/m²)
  const J = Js * (Math.exp(Vbias / Vt) - 1);

  return { Vbi, Veff, xn, xp, W, Emax, Js, J, ni, Vt };
}

// ─── SVG Panel helpers ────────────────────────────────────────────────────────

function buildPanel(
  width: number,
  height: number,
  xn: number,
  xp: number,
  data: Array<[number, number]>, // [x_norm, y_norm] in [-1,1] for y
  color: string,
  yLabel: string,
  zeroY: number, // y-axis position of y=0 in [0,1]
): string {
  const pad = { top: 10, right: 8, bottom: 22, left: 44 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;

  // Map normalized coordinates to SVG pixels
  // x_norm: 0 = left edge (−xp), 1 = right edge (+xn)
  const toX = (xn_: number) => pad.left + xn_ * W;
  const toY = (yn: number) => pad.top + (0.5 - yn * 0.48) * H;
  const zY = pad.top + (1 - zeroY) * H;

  // Zero line
  let svg = `<line x1="${pad.left}" y1="${zY.toFixed(1)}" x2="${pad.left + W}" y2="${zY.toFixed(1)}" stroke="#333" stroke-width="0.8"/>`;

  // Junction position (x_norm for x=0): xp/(xp+xn)
  const total = xp + xn;
  const jX = pad.left + (xp / total) * W;
  svg += `<line x1="${jX.toFixed(1)}" y1="${pad.top}" x2="${jX.toFixed(1)}" y2="${pad.top + H}" stroke="#555" stroke-width="0.8" stroke-dasharray="3,2"/>`;

  // Depletion region shading
  const xnNorm = xn / total;
  const xpNorm = xp / total;
  const dpLeft  = pad.left + (0.5 - xpNorm * 0.5) * W;
  const dpRight = pad.left + (0.5 + xnNorm * 0.5) * W;
  // subtle background
  svg += `<rect x="${jX - (xp / total) * W}" y="${pad.top}" width="${W * (total / total)}" height="${H}" fill="#224" opacity="0.12"/>`;

  // Data path
  if (data.length > 1) {
    const pts = data.map(([x, y]) => `${toX(x).toFixed(1)},${toY(y).toFixed(1)}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8"/>`;
  }

  // Y-axis label
  svg += `<text x="10" y="${(pad.top + H / 2).toFixed(0)}" font-family="monospace" font-size="8" fill="#888" text-anchor="middle" transform="rotate(-90,10,${(pad.top + H / 2).toFixed(0)})">${yLabel}</text>`;
  // X-axis labels
  svg += `<text x="${pad.left.toFixed(0)}" y="${(pad.top + H + 14).toFixed(0)}" font-family="monospace" font-size="7" fill="#666" text-anchor="middle">−xp</text>`;
  svg += `<text x="${(pad.left + W).toFixed(0)}" y="${(pad.top + H + 14).toFixed(0)}" font-family="monospace" font-size="7" fill="#666" text-anchor="middle">+xn</text>`;

  void dpLeft; void dpRight; void xpNorm;
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">${svg}</svg>`;
}

function buildIVCurve(Js: number, Vt: number, Vbias: number): string {
  const W = 240; const H = 100;
  const pad = { top: 8, right: 8, bottom: 20, left: 36 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const vMin = -0.5; const vMax = 0.7;
  const pts: Array<[number, number]> = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const v = vMin + (i / steps) * (vMax - vMin);
    const j = Js * (Math.exp(v / Vt) - 1);
    pts.push([v, j]);
  }
  const jMax = pts[pts.length - 1][1];
  const jMin = Math.min(...pts.map(p => p[1]));

  const toX = (v: number) => pad.left + ((v - vMin) / (vMax - vMin)) * cW;
  const toY = (j: number) => pad.top + cH - ((j - jMin) / (jMax - jMin + 1e-99)) * cH;

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`).join(' ');

  // Zero axes
  const zY = toY(0).toFixed(1);
  const zX = toX(0).toFixed(1);

  const markerX = toX(Vbias).toFixed(1);
  const markerY = toY(Js * (Math.exp(Vbias / Vt) - 1)).toFixed(1);

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:240px;height:auto">
  <line x1="${pad.left}" y1="${zY}" x2="${pad.left + cW}" y2="${zY}" stroke="#333" stroke-width="0.8"/>
  <line x1="${zX}" y1="${pad.top}" x2="${zX}" y2="${pad.top + cH}" stroke="#333" stroke-width="0.8"/>
  <path d="${pathD}" fill="none" stroke="#e87050" stroke-width="1.8"/>
  <circle cx="${markerX}" cy="${markerY}" r="3.5" fill="#b87333" stroke="#f0a840" stroke-width="1.2"/>
  <text x="${pad.left + cW / 2}" y="${H - 2}" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">V (V)</text>
  <text x="${pad.left - 4}" y="${pad.top + 4}" font-family="monospace" font-size="7" fill="#888" text-anchor="end">J</text>
</svg>`;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function Slider({ label, id, min, max, step, value, onChange, fmt }: {
  label: string; id: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
        <label htmlFor={id}>{label}</label>
        <span style={{ color: 'var(--color-text)' }}>{fmt(value)}</span>
      </div>
      <input type="range" id={id} min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-copper)' }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PNJunctionViz() {
  const [logNa, setLogNa] = useState(16);  // Na = 10^logNa cm⁻³
  const [logNd, setLogNd] = useState(16);
  const [Vbias, setVbias] = useState(0);
  const T = 300;

  const { Na, Nd } = useMemo(() => ({ Na: 10 ** logNa, Nd: 10 ** logNd }), [logNa, logNd]);
  const jn = useMemo(() => computeJunction(Na, Nd, Vbias, T), [Na, Nd, Vbias]);

  // Build charge density data points (normalized x: 0=−xp, 1=+xn)
  const chargeData = useMemo((): Array<[number, number]> => {
    const { xp, xn } = jn;
    const total = xp + xn;
    if (total === 0) return [];
    // p-side: -qNa (neg), n-side: +qNd (pos)
    const maxCharge = Math.max(Na, Nd);
    return [
      [0, -Na / maxCharge],
      [xp / total - 1e-9, -Na / maxCharge],
      [xp / total, 0],
      [xp / total + 1e-9, Nd / maxCharge],
      [1, Nd / maxCharge],
    ];
  }, [jn, Na, Nd]);

  const efieldData = useMemo((): Array<[number, number]> => {
    const { xp, xn, Emax } = jn;
    const total = xp + xn;
    if (total === 0) return [];
    return [
      [0, 0],
      [xp / total, -1],
      [1, 0],
    ];
    void Emax;
  }, [jn]);

  const potentialData = useMemo((): Array<[number, number]> => {
    const { xp, xn, Vbi, Vbias: _v } = jn;
    const total = xp + xn;
    if (total === 0) return [];
    const pts: Array<[number, number]> = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const xNorm = i / N;
      const x = xNorm * total - xp;
      let psi: number;
      if (x < -xp) { psi = 0; }
      else if (x < 0) {
        const xRel = x + xp;
        psi = (q * Na) / (2 * eps0 * epsSi) * (xRel * xRel) / Vbi;
      } else if (x < xn) {
        const xRel = x - xn;
        psi = 1 - (q * Nd) / (2 * eps0 * epsSi) * (xRel * xRel) / Vbi;
      } else { psi = 1; }
      pts.push([xNorm, psi * 2 - 1]); // normalise to [-1,1]
    }
    void _v;
    return pts;
  }, [jn]);

  const ivSvg = useMemo(() => buildIVCurve(jn.Js, jn.Vt, Vbias), [jn, Vbias]);

  const chargeSvg   = buildPanel(280, 90, jn.xn, jn.xp, chargeData, '#e87050', 'ρ', 0.5);
  const efieldSvg   = buildPanel(280, 90, jn.xn, jn.xp, efieldData, '#50b8e8', 'E', 0.85);
  const potentialSvg = buildPanel(280, 90, jn.xn, jn.xp, potentialData, '#70e870', 'ψ', 0.05);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Controls */}
      <div style={{ marginBottom: '1rem' }}>
        <Slider label="Na (p-side)" id="na" min={14} max={18} step={0.1} value={logNa} onChange={setLogNa} fmt={v => `10^${v.toFixed(1)} cm⁻³`} />
        <Slider label="Nd (n-side)" id="nd" min={14} max={18} step={0.1} value={logNd} onChange={setLogNd} fmt={v => `10^${v.toFixed(1)} cm⁻³`} />
        <Slider label="Vbias" id="vbias" min={-1} max={0.65} step={0.01} value={Vbias} onChange={setVbias} fmt={v => `${v.toFixed(2)} V`} />
      </div>

      {/* Key values */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.75rem' }}>
        <span>Vbi = <strong style={{ color: 'var(--color-copper)' }}>{jn.Vbi.toFixed(3)} V</strong></span>
        <span>W = <strong style={{ color: '#50b8e8' }}>{(jn.W * 1e6).toFixed(1)} µm</strong></span>
        <span>Emax = <strong style={{ color: '#e87050' }}>{(jn.Emax / 1e6).toFixed(2)} MV/cm</strong></span>
        <span style={{ color: jn.J > 0 ? '#70e870' : '#e87050' }}>J = {Math.abs(jn.J) < 1e-3 ? jn.J.toExponential(2) : jn.J.toFixed(4)} A/m²</span>
      </div>

      {/* SVG panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0 0 2px' }}>Charge density ρ(x)</p>
          <div dangerouslySetInnerHTML={{ __html: chargeSvg }} />
        </div>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0 0 2px' }}>Electric field E(x)</p>
          <div dangerouslySetInnerHTML={{ __html: efieldSvg }} />
        </div>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0 0 2px' }}>Potential ψ(x)</p>
          <div dangerouslySetInnerHTML={{ __html: potentialSvg }} />
        </div>
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0 0 2px' }}>I-V characteristic (●)</p>
          <div dangerouslySetInnerHTML={{ __html: ivSvg }} />
        </div>
      </div>

      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
        Abrupt junction model at T=300 K. Forward bias (V&gt;0) narrows depletion width; reverse bias widens it.
        I-V follows Shockley equation: J = J<sub>s</sub>(e<sup>V/Vt</sup> − 1).
      </p>
    </div>
  );
}
