// src/lib/semiconductor/poisson-solver.test.ts

import { describe, it, expect } from 'vitest';
import { solvePoisson1D } from './poisson-solver.js';
import { eps0, epsSi, q } from './carrier-stats.js';

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Relative error between computed and reference values. */
function relErr(computed: number, reference: number): number {
  return Math.abs((computed - reference) / reference);
}

// ─── Validation ──────────────────────────────────────────────────────────────

describe('solvePoisson1D input validation', () => {
  it('throws for grid with fewer than 3 points', () => {
    expect(() =>
      solvePoisson1D({ xGrid: [0, 1], chargeDensity: [0, 0], eps: 1, bcLeft: 0, bcRight: 0 })
    ).toThrow();
  });

  it('throws when chargeDensity length != xGrid length', () => {
    expect(() =>
      solvePoisson1D({
        xGrid: [0, 1e-9, 2e-9],
        chargeDensity: [0, 0], // wrong length
        eps: 1,
        bcLeft: 0,
        bcRight: 0,
      })
    ).toThrow();
  });
});

// ─── Zero charge → linear potential ──────────────────────────────────────────

describe('zero charge density', () => {
  it('gives linear potential matching BCs (Laplace equation)', () => {
    const N = 11;
    const xGrid = Array.from({ length: N }, (_, i) => i * 1e-9);
    const chargeDensity = new Array<number>(N).fill(0);

    const result = solvePoisson1D({
      xGrid,
      chargeDensity,
      eps: eps0 * epsSi,
      bcLeft: 0,
      bcRight: 1,
    });

    // Expected: ψ(x) = x / (N-1) * 1 V (linear ramp)
    for (let i = 0; i < N; i++) {
      const expected = i / (N - 1);
      expect(Math.abs(result.potential[i] - expected)).toBeLessThan(1e-10);
    }
  });

  it('gives constant E field under linear potential', () => {
    const N = 21;
    const L = 1e-6;
    const xGrid = Array.from({ length: N }, (_, i) => (i / (N - 1)) * L);
    const chargeDensity = new Array<number>(N).fill(0);

    const result = solvePoisson1D({
      xGrid,
      chargeDensity,
      eps: eps0 * epsSi,
      bcLeft: 0,
      bcRight: 1,
    });

    // E should be constant ≈ -1 V / L for interior points
    const expectedE = -1 / L;
    for (let i = 1; i < N - 1; i++) {
      expect(relErr(result.eField[i], expectedE)).toBeLessThan(1e-6);
    }
  });
});

// ─── Uniform charge density → parabolic potential ────────────────────────────

describe('uniform donor slab (depletion approximation)', () => {
  it('matches analytical parabola ψ(x) = (qNd/2ε)·x·(L−x) with both ends grounded', () => {
    // Solve -ε·ψ'' = ρ = q·Nd with ψ(0) = ψ(L) = 0.
    // Analytical solution (satisfies BCs and DE):
    //   ψ(x) = (q·Nd / (2ε)) · x · (L - x)
    // Peak at x = L/2: ψ_max = q·Nd·L²/(8ε)
    const Nd = 1e22; // m⁻³  (= 1e16 cm⁻³)
    const eps = eps0 * epsSi;
    const L = 100e-9; // 100 nm slab
    const N = 101;

    const xGrid = Array.from({ length: N }, (_, i) => (i / (N - 1)) * L);
    const chargeDensity = new Array<number>(N).fill(q * Nd);

    const result = solvePoisson1D({
      xGrid,
      chargeDensity,
      eps,
      bcLeft: 0,
      bcRight: 0,
    });

    // Compare interior points against analytical ψ(x) = (qNd/2ε) · x · (L - x)
    let maxRelErr = 0;
    for (let i = 1; i < N - 1; i++) {
      const x = xGrid[i];
      const analytical = (q * Nd * x * (L - x)) / (2 * eps);
      if (analytical > 1e-6) {
        const err = relErr(result.potential[i], analytical);
        if (err > maxRelErr) maxRelErr = err;
      }
    }

    // FD discretisation error < 1%
    expect(maxRelErr).toBeLessThan(0.01);
  });
});

// ─── Boundary conditions are applied exactly ─────────────────────────────────

describe('boundary conditions', () => {
  it('first and last potential values equal bcLeft and bcRight exactly', () => {
    const N = 7;
    const xGrid = Array.from({ length: N }, (_, i) => i * 1e-9);
    const chargeDensity = Array.from({ length: N }, (_, i) => i * 1e3);

    const result = solvePoisson1D({
      xGrid,
      chargeDensity,
      eps: eps0 * epsSi,
      bcLeft: -0.7,
      bcRight: 0.5,
    });

    expect(result.potential[0]).toBe(-0.7);
    expect(result.potential[N - 1]).toBe(0.5);
  });
});
