// src/lib/power/newton-raphson.ts
// Full Newton-Raphson AC power flow solver.
//
// Algorithm (Glover-Sarma-Overbye formulation):
//   1. Build Y-bus; extract G, B sub-matrices.
//   2. Flat start: PQ buses → |V|=1 pu, θ=0; PV buses → |V|=setpoint, θ=0.
//   3. Compute P_calc and Q_calc for all non-slack buses.
//   4. Form mismatch vector f = [ΔP_nonSlack ; ΔQ_PQ].
//   5. Build Jacobian J and solve J·Δx = f via LU decomposition.
//   6. Update state: θ_i += Δθ_i, |V_i| += Δ|V_i| (using |V|-scaled Jacobian).
//   7. Repeat until max(|ΔP|, |ΔQ|) < tolerance or max iterations reached.
//   8. Post-process: compute line flows, losses, totals.

import { lusolve } from 'mathjs';
import type { PowerNetwork, PowerFlowResults, BusResult, LineResult } from './types.js';
import { buildYBus, extractGB } from './ybus.js';
import { buildJacobian } from './jacobian.js';

const TOLERANCE = 1e-6;  // pu — convergence criterion
const MAX_ITER  = 50;    // maximum NR iterations
const DIV_GUARD = 1e6;   // abort if mismatch exceeds this (divergence)

