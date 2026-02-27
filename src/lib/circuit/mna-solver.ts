// src/lib/circuit/mna-solver.ts
//
// Modified Nodal Analysis (MNA) engine.
//
// Algorithm:
//   1. Assign an index to each non-ground node (ground = reference, V=0).
//   2. For each voltage source, append an extra row/column for its branch current.
//   3. Stamp each component into matrix A and RHS vector b.
//   4. Solve A·x = b with LU decomposition (mathjs lusolve).
//   5. Extract node voltages and branch currents from solution vector x.
//
// Supported components: resistor, voltage_source, current_source, ground, wire.

import { lusolve } from 'mathjs';
import type { CircuitLesson, SolverResult } from './types.js';

/** Solve the circuit described by `lesson`, optionally overriding component values. */
export function solve(
  lesson: CircuitLesson,
  /** Map of component ID → new value (e.g. for slider-controlled components). */
  overrides: Record<string, number> = {}
): SolverResult {
  // ── Step 1: collect all nodes and identify ground nodes ──────────────────
  const allNodes = new Set<string>();
  const groundNodes = new Set<string>();

  for (const comp of lesson.components) {
    for (const node of comp.nodes) allNodes.add(node);
    if (comp.type === 'ground') {
      for (const node of comp.nodes) groundNodes.add(node);
    }
  }

  // Non-ground nodes get matrix indices 0 … n-1
  const nonGroundNodes = [...allNodes].filter((n) => !groundNodes.has(n));
  const nodeIndex: Record<string, number> = {};
  nonGroundNodes.forEach((node, i) => {
    nodeIndex[node] = i;
  });

  const n = nonGroundNodes.length;

  // ── Step 2: index voltage sources ────────────────────────────────────────
  const voltageSources = lesson.components.filter(
    (c) => c.type === 'voltage_source'
  );
  const vsIndex: Record<string, number> = {};
  voltageSources.forEach((vs, i) => {
    vsIndex[vs.id] = n + i;
  });

  const size = n + voltageSources.length;

  // ── Step 3: build MNA matrix A and RHS vector b ──────────────────────────
  const A: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(0)
  );
  const b: number[] = new Array(size).fill(0);

  for (const comp of lesson.components) {
    const val = overrides[comp.id] ?? comp.value ?? 0;

    switch (comp.type) {
      case 'resistor': {
        // Stamp conductance: G = 1/R
        // G[i][i] += G, G[j][j] += G, G[i][j] -= G, G[j][i] -= G
        const [n1, n2] = comp.nodes;
        const G = 1 / val;
        if (!groundNodes.has(n1)) A[nodeIndex[n1]][nodeIndex[n1]] += G;
        if (!groundNodes.has(n2)) A[nodeIndex[n2]][nodeIndex[n2]] += G;
        if (!groundNodes.has(n1) && !groundNodes.has(n2)) {
          A[nodeIndex[n1]][nodeIndex[n2]] -= G;
          A[nodeIndex[n2]][nodeIndex[n1]] -= G;
        }
        break;
      }

      case 'voltage_source': {
        // nodes: [positive_terminal, negative_terminal]
        // Adds branch current I_k as extra unknown.
        // KCL: current I_k flows into positive node, out of negative node.
        // Voltage constraint: V_pos - V_neg = val
        const [nPos, nNeg] = comp.nodes;
        const vsRow = vsIndex[comp.id];

        if (!groundNodes.has(nPos)) {
          A[nodeIndex[nPos]][vsRow] += 1; // KCL at nPos
          A[vsRow][nodeIndex[nPos]] += 1; // voltage constraint
        }
        if (!groundNodes.has(nNeg)) {
          A[nodeIndex[nNeg]][vsRow] -= 1; // KCL at nNeg
          A[vsRow][nodeIndex[nNeg]] -= 1; // voltage constraint
        }
        b[vsRow] = val; // V_pos - V_neg = val
        break;
      }

      case 'current_source': {
        // nodes: [n1, n2], conventional current flows from n2 to n1 (into n1)
        const [n1, n2] = comp.nodes;
        if (!groundNodes.has(n1)) b[nodeIndex[n1]] += val;
        if (!groundNodes.has(n2)) b[nodeIndex[n2]] -= val;
        break;
      }

      // ground and wire contribute no stamps
      default:
        break;
    }
  }

  // ── Step 4: solve A·x = b ─────────────────────────────────────────────────
  // lusolve returns MathArray (2D column matrix when b is 1-D array).
  const rawSolution = lusolve(A, b) as (number | number[])[];
  const x = rawSolution.map((entry) =>
    Array.isArray(entry) ? (entry as number[])[0] : (entry as number)
  );

  // ── Step 5: extract results ───────────────────────────────────────────────
  const nodeVoltages: Record<string, number> = {};
  for (const node of nonGroundNodes) {
    nodeVoltages[node] = x[nodeIndex[node]];
  }
  for (const gnd of groundNodes) {
    nodeVoltages[gnd] = 0;
  }

  const branchCurrents: Record<string, number> = {};
  for (const vs of voltageSources) {
    branchCurrents[vs.id] = x[vsIndex[vs.id]];
  }

  // Compute probe values
  const probeValues: Record<string, number> = {};
  for (const probe of lesson.probes) {
    if (probe.type === 'voltage' && probe.node !== undefined) {
      probeValues[probe.label] = nodeVoltages[probe.node] ?? 0;
    } else if (probe.type === 'current' && probe.component !== undefined) {
      // Positive = current flowing out of the voltage source's positive terminal
      probeValues[probe.label] = -(branchCurrents[probe.component] ?? 0);
    }
  }

  return { nodeVoltages, branchCurrents, probeValues };
}

/**
 * Check whether all probes meet their expected values within tolerance.
 * Returns { pass: boolean, failures: string[] }.
 */
export function checkExpected(
  result: SolverResult,
  expected: CircuitLesson['expected']
): { pass: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const [label, spec] of Object.entries(expected)) {
    const actual = result.probeValues[label];
    if (actual === undefined) {
      failures.push(`Probe "${label}" not found in solution`);
      continue;
    }
    if (Math.abs(actual - spec.value) > spec.tolerance) {
      failures.push(
        `Probe "${label}": expected ${spec.value} ± ${spec.tolerance} ${spec.unit}, got ${actual.toFixed(4)}`
      );
    }
  }
  return { pass: failures.length === 0, failures };
}
