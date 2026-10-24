// src/lib/field-guide/curves.ts
// Requirement curves and small formulas behind the field-guide charts.
// Every number here was read from the clause named next to it (checked
// 2026-10-24). Shapes are built from the code's own parameters rather than
// hand-traced, so a table change is a one-line edit.

export type Jurisdiction = 'GB' | 'IE' | 'NI' | 'RfG';

export interface Pt { t: number; u: number }

// ─── Fault ride-through ─────────────────────────────────────────────────────

/** The seven parameters of RfG Figure 3 (Tables 3.1/3.2, 7.1/7.2), in pu and seconds. */
export interface RfgFrtParams {
  Uret: number; tclear: number;
  Uclear: number;
  trec1: number; Urec1: number;
  trec2: number;
  Urec2: number; trec3: number;
}

/**
 * Lower-limit voltage-against-time polyline for RfG Figure 3.
 * Shape (checked against the figure): hold Uret to tclear, step to Uclear,
 * ramp to Urec1 at trec1, hold to trec2, ramp to Urec2 at trec3, then hold.
 * Equal time stamps produce vertical segments, which is how the PPM tables
 * collapse the middle of the curve.
 */
export function rfgProfile(p: RfgFrtParams, tEnd = 3.5): Pt[] {
  return [
    { t: 0, u: p.Uret },
    { t: p.tclear, u: p.Uret },
    { t: p.tclear, u: p.Uclear },
    { t: p.trec1, u: p.Urec1 },
    { t: p.trec2, u: p.Urec1 },
    { t: p.trec3, u: p.Urec2 },
    { t: Math.max(tEnd, p.trec3), u: p.Urec2 },
  ];
}

/**
 * Value of a lower-limit polyline at time t. Where segments meet (including
 * a vertical step) the highest value applies, so a voltage sitting exactly
 * on a step edge is judged against the stricter side.
 */
export function limitAt(points: Pt[], t: number): number {
  if (t < points[0].t) return points[0].u;
  if (t > points[points.length - 1].t) return points[points.length - 1].u;
  let best = -Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (t < a.t || t > b.t) continue;
    const v = b.t === a.t
      ? Math.max(a.u, b.u)
      : a.u + (b.u - a.u) * ((t - a.t) / (b.t - a.t));
    best = Math.max(best, v);
  }
  return best;
}

export interface FrtCurve {
  id: string;
  jurisdiction: Jurisdiction;
  plant: 'Synchronous' | 'PPM' | 'Synchronous condenser';
  label: string;
  /** Where the code says the voltage is measured. */
  measuredAt: string;
  clause: string;   // standards ref, e.g. grid-code/ECC.6.3.15
  pin: string;      // the table or figure inside that clause
  points: Pt[];
}

const GB_TABLES: Record<string, RfgFrtParams> = {
  // ECC.6.3.15.2 – .6 (digital Grid Code, Issue 6 Rev 46)
  syncB:      { Uret: 0.3,  tclear: 0.14, Uclear: 0.7,  trec1: 0.14, Urec1: 0.7,  trec2: 0.45, Urec2: 0.9,  trec3: 1.5 },
  syncCDlt110:{ Uret: 0.1,  tclear: 0.14, Uclear: 0.7,  trec1: 0.14, Urec1: 0.7,  trec2: 0.45, Urec2: 0.9,  trec3: 1.5 },
  syncD110:   { Uret: 0,    tclear: 0.14, Uclear: 0.25, trec1: 0.25, Urec1: 0.5,  trec2: 0.45, Urec2: 0.9,  trec3: 1.5 },
  ppmLt110:   { Uret: 0.1,  tclear: 0.14, Uclear: 0.1,  trec1: 0.14, Urec1: 0.1,  trec2: 0.14, Urec2: 0.85, trec3: 2.2 },
  ppmD110:    { Uret: 0,    tclear: 0.14, Uclear: 0,    trec1: 0.14, Urec1: 0,    trec2: 0.14, Urec2: 0.85, trec3: 2.2 },
};