/** Solve AC power flow using Newton-Raphson iteration. */
export function solveNewtonRaphson(network: PowerNetwork): PowerFlowResults {
  const { buses, lines, transformers, generators, loads, baseMVA } = network;

  // ── Build Y-bus ──────────────────────────────────────────────────────────
  const { Y, busIndex, n } = buildYBus(network);
  const { G, B } = extractGB(Y);

  // ── Index buses by type ──────────────────────────────────────────────────
  // Slack bus: always index 0 in the state vector sense (excluded from equations)
  const slackBuses  = buses.filter(b => b.type === 'slack');
  const pvBuses     = buses.filter(b => b.type === 'PV');
  const pqBuses     = buses.filter(b => b.type === 'PQ');

  if (slackBuses.length !== 1) {
    return failResult('Network must have exactly one slack bus.');
  }

  // Ordered non-slack buses: PV first, then PQ (consistent state vector ordering)
  const nonSlackBuses = [...pvBuses, ...pqBuses];

  // 0-based indices into the flat arrays (length n, order = network.buses array)
  const nonSlackIdx = nonSlackBuses.map(b => busIndex.get(b.id)!);
  const pqIdx       = pqBuses.map(b => busIndex.get(b.id)!);

  // ── Compute net scheduled power per bus (gen - load) ─────────────────────
  // Psch[k] = net active injection at bus k (positive = generation)
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

  // ── Flat start ───────────────────────────────────────────────────────────
  const Vmag  = new Array(n).fill(1.0);
  const theta = new Array(n).fill(0.0);

  // Slack and PV buses use their specified voltage magnitudes
  for (const bus of buses) {
    if (bus.type === 'slack' || bus.type === 'PV') {
      const k = busIndex.get(bus.id)!;
      Vmag[k] = bus.Vmag;
    }
  }

  const mismatchHistory: number[] = [];
  let converged = false;
  let iter = 0;

  // ── Newton-Raphson iteration loop ────────────────────────────────────────
  while (iter < MAX_ITER) {
    // Step 3: calculate P and Q injections from current voltages
    const Pcalc = new Array(n).fill(0);
    const Qcalc = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const dtheta = theta[i] - theta[j];
        Pcalc[i] += Vmag[i] * Vmag[j] * (G[i][j] * Math.cos(dtheta) + B[i][j] * Math.sin(dtheta));
        Qcalc[i] += Vmag[i] * Vmag[j] * (G[i][j] * Math.sin(dtheta) - B[i][j] * Math.cos(dtheta));
      }
    }

    // Step 4: form mismatch vector [ΔP_nonSlack ; ΔQ_PQ]
    const dP = nonSlackIdx.map(k => Psch[k] - Pcalc[k]);
    const dQ = pqIdx.map(k => Qsch[k] - Qcalc[k]);
    const mismatch = [...dP, ...dQ];

    const maxMis = Math.max(...mismatch.map(Math.abs));
    mismatchHistory.push(maxMis);

    if (maxMis < TOLERANCE) {
      converged = true;
      break;
    }
    if (maxMis > DIV_GUARD || !isFinite(maxMis)) {
      break; // diverged
    }

    // Step 5: build Jacobian and solve
    const J = buildJacobian(G, B, Vmag, theta, Pcalc, Qcalc, nonSlackIdx, pqIdx);

    let deltaX: number[];
    try {
      const raw = lusolve(J, mismatch) as (number | number[])[];
      deltaX = raw.map(e => (Array.isArray(e) ? (e as number[])[0] : (e as number)));
    } catch {
      break; // singular Jacobian
    }

    // Step 6: update state vector
    // First nns entries are Δθ, next npq entries are Δ|V|
    const nns = nonSlackIdx.length;
    for (let ri = 0; ri < nns; ri++) {
      const k = nonSlackIdx[ri];
      theta[k] += deltaX[ri];
    }
    for (let ri = 0; ri < pqIdx.length; ri++) {
      const k = pqIdx[ri];
      // |V|-scaled Jacobian: correction entry is Δ|V|/|V| (fractional)
      Vmag[k] += Vmag[k] * deltaX[nns + ri];
    }

    iter++;
  }

  // ── Post-process: assemble bus results ───────────────────────────────────
  const busResults: BusResult[] = buses.map(bus => {
    const k = busIndex.get(bus.id)!;
    // Recompute final P, Q injections
    let Pi = 0, Qi = 0;
    for (let j = 0; j < n; j++) {
      const d = theta[k] - theta[j];
      Pi += Vmag[k] * Vmag[j] * (G[k][j] * Math.cos(d) + B[k][j] * Math.sin(d));
      Qi += Vmag[k] * Vmag[j] * (G[k][j] * Math.sin(d) - B[k][j] * Math.cos(d));
    }
    return { busId: bus.id, Vmag: Vmag[k], theta: theta[k], Pinj: Pi, Qinj: Qi };
  });

  // ── Post-process: compute line flows ─────────────────────────────────────
  const lineResults: LineResult[] = [];
  for (const line of lines) {
    const i = busIndex.get(line.fromBus)!;
    const j = busIndex.get(line.toBus)!;

    const Vi = Vmag[i], Vj = Vmag[j];
    const ti = theta[i], tj = theta[j];
    const d = ti - tj;

    // Pi model: admittance = 1/(r+jx), shunt b_ch/2 at each end
    const r = line.r, x = line.x;
    const denom = r * r + x * x;
    const g = r / denom, b = -x / denom;
    const bCh2 = line.bCh / 2;

    const Pij = Vi * Vi * g - Vi * Vj * (g * Math.cos(d) + b * Math.sin(d));
    const Qij = -Vi * Vi * (b + bCh2) - Vi * Vj * (g * Math.sin(d) - b * Math.cos(d));
    const Pji = Vj * Vj * g - Vi * Vj * (g * Math.cos(-d) + b * Math.sin(-d));

    const lossP = Pij + Pji;
    const Smag = Math.sqrt(Pij * Pij + Qij * Qij) * baseMVA; // MVA
    const loading = line.ratingMVA > 0 ? Smag / line.ratingMVA : 0;

    lineResults.push({
      lineId: line.id,
      fromBus: line.fromBus,
      toBus: line.toBus,
      Pij,
      Qij,
      loadingFraction: loading,
      lossP,
    });
  }

  // Also compute transformer flows
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
    const loading = xfmr.ratingMVA > 0 ? Smag / xfmr.ratingMVA : 0;

    lineResults.push({
      lineId: xfmr.id,
      fromBus: xfmr.fromBus,
      toBus: xfmr.toBus,
      Pij,
      Qij,
      loadingFraction: loading,
      lossP,
    });
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  let totalGenP = 0, totalGenQ = 0, totalLoadP = 0, totalLoadQ = 0;
  for (const gen of generators) {
    totalGenP += gen.P / baseMVA;
  }
  for (const load of loads) {
    totalLoadP += load.P / baseMVA;
    totalLoadQ += load.Q / baseMVA;
  }
  // Slack bus Q from its bus result
  const slackBus = slackBuses[0];
  const slackResult = busResults.find(r => r.busId === slackBus.id)!;
  totalGenP += slackResult.Pinj + totalLoadP - totalGenP; // slack picks up the balance
  totalGenQ = busResults
    .filter(r => buses.find(b => b.id === r.busId)?.type !== 'PQ')
    .reduce((acc, r) => acc + r.Qinj, 0) + totalLoadQ;

  const totalLossP = lineResults.reduce((s, l) => s + l.lossP, 0);

  const lastMismatch = mismatchHistory[mismatchHistory.length - 1] ?? Infinity;

  return {
    converged,
    iterations: iter,
    maxMismatch: lastMismatch,
    mismatchHistory,
    buses: busResults,
    lines: lineResults,
    totalGenP,
    totalGenQ,
    totalLoadP,
    totalLoadQ,
    totalLossP,
  };
}

function failResult(msg: string): PowerFlowResults {
  console.error('[newton-raphson]', msg);
  return {
    converged: false,
    iterations: 0,
    maxMismatch: Infinity,
    mismatchHistory: [],
    buses: [],
    lines: [],
    totalGenP: 0,
    totalGenQ: 0,
    totalLoadP: 0,
    totalLoadQ: 0,
    totalLossP: 0,
  };
}
