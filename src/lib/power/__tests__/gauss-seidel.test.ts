import { describe, it, expect } from 'vitest';
import { solveGaussSeidel } from '../gauss-seidel.js';
import { solveNewtonRaphson } from '../newton-raphson.js';
import type { PowerNetwork } from '../types.js';
import simple3bus from '../../../data/power-networks/tutorials/simple-3bus.json';

const simple3Network = simple3bus as unknown as PowerNetwork;

describe('GS solver — simple 3-bus network', () => {
  let gs: ReturnType<typeof solveGaussSeidel>;

  it('converges', () => {
    gs = solveGaussSeidel(simple3Network);
    expect(gs.converged).toBe(true);
  });

  it('takes more iterations than Newton-Raphson', () => {
    gs ??= solveGaussSeidel(simple3Network);
    const nr = solveNewtonRaphson(simple3Network);
    // GS is linearly convergent; NR is quadratically convergent — NR always wins
    expect(gs.iterations).toBeGreaterThan(nr.iterations);
  });

  it('slack bus angle remains 0', () => {
    gs ??= solveGaussSeidel(simple3Network);
    const bus1 = gs.buses.find(b => b.busId === 1)!;
    expect(bus1.theta).toBeCloseTo(0, 3);
  });

  it('bus voltages agree with NR to within 0.01 pu', () => {
    gs ??= solveGaussSeidel(simple3Network);
    const nr = solveNewtonRaphson(simple3Network);
    for (const gsBus of gs.buses) {
      const nrBus = nr.buses.find(b => b.busId === gsBus.busId)!;
      expect(Math.abs(gsBus.Vmag - nrBus.Vmag)).toBeLessThan(0.01);
    }
  });

  it('mismatch history shows decreasing convergence', () => {
    gs ??= solveGaussSeidel(simple3Network);
    const hist = gs.mismatchHistory;
    expect(hist.length).toBeGreaterThan(0);
    // Last mismatch should be smaller than first
    if (hist.length > 1) {
      expect(hist[hist.length - 1]).toBeLessThan(hist[0]);
    }
  });

  it('line results are returned', () => {
    gs ??= solveGaussSeidel(simple3Network);
    expect(gs.lines).toHaveLength(simple3Network.lines.length);
  });
});
