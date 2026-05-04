// src/lib/power/fault-analysis.ts
// Symmetrical-component short-circuit analysis using the Z-bus method.
//
// Supported fault types:
//   3-phase  (3φ bolted)        I_f = V0 / (Z1 + Zf)
//   L-G      (single line-to-ground) I_a = 3·V0 / (Z1 + Z2 + Z0 + 3·Zf)
//   L-L      (line-to-line)      I_b,c = √3·V0 / (Z1 + Z2 + Zf)
//   L-L-G    (double line-to-ground) computed from sequence networks
//
// Z1 (positive-sequence) is the network's Z-bus driving-point impedance.
// Z2, Z0 are derived from user-supplied ratios (typical: Z2 ≈ Z1, Z0 ≈ 3·Z1).
// This is a teaching-quality model — production studies should use
// per-element Z1/Z2/Z0 data and follow IEC 60909.

import { complex, inv, divide, multiply, add } from 'mathjs';
import type { Complex } from 'mathjs';
import type { PowerNetwork, FaultResult, FaultType } from './types.js';
import { buildYBus } from './ybus.js';

interface FaultOptions {
  faultType?: FaultType;
  /** Z0 / Z1 magnitude ratio. Default 3.0 (typical for transmission lines with grounded transformers). */
  z0PerZ1Ratio?: number;
  /** Z2 / Z1 magnitude ratio. Default 1.0 (lines/loads); 0.85–0.9 for sync machines. */
  z2PerZ1Ratio?: number;
  /** Fault impedance in per-unit (bolted = 0). */
  zfPU?: number;
}

function cmag(z: Complex): number {
  return Math.sqrt(z.re * z.re + z.im * z.im);
}

function cscale(z: Complex, k: number): Complex {
  return complex(z.re * k, z.im * k);
}

/**
 * Compute a short-circuit fault at the specified bus.
 *
 * @param network     The power network.
 * @param faultBusId  The bus ID (1-indexed) where the fault occurs.
 * @param prefaultVmag Optional map of bus id → pre-fault voltage magnitude (pu).
 * @param opts        Fault type and sequence-impedance ratios.
 */
