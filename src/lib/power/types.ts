// src/lib/power/types.ts
// Shared types for the Phase 3 power systems analysis module.
// PowerNetwork mirrors the JSON network data files.
// All electrical quantities are in per-unit unless stated otherwise.

export type BusType = 'slack' | 'PV' | 'PQ';

export interface Bus {
  /** 1-indexed bus number matching JSON data. */
  id: number;
  name: string;
  type: BusType;
  /** Net scheduled active power injection (gen - load), pu. */
  Psch: number;
  /** Net scheduled reactive power injection (gen - load), pu. Ignored for PV/slack. */
  Qsch: number;
  /** Voltage magnitude setpoint for slack and PV buses, pu. */
  Vmag: number;
  /** Voltage angle setpoint for slack bus only, radians (typically 0). */
  theta: number;
  /** Reactive power lower limit for PV buses, pu. */
  Qmin: number;
  /** Reactive power upper limit for PV buses, pu. */
  Qmax: number;
  /** Shunt conductance G_sh, pu. */
  Gsh: number;
  /** Shunt susceptance B_sh, pu. */
  Bsh: number;
  /** SVG canvas position for single-line diagram. */
  position: { x: number; y: number };
  /** Base kV for display purposes. */
  baseKV: number;
}

export interface Line {
  id: string;
  fromBus: number;
  toBus: number;
  /** Series resistance r, pu on system base. */
  r: number;
  /** Series reactance x, pu on system base. */
  x: number;
  /** Total line charging susceptance b_ch (half placed at each end), pu. */
  bCh: number;
  /** Thermal rating in MVA. Used to compute line loading %. */
  ratingMVA: number;
}

export interface Transformer {
  id: string;
  fromBus: number;
  /** Tap side (from) bus has the off-nominal turns ratio applied. */
  toBus: number;
  /** Series resistance, pu on system base. */
  r: number;
  /** Series reactance, pu on system base. */
  x: number;
  /** Off-nominal turns ratio a (1.0 = nominal). fromBus is the tap side. */
  turnsRatio: number;
  ratingMVA: number;
}

export interface Generator {
  busId: number;
  /** Active power output, pu. */
  P: number;
  /** Voltage magnitude setpoint, pu. */
  vmPU: number;
  Pmax: number;
  Pmin: number;
  Qmax: number;
  Qmin: number;
}

export interface Load {
  busId: number;
  /** Active power demand, pu (positive = consuming). */
  P: number;
  /** Reactive power demand, pu (positive = consuming). */
  Q: number;
}

export interface PowerNetwork {
  id: string;
  name: string;
  description: string;
  /** System MVA base. */
  baseMVA: number;
  buses: Bus[];
  lines: Line[];
  transformers: Transformer[];
  generators: Generator[];
  loads: Load[];
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface BusResult {
  busId: number;
  /** Solved voltage magnitude, pu. */
  Vmag: number;
  /** Solved voltage angle, radians. */
  theta: number;
  /** Net active power injection (generation - load), pu. */
  Pinj: number;
  /** Net reactive power injection, pu. */
  Qinj: number;
}

export interface LineResult {
  lineId: string;
  fromBus: number;
  toBus: number;
  /** Active power flow from → to, pu. */
  Pij: number;
  /** Reactive power flow from → to, pu. */
  Qij: number;
  /** Line loading as a fraction of thermal rating (0 = unloaded, 1 = at limit). */
  loadingFraction: number;
  /** Real power losses on this branch, pu. */
  lossP: number;
}

export interface PowerFlowResults {
  converged: boolean;
  iterations: number;
  /** Max power mismatch at convergence, pu. */
  maxMismatch: number;
  /** Max mismatch recorded after each iteration (for ConvergenceChart). */
  mismatchHistory: number[];
  buses: BusResult[];
  lines: LineResult[];
  /** Total generation active power, pu. */
  totalGenP: number;
  /** Total generation reactive power, pu. */
  totalGenQ: number;
  /** Total load active power, pu. */
  totalLoadP: number;
  /** Total load reactive power, pu. */
  totalLoadQ: number;
  /** Total system real power losses, pu. */
  totalLossP: number;
}

export interface FaultResult {
  faultBusId: number;
  /** Pre-fault voltage at the fault bus, pu. */
  Vprefault: number;
  /** Thevenin impedance magnitude at the fault bus, pu. */
  ZtheveninMag: number;
  /** Fault current magnitude, pu. */
  IfaultPU: number;
  /** Fault current in kA (uses bus baseKV and network baseMVA). */
  IfaultKA: number;
}