/** Lower-limit curve helper for the simple "hold then ramp" shapes in the IE/NI codes. */
function holdThenRamp(u0: number, tHold: number, u1: number, tEnd: number, tMax = 3.5): Pt[] {
  return [
    { t: 0, u: u0 }, { t: tHold, u: u0 }, { t: tEnd, u: u1 }, { t: Math.max(tMax, tEnd), u: u1 },
  ];
}

/** EirGrid SCU1.4.1(g) and SONI CC.S4.1.8.1 share this stepped profile. */
const SCU_STEPS: Pt[] = [
  { t: 0, u: 0 }, { t: 0.15, u: 0 }, { t: 0.15, u: 0.5 },
  { t: 0.45, u: 0.5 }, { t: 0.45, u: 0.9 }, { t: 3.5, u: 0.9 },
];

export const FRT_CURVES: FrtCurve[] = [
  {
    id: 'gb-ppm-lt110', jurisdiction: 'GB', plant: 'PPM',
    label: 'GB PPM, Type B/C/D below 110 kV',
    measuredAt: 'Grid Entry Point / User System Entry Point',
    clause: 'grid-code/ECC.6.3.15', pin: 'Table ECC.6.3.15.5',
    points: rfgProfile(GB_TABLES.ppmLt110),
  },
  {
    id: 'gb-ppm-d110', jurisdiction: 'GB', plant: 'PPM',
    label: 'GB PPM, Type D at 110 kV+',
    measuredAt: 'Grid Entry Point / User System Entry Point',
    clause: 'grid-code/ECC.6.3.15', pin: 'Table ECC.6.3.15.6',
    points: rfgProfile(GB_TABLES.ppmD110),
  },
  {
    id: 'gb-sync-b', jurisdiction: 'GB', plant: 'Synchronous',
    label: 'GB synchronous, Type B',
    measuredAt: 'Grid Entry Point / User System Entry Point',
    clause: 'grid-code/ECC.6.3.15', pin: 'Table ECC.6.3.15.2',
    points: rfgProfile(GB_TABLES.syncB),
  },
  {
    id: 'gb-sync-cd-lt110', jurisdiction: 'GB', plant: 'Synchronous',
    label: 'GB synchronous, Type C/D below 110 kV',
    measuredAt: 'Grid Entry Point / User System Entry Point',
    clause: 'grid-code/ECC.6.3.15', pin: 'Table ECC.6.3.15.3',
    points: rfgProfile(GB_TABLES.syncCDlt110),
  },
  {
    id: 'gb-sync-d110', jurisdiction: 'GB', plant: 'Synchronous',
    label: 'GB synchronous, Type D at 110 kV+',
    measuredAt: 'Grid Entry Point / User System Entry Point',
    clause: 'grid-code/ECC.6.3.15', pin: 'Table ECC.6.3.15.4',
    points: rfgProfile(GB_TABLES.syncD110),
  },
  {
    id: 'ie-ppm-rfg', jurisdiction: 'IE', plant: 'PPM',
    label: 'IE PPM (RfG)',
    measuredAt: 'Connection Point',
    clause: 'eirgrid-grid-code/PPM1.4.2', pin: 'PPM1.4.2(f), Figure PPM1.4.2',
    points: holdThenRamp(0, 0.15, 0.85, 2.9),
  },
  {
    id: 'ie-ppm-nonrfg', jurisdiction: 'IE', plant: 'PPM',
    label: 'IE PPM (non-RfG)',
    measuredAt: 'HV terminals of the grid-connected transformer',
    clause: 'eirgrid-grid-code/PPM1.4.1', pin: 'Figure PPM1.4.1',
    points: holdThenRamp(0.15, 0.625, 0.9, 3.0),
  },
  {
    id: 'ni-ppm-rfg', jurisdiction: 'NI', plant: 'PPM',
    label: 'NI PPM (RfG)',
    measuredAt: 'Connection Point',
    clause: 'soni-grid-code/CC.S2.1.4', pin: 'CC.S2.1.4 profile',
    points: holdThenRamp(0, 0.15, 0.85, 2.9),
  },
  {
    id: 'ni-ppm-nonrfg', jurisdiction: 'NI', plant: 'PPM',
    label: 'NI PPM (non-RfG)',
    measuredAt: 'PPM Connection Point',
    clause: 'soni-grid-code/CC.S2.1.3.9', pin: 'CC.S2.1.3.9(a)',
    points: holdThenRamp(0.15, 0.625, 0.9, 3.0),
  },
  {
    id: 'ie-scu', jurisdiction: 'IE', plant: 'Synchronous condenser',
    label: 'IE synchronous condenser',
    measuredAt: 'Connection Point',
    clause: 'eirgrid-grid-code/SCU1.4.1', pin: 'Figure SCU1.4.1',
    points: SCU_STEPS,
  },
  {
    id: 'ni-scu', jurisdiction: 'NI', plant: 'Synchronous condenser',
    label: 'NI synchronous condenser',
    measuredAt: 'Connection Point',
    clause: 'soni-grid-code/CC.S4.1.8.1', pin: 'CC.S4.1.8.1 profile',
    points: SCU_STEPS,
  },
];

