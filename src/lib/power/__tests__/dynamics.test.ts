// Smoke tests for the SMIB swing equation simulator.

import { describe, it, expect } from 'vitest';
import {
  simulateSwing, criticalClearingAngle, steadyStateAngle, isStable,
  type SwingParams,
} from '../dynamics.js';

const BASE: SwingParams = {
  H: 4.0, D: 0.0, f0: 50,
  Pm: 0.7, E: 1.05, V: 1.0,
  Xpre: 0.4, Xduring: 9999, Xpost: 0.6,
  tFault: 0.1, tClear: 0.25, tEnd: 3.0, dt: 0.005,
};

describe('SMIB swing equation', () => {
  it('steady-state angle: Pm = (E·V/X)·sin(δ)', () => {
    // 0.7 = (1.05·1.0/0.4)·sin(δ) → δ = arcsin(0.2667) ≈ 0.2698 rad
    const d = steadyStateAngle(0.7, 1.05, 1.0, 0.4);
    expect(d).toBeCloseTo(Math.asin(0.2667), 3);
  });

  it('default case is stable (returns to a finite angle)', () => {
    const traj = simulateSwing(BASE);
    expect(traj.length).toBeGreaterThan(100);
    expect(isStable(traj)).toBe(true);
  });

  it('long fault duration triggers loss of synchronism', () => {
    const params: SwingParams = { ...BASE, tClear: 0.50 };
    const traj = simulateSwing(params);
    expect(isStable(traj)).toBe(false);
  });

  it('low-inertia machine de-stabilises faster (margin reduces)', () => {
    const stable   = simulateSwing({ ...BASE, H: 4.0, tClear: 0.30 });
    const unstable = simulateSwing({ ...BASE, H: 1.0, tClear: 0.30 });
    expect(isStable(stable)).toBe(true);
    expect(isStable(unstable)).toBe(false);
  });

  it('damping reduces the amplitude of post-fault oscillations', () => {
    const undamped = simulateSwing({ ...BASE, D: 0 });
    const damped   = simulateSwing({ ...BASE, D: 5 });

    // Pick a late-time window; damped trajectory should be closer to its mean.
    const late = (traj: { delta: number }[]) => traj.slice(-100).map(p => p.delta);
    const variance = (xs: number[]) => {
      const m = xs.reduce((s, x) => s + x, 0) / xs.length;
      return xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
    };
    expect(variance(late(damped))).toBeLessThan(variance(late(undamped)));
  });

  it('critical clearing angle is between δ₀ and π − δ₀', () => {
    const dc = criticalClearingAngle(0.7, 1.05, 1.0, 0.6);
    const d0 = steadyStateAngle(0.7, 1.05, 1.0, 0.6);
    const dMax = Math.PI - d0;
    expect(dc).toBeGreaterThan(d0);
    expect(dc).toBeLessThanOrEqual(dMax);
  });
});
