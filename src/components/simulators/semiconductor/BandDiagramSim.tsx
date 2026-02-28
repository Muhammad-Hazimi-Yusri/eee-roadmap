// src/components/simulators/semiconductor/BandDiagramSim.tsx
// Band diagram simulation: PN junction, MOS capacitor, and MOSFET channel modes.
// Renders Ec, Ev, Ef, Ei bands using solvePoisson1D for potential profile.
// Hydration: client:visible

import { useState, useMemo } from 'react';
import {
  q, eps0, epsSi,
  intrinsicConcentration, thermalVoltage,
} from '../../../lib/semiconductor/carrier-stats.js';
import { solvePoisson1D } from '../../../lib/semiconductor/poisson-solver.js';

type Mode = 'pn-junction' | 'mos-cap' | 'mosfet';


const N  = 80;         // grid points

// ─── Compute band diagrams ────────────────────────────────────────────────────

function computePNJunction(Vbias: number) {
  const T = 300;
  const ni = intrinsicConcentration(T);
  const Na = 1e16; const Nd = 1e16;
  const Vt = thermalVoltage(T);
  const eps = eps0 * epsSi;

  const Vbi = Vt * Math.log((Na * Nd) / (ni * ni));
  const Veff = Math.max(Vbi - Vbias, 0.01);
  const xn = Math.sqrt((2 * eps * Veff) / q * Na / (Nd * (Na + Nd)));
  const xp = xn * Nd / Na;
  const L = (xn + xp) * 3;

  const xGrid: number[] = Array.from({ length: N }, (_, i) => (i / (N - 1)) * L);
  const jPos = xp;

  const chargeDensity = xGrid.map(x => {
    if (x < jPos) return -q * Na / eps; // p-side (normalised for solver)
    return q * Nd / eps;                // n-side
  });

  const result = solvePoisson1D({ xGrid, chargeDensity, eps: 1, bcLeft: 0, bcRight: Veff });

  // Ef reference: p-side = 0 eV (quasi-Fermi level for holes at x=0)
  const EfP = 0;
  const EfN = -Vbias; // applied bias splits quasi-Fermi levels

  return { xGrid, potential: result.potential, EfP, EfN, Vbi };
}

function computeMOSCap(Vg: number) {
  const T = 300;
  const Na = 1e17;
  const ni = intrinsicConcentration(T);
  const Vt = thermalVoltage(T);
  const eps = eps0 * epsSi;
  const tox = 5e-9; // 5 nm gate oxide

  const phiF = Vt * Math.log(Na / ni); // Fermi potential
  const Vfb  = -phiF;                  // flat-band voltage (simplified)
  const Vg_eff = Vg - Vfb;

  // Depletion approximation
  const Vdep = Math.max(0, Vg_eff - 2 * phiF);
  const xdMax = Math.sqrt((2 * eps * 2 * phiF) / (q * Na));
  const xd = Vg_eff > 0 ? Math.min(Math.sqrt(2 * eps * Math.abs(Vg_eff) / (q * Na)), xdMax * 1.5) : 0;

  const L = xdMax * 4;
  const xGrid: number[] = Array.from({ length: N }, (_, i) => (i / (N - 1)) * L);

  const chargeDensity = xGrid.map(x => {
    if (x < xd) return -q * Na / eps;
    return 0;
  });

  const result = solvePoisson1D({ xGrid, chargeDensity, eps: 1, bcLeft: Vg_eff * 0.8, bcRight: 0 });

  void tox; void Vdep; void Vg_eff;
  return { xGrid, potential: result.potential, Ef: 0, phiF };
}

function computeMOSFET(Vgs: number) {
  return computeMOSCap(Vgs);
}

// ─── SVG Band diagram renderer ────────────────────────────────────────────────