export function computeFault(
  network: PowerNetwork,
  faultBusId: number,
  prefaultVmag?: Map<number, number>,
  opts: FaultOptions = {},
): FaultResult {
  const {
    faultType = '3-phase',
    z0PerZ1Ratio = 3.0,
    z2PerZ1Ratio = 1.0,
    zfPU = 0,
  } = opts;

  const { busIndex, Y } = buildYBus(network);

  const k = busIndex.get(faultBusId);
  if (k === undefined) {
    throw new Error(`Fault bus ID ${faultBusId} not found in network.`);
  }

  let Zbus: Complex[][];
  try {
    Zbus = inv(Y as Complex[][]) as unknown as Complex[][];
  } catch {
    throw new Error('Y-bus matrix is singular — check network connectivity.');
  }

  const Z1 = Zbus[k][k] as Complex;
  const Z1mag = cmag(Z1);
  // Approximate sequence impedances (educational simplification).
  const Z2 = cscale(Z1, z2PerZ1Ratio);
  const Z0 = cscale(Z1, z0PerZ1Ratio);
  const Zf = complex(zfPU, 0) as Complex;

  const Vprefault = prefaultVmag?.get(faultBusId) ?? 1.0;
  const Vpf = complex(Vprefault, 0) as Complex;

  // Per-phase fault current magnitudes in pu (phase A reference).
  let IaPU = 0, IbPU = 0, IcPU = 0;

  if (faultType === '3-phase') {
    // I_f = V0 / (Z1 + Zf), all three phases identical magnitude.
    const If = divide(Vpf, add(Z1, Zf) as Complex) as Complex;
    const m = cmag(If);
    IaPU = IbPU = IcPU = m;
  } else if (faultType === 'L-G') {
    // Single L-G on phase A. I_a1 = I_a2 = I_a0 = V0 / (Z1+Z2+Z0+3Zf).
    // I_a = 3 * I_a1.  Phases B and C carry no current.
    const denom = add(add(add(Z1, Z2) as Complex, Z0) as Complex, cscale(Zf, 3)) as Complex;
    const Ia1 = divide(Vpf, denom) as Complex;
    IaPU = 3 * cmag(Ia1);
    IbPU = 0;
    IcPU = 0;
  } else if (faultType === 'L-L') {
    // L-L fault between phases B and C (phase A unfaulted).
    // I_a1 = -I_a2 = V0 / (Z1+Z2+Zf).  |I_b| = |I_c| = √3·|I_a1|. I_a = 0.
    const denom = add(add(Z1, Z2) as Complex, Zf) as Complex;
    const Ia1 = divide(Vpf, denom) as Complex;
    const m = cmag(Ia1);
    IaPU = 0;
    IbPU = Math.sqrt(3) * m;
    IcPU = Math.sqrt(3) * m;
  } else {
    // L-L-G between B and C, returning to ground.
    //   I_a1 = V0 / (Z1 + (Z2 ‖ (Z0 + 3·Zf)))
    //   I_a2 = -I_a1 · (Z0 + 3·Zf) / (Z2 + Z0 + 3·Zf)
    //   I_a0 = -I_a1 · Z2 / (Z2 + Z0 + 3·Zf)
    //   I_b = a²·I_a1 + a·I_a2 + I_a0
    //   I_c =  a·I_a1 + a²·I_a2 + I_a0   (a = e^{j120°})
    //   I_a = I_a1 + I_a2 + I_a0 (zero for unfaulted phase)
    const Z03Zf = add(Z0, cscale(Zf, 3)) as Complex;
    const Z2sum = add(Z2, Z03Zf) as Complex;
    const par = divide(multiply(Z2, Z03Zf) as Complex, Z2sum) as Complex;
    const Ia1 = divide(Vpf, add(Z1, par) as Complex) as Complex;
    const Ia2 = multiply(cscale(Ia1, -1), divide(Z03Zf, Z2sum) as Complex) as Complex;
    const Ia0 = multiply(cscale(Ia1, -1), divide(Z2, Z2sum) as Complex) as Complex;

    const a  = complex(Math.cos(2*Math.PI/3), Math.sin(2*Math.PI/3)) as Complex;
    const a2 = complex(Math.cos(-2*Math.PI/3), Math.sin(-2*Math.PI/3)) as Complex;

    const Ib = add(add(multiply(a2, Ia1) as Complex, multiply(a, Ia2) as Complex) as Complex, Ia0) as Complex;
    const Ic = add(add(multiply(a, Ia1) as Complex, multiply(a2, Ia2) as Complex) as Complex, Ia0) as Complex;

    IaPU = 0; // unfaulted phase
    IbPU = cmag(Ib);
    IcPU = cmag(Ic);
  }

  // Convert to kA.
  const faultBus = network.buses.find(b => b.id === faultBusId)!;
  const Ibase = network.baseMVA / (Math.sqrt(3) * faultBus.baseKV); // kA
  const toKA = (pu: number) => pu * Ibase;

  const Imax = Math.max(IaPU, IbPU, IcPU);

  return {
    faultBusId,
    faultType,
    Vprefault,
    ZtheveninMag: Z1mag,
    Z1mag,
    Z2mag: cmag(Z2),
    Z0mag: cmag(Z0),
    ZfMag: zfPU,
    Ia:   { pu: IaPU, kA: toKA(IaPU) },
    Ib:   { pu: IbPU, kA: toKA(IbPU) },
    Ic:   { pu: IcPU, kA: toKA(IcPU) },
    Imax: { pu: Imax, kA: toKA(Imax) },
    // Backward-compatible single-value fields (= max phase current).
    IfaultPU: Imax,
    IfaultKA: toKA(Imax),
  };
}