/** A simple dip shape for "would this fault have to be ridden through?" checks. */
export interface Dip {
  retained: number;   // pu during the fault
  duration: number;   // s, fault clearance time
  recovery: number;   // s to ramp from `retained` back to `final` after clearance
  final: number;      // pu after recovery
}

export function dipVoltageAt(d: Dip, t: number): number {
  if (t < 0) return 1;
  if (t <= d.duration) return d.retained;
  if (d.recovery <= 0 || t >= d.duration + d.recovery) return d.final;
  return d.retained + (d.final - d.retained) * ((t - d.duration) / d.recovery);
}

/**
 * True when the dip never goes below the curve, i.e. the code requires the
 * plant to stay connected. Sampled at 1 ms plus every curve breakpoint, so
 * steps are not stepped over.
 */
export function mustRideThrough(curve: Pt[], d: Dip, tEnd = 3.5): boolean {
  const times = new Set<number>();
  for (let t = 0; t <= tEnd + 1e-9; t += 0.001) times.add(Math.round(t * 1000) / 1000);
  for (const p of curve) if (p.t <= tEnd) times.add(p.t);
  for (const t of times) {
    if (dipVoltageAt(d, t) < limitAt(curve, t) - 1e-9) return false;
  }
  return true;
}

// ─── Frequency response ─────────────────────────────────────────────────────

/**
 * Active-power change per unit of the droop base for a frequency change.
 * Droop s = (Δf/f0) / (ΔP/Pbase), so ΔP/Pbase = (Δf/f0) / s.
 * A 10% droop gives 2% per 0.1 Hz; 4% gives 5% per 0.1 Hz.
 */
export function droopResponse(deltaHz: number, droopPct: number, f0 = 50): number {
  return (deltaHz / f0) / (droopPct / 100);
}

export interface LfsmSetting {
  id: string;
  jurisdiction: Jurisdiction;
  mode: 'LFSM-O' | 'LFSM-U';
  thresholdHz: number;
  droopPct: number;          // default or fixed value
  droopRange?: [number, number];
  clause: string;
  pin: string;
}

