import { describe, it, expect } from 'vitest';
import { buildYBus, extractGB } from '../ybus.js';
import type { PowerNetwork } from '../types.js';
import type { Complex } from 'mathjs';

// Hand-calculable 2-bus test network.
// Line 1-2: r=0.01, x=0.05, bCh=0.02
//   y_series = 1/(0.01+j0.05) = 3.8462 - j19.2308 pu
//   y_halfCh = j0.01
//   Y[0][0] = y_series + j0.01 = 3.8462 - j19.2208
//   Y[1][1] = y_series + j0.01 = 3.8462 - j19.2208
//   Y[0][1] = Y[1][0] = -y_series = -3.8462 + j19.2308
const two_bus_network: PowerNetwork = {
  id: 'test-2bus', name: '2-Bus Test', description: '', baseMVA: 100,
  buses: [
    { id: 1, name: 'Slack', type: 'slack', Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
    { id: 2, name: 'PQ',    type: 'PQ',    Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
  ],
  lines: [
    { id: 'L1-2', fromBus: 1, toBus: 2, r: 0.01, x: 0.05, bCh: 0.02, ratingMVA: 200 },
  ],
  transformers: [], generators: [], loads: [],
};

// 3-bus network for further checks
const three_bus_network: PowerNetwork = {
  id: 'test-3bus', name: '3-Bus Test', description: '', baseMVA: 100,
  buses: [
    { id: 1, name: 'Slack', type: 'slack', Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
    { id: 2, name: 'PV',    type: 'PV',    Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
    { id: 3, name: 'PQ',    type: 'PQ',    Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
  ],
  lines: [
    { id: 'L1-2', fromBus: 1, toBus: 2, r: 0.01, x: 0.05, bCh: 0.02, ratingMVA: 200 },
    { id: 'L2-3', fromBus: 2, toBus: 3, r: 0.02, x: 0.08, bCh: 0.01, ratingMVA: 100 },
  ],
  transformers: [], generators: [], loads: [],
};

describe('buildYBus — 2-bus network', () => {
  const _tol = 1e-3; // numerical tolerance for hand calculations

  it('returns correct matrix size', () => {
    const { n, Y } = buildYBus(two_bus_network);
    expect(n).toBe(2);
    expect(Y.length).toBe(2);
    expect(Y[0].length).toBe(2);
  });

  it('diagonal elements have positive real part (conductance)', () => {
    const { Y } = buildYBus(two_bus_network);
    expect((Y[0][0] as Complex).re).toBeGreaterThan(0);
    expect((Y[1][1] as Complex).re).toBeGreaterThan(0);
  });

  it('diagonal elements have negative imaginary part (net susceptance dominates)', () => {
    const { Y } = buildYBus(two_bus_network);
    // Net B = -x/|z|² + b_ch/2 — series inductive term dominates for typical lines
    expect((Y[0][0] as Complex).im).toBeLessThan(0);
  });

  it('off-diagonal elements are negative of series admittance', () => {
    const { Y } = buildYBus(two_bus_network);
    // y_series = 1/(0.01+j0.05): re ≈ 3.846, im ≈ -19.231
    // Y[0][1] = -y_series → re ≈ -3.846, im ≈ +19.231
    expect((Y[0][1] as Complex).re).toBeCloseTo(-3.8462, 2);
    expect((Y[0][1] as Complex).im).toBeCloseTo( 19.2308, 2);
  });

  it('Y-bus is symmetric for lossless transformers (lines only)', () => {
    const { Y } = buildYBus(two_bus_network);
    expect((Y[0][1] as Complex).re).toBeCloseTo((Y[1][0] as Complex).re, 6);
    expect((Y[0][1] as Complex).im).toBeCloseTo((Y[1][0] as Complex).im, 6);
  });

  it('diagonal equals sum of adjacent admittances plus half-charging', () => {
    const { Y } = buildYBus(two_bus_network);
    // Y[0][0] = y12 + jb12/2 = (3.8462 - j19.2308) + j0.01 = 3.8462 - j19.2208
    expect((Y[0][0] as Complex).re).toBeCloseTo( 3.8462, 2);
    expect((Y[0][0] as Complex).im).toBeCloseTo(-19.2208, 2);
  });

  it('row sum equals half-charging susceptance (no shunt conductance)', () => {
    const { Y } = buildYBus(two_bus_network);
    // Sum of row 0: Y[0][0] + Y[0][1] = (y12 + jb/2) + (-y12) = jb/2 = j0.01
    const rowSum_re = (Y[0][0] as Complex).re + (Y[0][1] as Complex).re;
    const rowSum_im = (Y[0][0] as Complex).im + (Y[0][1] as Complex).im;
    expect(rowSum_re).toBeCloseTo(0, 4);
    expect(rowSum_im).toBeCloseTo(0.01, 4); // half the total charging
  });
});

describe('buildYBus — 3-bus network', () => {
  it('has correct dimension', () => {
    const { n } = buildYBus(three_bus_network);
    expect(n).toBe(3);
  });

  it('busIndex maps bus IDs to correct positions', () => {
    const { busIndex } = buildYBus(three_bus_network);
    expect(busIndex.get(1)).toBe(0);
    expect(busIndex.get(2)).toBe(1);
    expect(busIndex.get(3)).toBe(2);
  });

  it('diagonal elements are positive real (conductance > 0)', () => {
    const { Y } = buildYBus(three_bus_network);
    for (let i = 0; i < 3; i++) {
      expect((Y[i][i] as Complex).re).toBeGreaterThan(0);
    }
  });

  it('Y-bus is symmetric', () => {
    const { Y } = buildYBus(three_bus_network);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect((Y[i][j] as Complex).re).toBeCloseTo((Y[j][i] as Complex).re, 6);
        expect((Y[i][j] as Complex).im).toBeCloseTo((Y[j][i] as Complex).im, 6);
      }
    }
  });

  it('off-diagonal Y[0][2] is zero (no direct connection)', () => {
    const { Y } = buildYBus(three_bus_network);
    // Buses 1 and 3 are not directly connected — Y[0][2] should be 0
    expect((Y[0][2] as Complex).re).toBeCloseTo(0, 6);
    expect((Y[0][2] as Complex).im).toBeCloseTo(0, 6);
  });
});

describe('extractGB', () => {
  it('G contains real parts of Y', () => {
    const { Y } = buildYBus(two_bus_network);
    const { G } = extractGB(Y);
    expect(G[0][0]).toBeCloseTo((Y[0][0] as Complex).re, 6);
    expect(G[0][1]).toBeCloseTo((Y[0][1] as Complex).re, 6);
  });

  it('B contains imaginary parts of Y', () => {
    const { Y } = buildYBus(two_bus_network);
    const { B } = extractGB(Y);
    expect(B[0][0]).toBeCloseTo((Y[0][0] as Complex).im, 6);
    expect(B[0][1]).toBeCloseTo((Y[0][1] as Complex).im, 6);
  });
});

describe('transformer Y-bus stamping', () => {
  // 2-bus transformer: bus 1 (tap side, a=0.9) → bus 2 (fixed side)
  // x=0.2, r=0 → y_t = 1/j0.2 = -j5
  // Y[0][0] += y_t/a² = -j5/0.81 = -j6.173
  // Y[1][1] += y_t = -j5
  // Y[0][1] = Y[1][0] -= y_t/a = -(-j5)/0.9 = +j5.556
  const xfmr_network: PowerNetwork = {
    id: 'test-xfmr', name: 'Xfmr Test', description: '', baseMVA: 100,
    buses: [
      { id: 1, name: 'Tap',   type: 'slack', Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
      { id: 2, name: 'Fixed', type: 'PQ',    Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV:  33, position: {x:0,y:0} },
    ],
    lines: [],
    transformers: [
      { id: 'T1-2', fromBus: 1, toBus: 2, r: 0, x: 0.2, turnsRatio: 0.9, ratingMVA: 100 },
    ],
    generators: [], loads: [],
  };

  it('diagonal tap side = y_t / a²', () => {
    const { Y } = buildYBus(xfmr_network);
    // y_t = 1/(1e-10 + j0.2) ≈ -j5; y_t/a² = -j5/0.81 ≈ -j6.173
    expect((Y[0][0] as Complex).im).toBeCloseTo(-6.173, 1);
  });

  it('diagonal fixed side = y_t', () => {
    const { Y } = buildYBus(xfmr_network);
    // Y[1][1] = y_t ≈ -j5
    expect((Y[1][1] as Complex).im).toBeCloseTo(-5.0, 1);
  });

  it('diagonal tap side ≠ diagonal fixed side (asymmetry for a≠1)', () => {
    const { Y } = buildYBus(xfmr_network);
    // Key property: transformer Y-bus diagonals differ when a ≠ 1
    expect(Math.abs((Y[0][0] as Complex).im)).not.toBeCloseTo(Math.abs((Y[1][1] as Complex).im), 2);
  });
});
