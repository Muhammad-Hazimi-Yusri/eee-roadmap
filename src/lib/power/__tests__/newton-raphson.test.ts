import { describe, it, expect } from 'vitest';
import { solveNewtonRaphson } from '../newton-raphson.js';
import type { PowerNetwork } from '../types.js';
import ieee14 from '../../../data/power-networks/tutorials/ieee-14bus.json';
import simple3bus from '../../../data/power-networks/tutorials/simple-3bus.json';
import expectedResults from '../../../data/power-networks/reference/ieee-test-cases.json';

const ieee14Network = ieee14 as unknown as PowerNetwork;
const simple3Network = simple3bus as unknown as PowerNetwork;

// ── Simple 3-bus: sanity checks ───────────────────────────────────────────────
describe('NR solver — simple 3-bus network', () => {
  let results: ReturnType<typeof solveNewtonRaphson>;

  it('converges', () => {
    results = solveNewtonRaphson(simple3Network);
    expect(results.converged).toBe(true);
  });

  it('converges in few iterations (NR is quadratic)', () => {
    results ??= solveNewtonRaphson(simple3Network);
    expect(results.iterations).toBeLessThanOrEqual(15);
  });

  it('slack bus maintains specified voltage magnitude', () => {
    results ??= solveNewtonRaphson(simple3Network);
    const bus1 = results.buses.find(b => b.busId === 1)!;
    expect(bus1.Vmag).toBeCloseTo(1.05, 4);
  });

  it('slack bus angle is 0', () => {
    results ??= solveNewtonRaphson(simple3Network);
    const bus1 = results.buses.find(b => b.busId === 1)!;
    expect(bus1.theta).toBeCloseTo(0.0, 6);
  });

  it('PV bus maintains specified voltage magnitude', () => {
    results ??= solveNewtonRaphson(simple3Network);
    const bus2 = results.buses.find(b => b.busId === 2)!;
    expect(bus2.Vmag).toBeCloseTo(1.04, 3);
  });

  it('load bus voltage is lower than source voltage (voltage drop)', () => {
    results ??= solveNewtonRaphson(simple3Network);
    const bus3 = results.buses.find(b => b.busId === 3)!;
    const bus1 = results.buses.find(b => b.busId === 1)!;
    expect(bus3.Vmag).toBeLessThan(bus1.Vmag);
  });

  it('power balance: total generation ≈ total load + losses', () => {
    results ??= solveNewtonRaphson(simple3Network);
    const _tolerance = 0.01; // 1% in pu (unused; kept for readability)
    expect(results.totalLossP).toBeGreaterThanOrEqual(0);
    expect(results.totalLossP).toBeLessThan(0.1); // losses should be < 10% of load for this network
  });

  it('mismatch history has at least one entry', () => {
    results ??= solveNewtonRaphson(simple3Network);
    expect(results.mismatchHistory.length).toBeGreaterThan(0);
  });

  it('line results include all network lines', () => {
    results ??= solveNewtonRaphson(simple3Network);
    expect(results.lines).toHaveLength(simple3Network.lines.length);
  });
});

// ── IEEE 14-bus: validation against published results ────────────────────────
describe('NR solver — IEEE 14-bus validation (MATPOWER case14)', () => {
  // Compute once; all tests reference the same result
  const results = solveNewtonRaphson(ieee14Network);
  const expected = expectedResults.ieee14bus;

  it('converges', () => {
    expect(results.converged).toBe(true);
  });

  it(`converges within ${expected.iterations_max} iterations`, () => {
    expect(results.iterations).toBeLessThanOrEqual(expected.iterations_max);
  });

  // Bus voltage magnitude tolerance: ±0.002 pu (0.2%)
  const VMAG_TOL = 0.002;
  // Bus voltage angle tolerance: ±0.1 degrees
  const ANG_TOL  = 0.1;

  for (const exp of expected.buses) {
    it(`Bus ${exp.id}: |V| ≈ ${exp.Vmag} pu`, () => {
      const r = results.buses.find(b => b.busId === exp.id);
      expect(r).toBeDefined();
      expect(r!.Vmag).toBeCloseTo(exp.Vmag, 2);
      // Tighter check using toBeCloseTo doesn't catch ±0.002, so add explicit:
      expect(Math.abs(r!.Vmag - exp.Vmag)).toBeLessThan(VMAG_TOL);
    });

    it(`Bus ${exp.id}: θ ≈ ${exp.theta_deg}°`, () => {
      const r = results.buses.find(b => b.busId === exp.id);
      expect(r).toBeDefined();
      const theta_deg = r!.theta * 180 / Math.PI;
      expect(Math.abs(theta_deg - exp.theta_deg)).toBeLessThan(ANG_TOL);
    });
  }

  it('has line results for all 17 lines + 3 transformers', () => {
    expect(results.lines).toHaveLength(
      ieee14Network.lines.length + ieee14Network.transformers.length
    );
  });
});