function renderBands(
  xGrid: number[],
  potential: number[],
  Ef: number | { EfP: number; EfN: number },
  mode: Mode,
): string {
  const W = 340; const H = 180;
  const pad = { top: 12, right: 20, bottom: 18, left: 20 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const N2 = xGrid.length;
  const xMax = xGrid[N2 - 1];
  const toX = (x: number) => pad.left + (x / xMax) * cW;

  // Normalise potential to energy [eV] from reference
  const pMax = Math.max(...potential.map(Math.abs), 0.01);
  const toE = (psi: number) => psi / pMax; // normalised [-1, 1]
  const toY = (e: number) => pad.top + (0.5 - e * 0.42) * cH;

  // Ec = -q*ψ + Eg/2 (normalised), Ev = Ec - Eg
  const EcPts = potential.map((psi, i) => `${toX(xGrid[i]).toFixed(1)},${toY(toE(-psi) + 0.3).toFixed(1)}`);
  const EvPts = potential.map((psi, i) => `${toX(xGrid[i]).toFixed(1)},${toY(toE(-psi) - 0.3).toFixed(1)}`);
  const EiPts = potential.map((psi, i) => `${toX(xGrid[i]).toFixed(1)},${toY(toE(-psi)).toFixed(1)}`);

  let svg = '';

  // Bands
  svg += `<polyline points="${EcPts.join(' ')}" fill="none" stroke="#4488ff" stroke-width="1.8"/>`;
  svg += `<polyline points="${EvPts.join(' ')}" fill="none" stroke="#ff6644" stroke-width="1.8"/>`;
  svg += `<polyline points="${EiPts.join(' ')}" fill="none" stroke="#888" stroke-width="1" stroke-dasharray="4,2"/>`;

  // Fermi level(s)
  if (typeof Ef === 'number') {
    const efY = toY(Ef).toFixed(1);
    svg += `<line x1="${pad.left}" y1="${efY}" x2="${pad.left + cW}" y2="${efY}" stroke="#70e870" stroke-width="1.2" stroke-dasharray="6,3"/>`;
    svg += `<text x="${pad.left + cW + 2}" y="${(parseFloat(efY) + 4).toFixed(0)}" font-family="monospace" font-size="7" fill="#70e870">Ef</text>`;
  } else {
    const efPY = toY(Ef.EfP).toFixed(1);
    const efNY = toY(Ef.EfN).toFixed(1);
    const mid = Math.floor(N2 / 2);
    svg += `<line x1="${pad.left}" y1="${efPY}" x2="${toX(xGrid[mid])}" y2="${efPY}" stroke="#70e870" stroke-width="1.2" stroke-dasharray="6,3"/>`;
    svg += `<line x1="${toX(xGrid[mid])}" y1="${efNY}" x2="${pad.left + cW}" y2="${efNY}" stroke="#e8e870" stroke-width="1.2" stroke-dasharray="6,3"/>`;
    svg += `<text x="${pad.left + 2}" y="${(parseFloat(efPY) - 2).toFixed(0)}" font-family="monospace" font-size="7" fill="#70e870">EFp</text>`;
    svg += `<text x="${pad.left + cW - 20}" y="${(parseFloat(efNY) - 2).toFixed(0)}" font-family="monospace" font-size="7" fill="#e8e870">EFn</text>`;
  }

  // Labels
  svg += `<text x="${pad.left + 4}" y="${pad.top + 10}" font-family="monospace" font-size="8" fill="#4488ff">Ec</text>`;
  svg += `<text x="${pad.left + 4}" y="${pad.top + cH - 4}" font-family="monospace" font-size="8" fill="#ff6644">Ev</text>`;
  svg += `<text x="${pad.left + 4}" y="${toY(0) - 2}" font-family="monospace" font-size="7" fill="#666">Ei</text>`;

  // Mode label
  const modeLabel: Record<Mode, string> = { 'pn-junction': 'PN Junction', 'mos-cap': 'MOS Capacitor', 'mosfet': 'MOSFET Channel' };
  svg += `<text x="${pad.left + cW/2}" y="${H - 4}" font-family="monospace" font-size="8" fill="#555" text-anchor="middle">${modeLabel[mode]}</text>`;

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">${svg}</svg>`;
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function Slider({ label, id, min, max, step, value, onChange, unit }: {
  label: string; id: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; unit: string;
}) {
  return (
    <div style={{ marginBottom: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
        <label htmlFor={id}>{label}</label>
        <span style={{ color: 'var(--color-text)' }}>{value.toFixed(2)} {unit}</span>
      </div>
      <input type="range" id={id} min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--color-copper)' }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BandDiagramSim() {
  const [mode, setMode] = useState<Mode>('pn-junction');
  const [Vbias, setVbias] = useState(0);
  const [Vg, setVg] = useState(0);

  const { xGrid, potential, Ef } = useMemo(() => {
    if (mode === 'pn-junction') {
      const r = computePNJunction(Vbias);
      return { xGrid: r.xGrid, potential: r.potential, Ef: { EfP: r.EfP, EfN: r.EfN } };
    }
    if (mode === 'mos-cap') {
      const r = computeMOSCap(Vg);
      return { xGrid: r.xGrid, potential: r.potential, Ef: r.Ef };
    }
    const r = computeMOSFET(Vg);
    return { xGrid: r.xGrid, potential: r.potential, Ef: r.Ef };
  }, [mode, Vbias, Vg]);

  const svg = useMemo(() => renderBands(xGrid, potential, Ef, mode), [xGrid, potential, Ef, mode]);

  const MODES: Mode[] = ['pn-junction', 'mos-cap', 'mosfet'];
  const modeLabel: Record<Mode, string> = { 'pn-junction': 'PN Junction', 'mos-cap': 'MOS Cap.', 'mosfet': 'MOSFET' };

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.25rem 0.7rem', borderRadius: '3px',
            border: mode === m ? '1px solid var(--color-copper)' : '1px solid var(--color-border)',
            background: mode === m ? 'color-mix(in srgb, var(--color-copper) 12%, transparent)' : 'var(--color-bg)',
            color: mode === m ? 'var(--color-copper)' : 'var(--color-text-muted)', cursor: 'pointer',
          }}>{modeLabel[m]}</button>
        ))}
      </div>

      {/* Controls */}
      {mode === 'pn-junction' && (
        <Slider label="Applied bias" id="vbias" min={-1} max={0.6} step={0.01} value={Vbias} onChange={setVbias} unit="V" />
      )}
      {(mode === 'mos-cap' || mode === 'mosfet') && (
        <Slider label="Gate voltage Vg" id="vg" min={-2} max={3} step={0.05} value={Vg} onChange={setVg} unit="V" />
      )}

      {/* Band diagram */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: '3px', overflow: 'hidden', margin: '0.75rem 0' }}
        dangerouslySetInnerHTML={{ __html: svg }} />

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem' }}>
        <span style={{ color: '#4488ff' }}>— Ec (conduction band)</span>
        <span style={{ color: '#ff6644' }}>— Ev (valence band)</span>
        <span style={{ color: '#888' }}>- - Ei (intrinsic level)</span>
        <span style={{ color: '#70e870' }}>- - Ef (Fermi level)</span>
      </div>
    </div>
  );
}
