// src/lib/power/ybus.ts
// Build the Y-bus (nodal admittance) matrix for a power network.
//
// Uses the pi-equivalent model for lines and the off-nominal turns ratio
// model for transformers (Bergen & Vittal, Power Systems Analysis, 2nd Ed.).
//
// All values in per-unit on the network's system base.

import { complex, add, multiply, divide } from 'mathjs';
import type { Complex } from 'mathjs';
import type { PowerNetwork } from './types.js';

export interface YBusData {
  /** n×n complex admittance matrix, indexed by busIndex position. */
  Y: Complex[][];
  /** Map: bus.id (1-indexed) → 0-indexed row/column in Y. */
  busIndex: Map<number, number>;
  /** Number of buses. */
  n: number;
}

/** Build the Y-bus admittance matrix from network lines and transformers. */
export function buildYBus(network: PowerNetwork): YBusData {
  const n = network.buses.length;
  const busIndex = new Map<number, number>();
  network.buses.forEach((b, i) => busIndex.set(b.id, i));

  // Initialise n×n to zero+j0
  const Y: Complex[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => complex(0, 0) as Complex)
  );

  // Stamp shunt admittances from bus data
  for (const bus of network.buses) {
    const i = busIndex.get(bus.id)!;
    Y[i][i] = add(Y[i][i], complex(bus.Gsh, bus.Bsh)) as Complex;
  }

  // Stamp lines — pi-equivalent model
  // Series admittance: y_s = 1/(r+jx)
  // Each end gets half the charging susceptance: jb_ch/2
  for (const line of network.lines) {
    const i = busIndex.get(line.fromBus)!;
    const j = busIndex.get(line.toBus)!;

    const ySeries = divide(complex(1, 0), complex(line.r, line.x)) as Complex;
    const yHalfCh = complex(0, line.bCh / 2);

    // Off-diagonals: Y[i][j] -= y_s,  Y[j][i] -= y_s
    Y[i][j] = add(Y[i][j], multiply(complex(-1, 0), ySeries)) as Complex;
    Y[j][i] = add(Y[j][i], multiply(complex(-1, 0), ySeries)) as Complex;

    // Diagonals: Y[i][i] += y_s + jb/2,  Y[j][j] += y_s + jb/2
    Y[i][i] = add(Y[i][i], add(ySeries, yHalfCh)) as Complex;
    Y[j][j] = add(Y[j][j], add(ySeries, yHalfCh)) as Complex;
  }

  // Stamp transformers — off-nominal turns ratio model
  // fromBus is the tap side (ratio a:1), toBus is the fixed side (ratio 1:1).
  //   Y[i][i] += y_t / a²
  //   Y[j][j] += y_t
  //   Y[i][j] -= y_t / a
  //   Y[j][i] -= y_t / a
  // (symmetric for real a; phase-shifting not implemented)
  for (const xfmr of network.transformers) {
    const i = busIndex.get(xfmr.fromBus)!;
    const j = busIndex.get(xfmr.toBus)!;
    const a = xfmr.turnsRatio;

    const yt = divide(complex(1, 0), complex(xfmr.r === 0 ? 1e-10 : xfmr.r, xfmr.x)) as Complex;
    const invA = 1 / a;
    const invA2 = invA * invA;

    Y[i][i] = add(Y[i][i], multiply(complex(invA2, 0), yt)) as Complex;
    Y[j][j] = add(Y[j][j], yt) as Complex;
    Y[i][j] = add(Y[i][j], multiply(complex(-invA, 0), yt)) as Complex;
    Y[j][i] = add(Y[j][i], multiply(complex(-invA, 0), yt)) as Complex;
  }

  return { Y, busIndex, n };
}

/** Extract real G and imaginary B sub-matrices from the complex Y-bus. */
export function extractGB(Y: Complex[][]): { G: number[][]; B: number[][] } {
  const n = Y.length;
  const G = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (Y[i][j] as Complex).re)
  );
  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (Y[i][j] as Complex).im)
  );
  return { G, B };
}
