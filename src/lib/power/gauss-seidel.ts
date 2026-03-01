// src/lib/power/gauss-seidel.ts
// Gauss-Seidel AC power flow solver (for teaching comparison with Newton-Raphson).
//
// GS operates on complex voltages V_i (magnitude + angle).
// Each iteration updates each non-slack bus voltage in turn:
//
//   For PQ bus i:
//     V_i^(k+1) = (1/Y_ii) * [ (P_i - jQ_i) / V_i^(k)* - Σ_{j≠i} Y_ij · V_j ]
//
//   For PV bus i:
//     1. Compute Q_i from current voltages (evaluate reactive injection formula)
//     2. Clamp Q_i to [Qmin, Qmax] (limit enforcement)
//     3. Update voltage angle (keep |V_i| fixed to setpoint)
//
// Convergence is slower than NR (linear vs quadratic) — typically 30-100 iterations.
// An acceleration factor α speeds convergence for PQ buses.

import { complex, add, subtract, multiply, divide, abs } from 'mathjs';
import type { Complex } from 'mathjs';
import type { PowerNetwork, PowerFlowResults, BusResult, LineResult } from './types.js';
import { buildYBus, extractGB } from './ybus.js';

const TOLERANCE   = 1e-4;  // GS uses looser tolerance for reasonable iteration counts
const MAX_ITER    = 200;
const ACCEL       = 1.6;   // Acceleration factor α ∈ [1.0, 1.6]
const DIV_GUARD   = 1e6;