export const LFSM_SETTINGS: LfsmSetting[] = [
  { id: 'gb-lfsm-o', jurisdiction: 'GB', mode: 'LFSM-O', thresholdHz: 50.4, droopPct: 10,
    clause: 'grid-code/ECC.6.3.7.1', pin: 'ECC.6.3.7.1 (50.5 Hz if already in FSM)' },
  { id: 'gb-lfsm-u', jurisdiction: 'GB', mode: 'LFSM-U', thresholdHz: 49.5, droopPct: 10,
    clause: 'grid-code/ECC.6.3.7.2', pin: 'ECC.6.3.7.2 (Type C/D)' },
  { id: 'ie-lfsm-o', jurisdiction: 'IE', mode: 'LFSM-O', thresholdHz: 50.2, droopPct: 4, droopRange: [2, 12],
    clause: 'eirgrid-grid-code/PPM1.5.3.11', pin: 'PPM1.5.3.11 (RfG PPMs)' },
  { id: 'ie-lfsm-u', jurisdiction: 'IE', mode: 'LFSM-U', thresholdHz: 49.5, droopPct: 4, droopRange: [2, 12],
    clause: 'eirgrid-grid-code/PPM1.5.3.12', pin: 'PPM1.5.3.12 (RfG PPMs)' },
  { id: 'ni-lfsm-o', jurisdiction: 'NI', mode: 'LFSM-O', thresholdHz: 50.2, droopPct: 4, droopRange: [2, 12],
    clause: 'soni-grid-code/CC8.8.7', pin: 'CC8.8.7.1' },
  { id: 'ni-lfsm-u', jurisdiction: 'NI', mode: 'LFSM-U', thresholdHz: 49.5, droopPct: 4, droopRange: [2, 12],
    clause: 'soni-grid-code/CC8.8.7', pin: 'CC8.8.7.2' },
];

/** LFSM active-power change (fraction of the droop base); negative = reduce output. */
export function lfsmResponse(f: number, s: LfsmSetting, droopPct = s.droopPct, f0 = 50): number {
  if (s.mode === 'LFSM-O') return f > s.thresholdHz ? -droopResponse(f - s.thresholdHz, droopPct, f0) : 0;
  return f < s.thresholdHz ? droopResponse(s.thresholdHz - f, droopPct, f0) : 0;
}

/**
 * FSM active-power change with a symmetric deadband.
 * measureFrom 'edge':    Δf counted from the deadband edge (output is continuous).
 * measureFrom 'nominal': Δf counted from 50 Hz once outside the deadband, as the
 *                        EirGrid PPM1.5.3.1 figure note requires — the output
 *                        jumps by db/(f0·s) at the edge.
 */
export function fsmResponse(
  f: number, droopPct: number, deadbandHz: number,
  measureFrom: 'edge' | 'nominal', f0 = 50,
): number {
  const dev = f - f0;
  if (Math.abs(dev) <= deadbandHz) return 0;
  const counted = measureFrom === 'edge' ? dev - Math.sign(dev) * deadbandHz : dev;
  return -droopResponse(counted, droopPct, f0);
}

// ─── Inertia and RoCoF ──────────────────────────────────────────────────────

/** Stored kinetic energy E = H·S (MW·s) for inertia constant H (s) on rating S (MVA). */
export function storedEnergy(H: number, S: number): number {
  return H * S;
}

/**
 * Initial RoCoF (Hz/s) after losing ΔP MW from a system storing Ek MW·s,
 * before any response acts: df/dt = ΔP · f0 / (2 · Ek). Aggregate swing
 * equation on the centre of inertia; ignores load damping and network spread.
 */
export function initialRocof(lossMW: number, EkMWs: number, f0 = 50): number {
  return (lossMW * f0) / (2 * EkMWs);
}

/** Inertia (MW·s) needed to keep the initial RoCoF at or below `limitHzPerS` for a loss. */
export function inertiaForRocof(lossMW: number, limitHzPerS: number, f0 = 50): number {
  return (lossMW * f0) / (2 * limitHzPerS);
}

// ─── Voltage control ────────────────────────────────────────────────────────

/**
 * Steady-state reactive output (fraction of Qmax, + = export/lagging) of a
 * slope-controlled voltage controller. Slope s% means the voltage moves s% of
 * nominal while Q swings across its full range, here taken as 0 → Qmax.
 * Clipped to the plant's capability [-qMinFrac, +1].
 */
export function slopeQ(vPu: number, vSetPu: number, slopePct: number, qMinFrac = 1): number {
  const q = (vSetPu - vPu) / (slopePct / 100);
  return Math.max(-qMinFrac, Math.min(1, q));
}

/** Q/P at a given power factor (≈0.329 at 0.95). */
export function qOverPAtPf(pf: number): number {
  return Math.tan(Math.acos(pf));
}
