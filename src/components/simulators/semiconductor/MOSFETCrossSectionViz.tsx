// src/components/simulators/semiconductor/MOSFETCrossSectionViz.tsx
// Interactive MOSFET cross-section with Vgs/Vds sliders.
// Shows: inversion layer, depletion boundary, pinch-off point.
// Includes Id-Vds family of curves.
// Hydration: client:visible

import { useState, useMemo } from 'react';

const VTH = 1.0;  // V — threshold voltage
const KN  = 1.5;  // mA/V² — process transconductance (simplified)

// ─── MOSFET I-V Model (long-channel NMOS) ────────────────────────────────────

function mosfetId(Vgs: number, Vds: number): number {
  if (Vgs < VTH) return 0; // cutoff
  const Vov = Vgs - VTH;
  if (Vds < Vov) {
    // Linear (triode)
    return KN * ((Vov * Vds) - (Vds * Vds) / 2);
  }
  // Saturation
  return (KN / 2) * Vov * Vov;
}

function region(Vgs: number, Vds: number): string {
  if (Vgs < VTH) return 'CUTOFF';
  const Vov = Vgs - VTH;
  if (Vds < Vov) return 'LINEAR';
  return 'SATURATION';
}

// ─── SVG Cross-section ────────────────────────────────────────────────────────

function buildCrossSection(Vgs: number, Vds: number): string {
  const W = 320; const H = 200;
  const inversion = Vgs > VTH;
  const Vov = Math.max(Vgs - VTH, 0);
  // Pinch-off location (fraction of channel from source)
  const pinchOff = Vds >= Vov && inversion;

  let svg = '';

  // P-substrate
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#2a2a3a"/>`;
  svg += `<text x="${W/2}" y="${H-8}" font-family="monospace" font-size="9" fill="#6668" text-anchor="middle">p-substrate</text>`;

  // Gate oxide
  const gateTop = 60; const gateH = 12; const gateL = 80; const gateW = W - 160;
  svg += `<rect x="${gateL}" y="${gateTop}" width="${gateW}" height="${gateH}" fill="#e8e070" opacity="0.9"/>`;
  svg += `<text x="${gateL + gateW/2}" y="${gateTop + gateH - 2}" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">SiO₂</text>`;

  // Poly gate
  svg += `<rect x="${gateL}" y="${gateTop - 22}" width="${gateW}" height="22" fill="#3a3a5a" stroke="#5555aa" stroke-width="1"/>`;
  svg += `<text x="${gateL + gateW/2}" y="${gateTop - 8}" font-family="monospace" font-size="9" fill="#aab" text-anchor="middle">Gate (poly)</text>`;
  svg += `<text x="${gateL + gateW/2}" y="${gateTop - 1}" font-family="monospace" font-size="8" fill="#88a" text-anchor="middle">Vgs = ${Vgs.toFixed(1)} V</text>`;

  // n+ source
  svg += `<rect x="20" y="${gateTop}" width="54" height="40" fill="#1a3a6a" rx="2"/>`;
  svg += `<text x="47" y="${gateTop + 14}" font-family="monospace" font-size="8" fill="#8af" text-anchor="middle">n+</text>`;
  svg += `<text x="47" y="${gateTop + 26}" font-family="monospace" font-size="8" fill="#6af" text-anchor="middle">Source</text>`;
  svg += `<text x="47" y="${gateTop + 36}" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">0 V</text>`;

  // n+ drain
  svg += `<rect x="${W-74}" y="${gateTop}" width="54" height="40" fill="#1a3a6a" rx="2"/>`;
  svg += `<text x="${W-47}" y="${gateTop + 14}" font-family="monospace" font-size="8" fill="#8af" text-anchor="middle">n+</text>`;
  svg += `<text x="${W-47}" y="${gateTop + 26}" font-family="monospace" font-size="8" fill="#6af" text-anchor="middle">Drain</text>`;
  svg += `<text x="${W-47}" y="${gateTop + 36}" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">${Vds.toFixed(1)} V</text>`;

  // Depletion region (dashed boundary)
  const deplH = inversion ? Math.min(30 + Vov * 8, 55) : 0;
  if (inversion) {
    svg += `<rect x="${gateL}" y="${gateTop + gateH}" width="${gateW}" height="${deplH}" fill="#4488ff" opacity="0.06"/>`;
    svg += `<line x1="${gateL}" y1="${gateTop + gateH + deplH}" x2="${gateL + gateW}" y2="${gateTop + gateH + deplH}" stroke="#4488ff" stroke-width="1" stroke-dasharray="3,2" opacity="0.5"/>`;
  }

  // Inversion layer
  if (inversion) {
    const invH = 6;
    // If pinch-off: inversion layer narrows to zero near drain
    if (pinchOff) {
      // Tapered channel
      const pinchX = gateL + gateW * Math.min(Vov / Math.max(Vds, 0.01), 1.0);
      svg += `<polygon points="${gateL},${gateTop+gateH} ${pinchX},${gateTop+gateH} ${pinchX},${gateTop+gateH+invH} ${gateL},${gateTop+gateH+invH}" fill="#40e870" opacity="0.7"/>`;
      // Pinch-off marker
      svg += `<circle cx="${pinchX.toFixed(1)}" cy="${gateTop+gateH+invH/2}" r="4" fill="none" stroke="#f0e040" stroke-width="1.5"/>`;
      svg += `<text x="${pinchX.toFixed(1)}" y="${gateTop+gateH+invH+14}" font-family="monospace" font-size="7" fill="#f0e040" text-anchor="middle">pinch-off</text>`;
    } else {
      svg += `<rect x="${gateL}" y="${gateTop+gateH}" width="${gateW}" height="${invH}" fill="#40e870" opacity="0.75"/>`;
    }
  }

  // Body contact
  svg += `<line x1="${W/2}" y1="${H-30}" x2="${W/2}" y2="${H-15}" stroke="#888" stroke-width="1.5"/>`;
  svg += `<text x="${W/2}" y="${H-6}" font-family="monospace" font-size="8" fill="#666" text-anchor="middle">Body (0V)</text>`;

  // Vth reference line on gate
  const vthFrac = VTH / 3.5;
  svg += `<line x1="${gateL + gateW * vthFrac}" y1="${gateTop - 22}" x2="${gateL + gateW * vthFrac}" y2="${gateTop}" stroke="#f04040" stroke-width="0.8" stroke-dasharray="2,2"/>`;
  svg += `<text x="${(gateL + gateW * vthFrac + 2).toFixed(0)}" y="${gateTop - 14}" font-family="monospace" font-size="7" fill="#f04040">Vth=${VTH}V</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">${svg}</svg>`;
}