/** Solve AC power flow using Gauss-Seidel iteration. */
export function solveGaussSeidel(network: PowerNetwork): PowerFlowResults {
  const { buses, lines, transformers, generators, loads, baseMVA } = network;

  const { Y, busIndex, n } = buildYBus(network);
  const { G, B } = extractGB(Y);

  const slackBuses = buses.filter(b => b.type === 'slack');
  if (slackBuses.length !== 1) {
    return failResult('Network must have exactly one slack bus.');
  }

  // Net scheduled power (gen - load) per bus, pu
  const Psch = new Array(n).fill(0);
  const Qsch = new Array(n).fill(0);

  for (const gen of generators) {
    const k = busIndex.get(gen.busId)!;
    Psch[k] += gen.P / baseMVA;
  }
  for (const load of loads) {
    const k = busIndex.get(load.busId)!;
    Psch[k] -= load.P / baseMVA;
    Qsch[k] -= load.Q / baseMVA;
  }

  // Initialise complex voltages: flat start (1 pu, 0°)
  const V: Complex[] = new Array(n);
  for (const bus of buses) {
    const k = busIndex.get(bus.id)!;
    V[k] = complex(bus.type === 'slack' || bus.type === 'PV' ? bus.Vmag : 1.0, 0);
  }

  const mismatchHistory: number[] = [];
  let converged = false;
  let iter = 0;

  while (iter < MAX_ITER) {
    let maxDelta = 0;

    for (const bus of buses) {
      if (bus.type === 'slack') continue;
      const k = busIndex.get(bus.id)!;

      // Sum: Σ_{j≠k} Y_kj · V_j
      let sumYV: Complex = complex(0, 0);
      for (let j = 0; j < n; j++) {
        if (j === k) continue;
        sumYV = add(sumYV, multiply(complex(G[k][j], B[k][j]), V[j])) as Complex;
      }

      const Ykk = complex(G[k][k], B[k][k]);

      if (bus.type === 'PQ') {
        // V_k_new = (1/Y_kk) * [ S_k* / V_k* - Σ Y_kj·V_j ]
        // S_k* = P - jQ (conjugate of complex power injection)
        const SkConj = complex(Psch[k], -Qsch[k]);
        const vk = V[k] as Complex;
        const VkConj = complex(vk.re, -vk.im);
        const term1 = divide(SkConj, VkConj) as Complex;
        const rhs = subtract(term1, sumYV) as Complex;
        const Vnew = divide(rhs, Ykk) as Complex;

        // Apply acceleration
        const dV = subtract(Vnew, V[k]) as Complex;
        const Vaccel = add(V[k], multiply(complex(ACCEL, 0), dV)) as Complex;

        const delta = abs(subtract(Vaccel, V[k]) as Complex) as number;
        maxDelta = Math.max(maxDelta, delta);
        V[k] = Vaccel;

      } else if (bus.type === 'PV') {
        // Compute Q_k from current voltages
        let Qk = 0;
        for (let j = 0; j < n; j++) {
          const d = Math.atan2((V[k] as Complex).im, (V[k] as Complex).re)
                  - Math.atan2((V[j] as Complex).im, (V[j] as Complex).re);
          const Vki = Math.sqrt((V[k] as Complex).re ** 2 + (V[k] as Complex).im ** 2);
          const Vji = Math.sqrt((V[j] as Complex).re ** 2 + (V[j] as Complex).im ** 2);
          Qk += Vki * Vji * (G[k][j] * Math.sin(d) - B[k][j] * Math.cos(d));
        }
        // Clamp Q to limits
        const Qclamped = Math.max(bus.Qmin / baseMVA, Math.min(bus.Qmax / baseMVA, Qk));

        // Solve for angle update keeping |V| fixed
        const Sk = complex(Psch[k], -Qclamped); // note: V formula uses conj(V)
        const vkpv = V[k] as Complex;
        const VkConj = complex(vkpv.re, -vkpv.im);
        const term1 = divide(Sk, VkConj) as Complex;
        const rhs = subtract(term1, sumYV) as Complex;
        const Vnew = divide(rhs, Ykk) as Complex;

        // Restore specified voltage magnitude
        const Vmag = bus.Vmag;
        const angle = Math.atan2((Vnew as Complex).im, (Vnew as Complex).re);
        const Vfixed = complex(Vmag * Math.cos(angle), Vmag * Math.sin(angle));

        const delta = abs(subtract(Vfixed, V[k]) as Complex) as number;
        maxDelta = Math.max(maxDelta, delta);
        V[k] = Vfixed;
      }
    }

    mismatchHistory.push(maxDelta);

    if (maxDelta < TOLERANCE) {
      converged = true;
      break;
    }
    if (maxDelta > DIV_GUARD || !isFinite(maxDelta)) break;

    iter++;
  }

  // ── Assemble results (same post-processing as NR) ────────────────────────
  const Vmag = V.map(v => Math.sqrt((v as Complex).re ** 2 + (v as Complex).im ** 2));
  const theta = V.map(v => Math.atan2((v as Complex).im, (v as Complex).re));
  const { G: Gf, B: Bf } = extractGB(Y);

  const busResults: BusResult[] = buses.map(bus => {
    const k = busIndex.get(bus.id)!;
    let Pi = 0, Qi = 0;
    for (let j = 0; j < n; j++) {
      const d = theta[k] - theta[j];
      Pi += Vmag[k] * Vmag[j] * (Gf[k][j] * Math.cos(d) + Bf[k][j] * Math.sin(d));
      Qi += Vmag[k] * Vmag[j] * (Gf[k][j] * Math.sin(d) - Bf[k][j] * Math.cos(d));
    }
    return { busId: bus.id, Vmag: Vmag[k], theta: theta[k], Pinj: Pi, Qinj: Qi };
  });

  const lineResults: LineResult[] = [];
  for (const line of lines) {
    const i = busIndex.get(line.fromBus)!;
    const j = busIndex.get(line.toBus)!;
    const Vi = Vmag[i], Vj = Vmag[j];
    const d = theta[i] - theta[j];
    const r = line.r, x = line.x;
    const denom = r * r + x * x;
    const g = r / denom, b = -x / denom;
    const bCh2 = line.bCh / 2;
    const Pij = Vi * Vi * g - Vi * Vj * (g * Math.cos(d) + b * Math.sin(d));
    const Qij = -Vi * Vi * (b + bCh2) - Vi * Vj * (g * Math.sin(d) - b * Math.cos(d));
    const Pji = Vj * Vj * g - Vi * Vj * (g * Math.cos(-d) + b * Math.sin(-d));
    const lossP = Pij + Pji;
    const Smag = Math.sqrt(Pij * Pij + Qij * Qij) * baseMVA;
    lineResults.push({
      lineId: line.id, fromBus: line.fromBus, toBus: line.toBus,
      Pij, Qij, loadingFraction: line.ratingMVA > 0 ? Smag / line.ratingMVA : 0, lossP,
    });
  }

  for (const xfmr of transformers) {
    const i = busIndex.get(xfmr.fromBus)!;
    const j = busIndex.get(xfmr.toBus)!;
    const a = xfmr.turnsRatio;
    const Vi = Vmag[i], Vj = Vmag[j];
    const d = theta[i] - theta[j];
    const rr = xfmr.r === 0 ? 1e-10 : xfmr.r;
    const denom = rr * rr + xfmr.x * xfmr.x;
    const gt = rr / denom, bt = -xfmr.x / denom;
    const Pij = Vi * Vi * gt / (a * a) - Vi * Vj * (gt * Math.cos(d) + bt * Math.sin(d)) / a;
    const Qij = -Vi * Vi * bt / (a * a) - Vi * Vj * (gt * Math.sin(d) - bt * Math.cos(d)) / a;
    const Pji = Vj * Vj * gt - Vi * Vj * (gt * Math.cos(-d) + bt * Math.sin(-d)) / a;
    const lossP = Pij + Pji;
    const Smag = Math.sqrt(Pij * Pij + Qij * Qij) * baseMVA;
    lineResults.push({
      lineId: xfmr.id, fromBus: xfmr.fromBus, toBus: xfmr.toBus,
      Pij, Qij, loadingFraction: xfmr.ratingMVA > 0 ? Smag / xfmr.ratingMVA : 0, lossP,
    });
  }

  let totalGenP = 0, totalLoadP = 0, totalLoadQ = 0;
  for (const gen of generators) totalGenP += gen.P / baseMVA;
  for (const load of loads) { totalLoadP += load.P / baseMVA; totalLoadQ += load.Q / baseMVA; }
  const totalLossP = lineResults.reduce((s, l) => s + l.lossP, 0);

  return {
    converged, iterations: iter,
    maxMismatch: mismatchHistory[mismatchHistory.length - 1] ?? Infinity,
    mismatchHistory, buses: busResults, lines: lineResults,
    totalGenP, totalGenQ: 0, totalLoadP, totalLoadQ, totalLossP,
  };
}

function failResult(msg: string): PowerFlowResults {
  console.error('[gauss-seidel]', msg);
  return {
    converged: false, iterations: 0, maxMismatch: Infinity,
    mismatchHistory: [], buses: [], lines: [],
    totalGenP: 0, totalGenQ: 0, totalLoadP: 0, totalLoadQ: 0, totalLossP: 0,
  };
}
