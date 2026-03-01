// src/lib/power/fault-analysis.ts
// 3-phase symmetrical fault analysis using the Z-bus (impedance matrix) method.
//
// Algorithm:
//   1. Build Y-bus from network data.
//   2. Invert Y-bus to get Z-bus = Y-bus⁻¹ (using mathjs inv).
//   3. The Thevenin impedance at bus k = Z_kk (driving-point impedance).
//   4. Pre-fault voltage V0_k from a prior power flow solution (or flat start 1.0 pu).
//   5. Fault current I_fault = V0_k / Z_kk
//   6. Convert to physical kA using I_base = S_base / (√3 · V_base).
//
// Note: Z-bus inversion is O(n³) — acceptable for n ≤ 50 buses.
// For large networks the sparse LU approach is preferred; this is for teaching.

import { complex, inv, divide } from 'mathjs';
import type { Complex } from 'mathjs';
import type { PowerNetwork, FaultResult } from './types.js';
import { buildYBus } from './ybus.js';

/**
 * Compute a 3-phase symmetrical fault at the specified bus.
 *
 * @param network     The power network.
 * @param faultBusId  The bus ID (1-indexed) where the fault occurs.
 * @param prefaultVmag Optional map of bus id → pre-fault voltage magnitude (pu).
 *                    If omitted, flat start (1.0 pu) is assumed for all buses.
 */
export function computeFault(
  network: PowerNetwork,
  faultBusId: number,
  prefaultVmag?: Map<number, number>,
): FaultResult {
  const { busIndex, Y } = buildYBus(network);

  const k = busIndex.get(faultBusId);
  if (k === undefined) {
    throw new Error(`Fault bus ID ${faultBusId} not found in network.`);
  }

  // Convert Y (Complex[][]) into mathjs matrix format for inv()
  // mathjs inv() accepts a 2-D array of complex values
  const Ynested: Complex[][] = Y;

  let Zbus: Complex[][];
  try {
    Zbus = inv(Ynested) as unknown as Complex[][];
  } catch {
    throw new Error('Y-bus matrix is singular — check network connectivity.');
  }

  const Zkk = Zbus[k][k] as Complex;
  const ZkkMag = Math.sqrt(Zkk.re * Zkk.re + Zkk.im * Zkk.im);

  // Pre-fault voltage at fault bus
  const Vprefault = prefaultVmag?.get(faultBusId) ?? 1.0;

  // Fault current (pu): I_f = V0 / Z_kk (complex division; use magnitude for display)
  const Vpf = complex(Vprefault, 0);
  const If = divide(Vpf, Zkk) as Complex;
  const IfaultPU = Math.sqrt(If.re * If.re + If.im * If.im);

  // Convert to kA: find base kV for the fault bus
  const faultBus = network.buses.find(b => b.id === faultBusId)!;
  const baseKV = faultBus.baseKV;
  // I_base = S_base_MVA / (√3 · V_base_kV)  [kA]
  const Ibase = network.baseMVA / (Math.sqrt(3) * baseKV);
  const IfaultKA = IfaultPU * Ibase;

  return {
    faultBusId,
    Vprefault,
    ZtheveninMag: ZkkMag,
    IfaultPU,
    IfaultKA,
  };
}