// ─── Id-Vds family of curves ──────────────────────────────────────────────────

function buildIdVds(Vgs: number, Vds: number): string {
  const W = 280; const H = 130;
  const pad = { top: 8, right: 10, bottom: 22, left: 40 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const vdsMax = 3.0;
  const vgsValues = [1.5, 2.0, 2.5, 3.0];
  const idMax = mosfetId(3.0, vdsMax) * 1.1;

  const toX = (v: number) => pad.left + (v / vdsMax) * cW;
  const toY = (i: number) => pad.top + cH - (i / idMax) * cH;

  const colors = ['#4488cc', '#44aacc', '#44ccaa', '#80e870'];
  let svg = '';

  // Grid
  svg += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top+cH}" stroke="#333" stroke-width="0.8"/>`;
  svg += `<line x1="${pad.left}" y1="${pad.top+cH}" x2="${pad.left+cW}" y2="${pad.top+cH}" stroke="#333" stroke-width="0.8"/>`;

  for (let vi = 0; vi < vgsValues.length; vi++) {
    const vg = vgsValues[vi];
    const steps = 60;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const vd = (i / steps) * vdsMax;
      const id = mosfetId(vg, vd);
      pts.push(`${toX(vd).toFixed(1)},${toY(id).toFixed(1)}`);
    }
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${colors[vi]}" stroke-width="1.4"/>`;
    // Saturation boundary marker
    const Vov = Math.max(vg - VTH, 0);
    if (Vov > 0) {
      const satX = toX(Vov);
      const satY = toY(mosfetId(vg, Vov));
      svg += `<circle cx="${satX.toFixed(1)}" cy="${satY.toFixed(1)}" r="2" fill="${colors[vi]}"/>`;
    }
    // Label
    svg += `<text x="${pad.left + cW + 2}" y="${(toY(mosfetId(vg, vdsMax)) + 4).toFixed(1)}" font-family="monospace" font-size="7" fill="${colors[vi]}">${vg}V</text>`;
  }

  // Saturation boundary dashed line
  const satPts: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const vov = (i / 30) * 2.5;
    const id = mosfetId(vov + VTH, vov);
    if (id <= idMax) satPts.push(`${toX(vov).toFixed(1)},${toY(id).toFixed(1)}`);
  }
  if (satPts.length > 1) svg += `<polyline points="${satPts.join(' ')}" fill="none" stroke="#888" stroke-width="0.8" stroke-dasharray="3,2"/>`;

  // Operating point
  const opX = toX(Vds);
  const opY = toY(mosfetId(Vgs, Vds));
  svg += `<circle cx="${opX.toFixed(1)}" cy="${opY.toFixed(1)}" r="4" fill="#b87333" stroke="#f0a840" stroke-width="1.5"/>`;

  svg += `<text x="${pad.left + cW/2}" y="${H-2}" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">Vds (V)</text>`;
  svg += `<text x="8" y="${pad.top + cH/2}" font-family="monospace" font-size="7" fill="#888" text-anchor="middle" transform="rotate(-90,8,${pad.top+cH/2})">Id (mA)</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">${svg}</svg>`;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function Slider({ label, id, min, max, step, value, onChange }: {
  label: string; id: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
        <label htmlFor={id}>{label}</label>
        <span style={{ color: 'var(--color-text)' }}>{value.toFixed(2)} V</span>
      </div>
      <input type="range" id={id} min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-copper)' }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MOSFETCrossSectionViz() {
  const [Vgs, setVgs] = useState(1.5);
  const [Vds, setVds] = useState(0.5);

  const Id = useMemo(() => mosfetId(Vgs, Vds), [Vgs, Vds]);
  const reg = useMemo(() => region(Vgs, Vds), [Vgs, Vds]);
  const crossSvg = useMemo(() => buildCrossSection(Vgs, Vds), [Vgs, Vds]);
  const ivSvg    = useMemo(() => buildIdVds(Vgs, Vds), [Vgs, Vds]);

  const regionColor: Record<string, string> = {
    CUTOFF: '#888',
    LINEAR: '#50b8e8',
    SATURATION: '#70e870',
  };

  const regionEquation: Record<string, string> = {
    CUTOFF: 'Id = 0  (Vgs < Vth)',
    LINEAR: `Id = kn·[(Vgs−Vth)·Vds − Vds²/2] = ${Id.toFixed(3)} mA`,
    SATURATION: `Id = (kn/2)·(Vgs−Vth)² = ${Id.toFixed(3)} mA`,
  };

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Controls */}
      <div style={{ marginBottom: '0.75rem' }}>
        <Slider label="Vgs" id="vgs" min={0} max={3} step={0.05} value={Vgs} onChange={setVgs} />
        <Slider label="Vds" id="vds" min={0} max={3} step={0.05} value={Vds} onChange={setVds} />
      </div>

      {/* Region badge */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: regionColor[reg], letterSpacing: '0.1em' }}>{reg}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{regionEquation[reg]}</span>
      </div>

      {/* Cross section */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}
        dangerouslySetInnerHTML={{ __html: crossSvg }} />

      {/* I-V curves */}
      <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>Id–Vds family (Vgs = 1.5/2.0/2.5/3.0 V) — operating point ●</p>
      <div dangerouslySetInnerHTML={{ __html: ivSvg }} />

      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginTop: '0.5rem', marginBottom: 0 }}>
        Vth = {VTH} V. Green layer = inversion channel. Dashed curve = saturation boundary (Vds = Vgs−Vth).
      </p>
    </div>
  );
}
