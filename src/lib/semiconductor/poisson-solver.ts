// src/lib/semiconductor/poisson-solver.ts
// 1D finite-difference Poisson equation solver using the Thomas algorithm.
//
// Solves: -eps * d²ψ/dx² = ρ(x)
// with Dirichlet boundary conditions ψ(x[0]) = bcLeft, ψ(x[N-1]) = bcRight.
//
// The Thomas algorithm (tridiagonal matrix algorithm, TDMA) solves the
// resulting tridiagonal linear system in O(N) time with no external dependencies.

export interface PoissonParams {
  /** Spatial grid positions (m or consistent unit). Must be uniformly spaced, length ≥ 3. */
  xGrid: number[];
  /** Charge density ρ at each grid point (C/m³ or same unit system). */
  chargeDensity: number[];
  /** Permittivity ε (F/m or consistent). */
  eps: number;
  /** Potential boundary condition at left edge (V). */
  bcLeft: number;
  /** Potential boundary condition at right edge (V). */
  bcRight: number;
}

export interface PoissonResult {
  /** Electrostatic potential ψ(x) at each grid point (V). */
  potential: number[];
  /** Electric field E(x) = -dψ/dx at each grid point (V/m). */
  eField: number[];
}

/**
 * Solve the 1D Poisson equation on a uniform grid using finite differences.
 *
 * The discretised equation at interior node i is:
 *   ψ[i-1] - 2ψ[i] + ψ[i+1] = -dx² * ρ[i] / eps
 *
 * Boundary nodes are fixed: ψ[0] = bcLeft, ψ[N-1] = bcRight.
 */
export function solvePoisson1D(p: PoissonParams): PoissonResult {
  const { xGrid, chargeDensity, eps, bcLeft, bcRight } = p;
  const N = xGrid.length;

  if (N < 3) {
    throw new Error('solvePoisson1D: xGrid must have at least 3 points');
  }
  if (chargeDensity.length !== N) {
    throw new Error('solvePoisson1D: chargeDensity must have the same length as xGrid');
  }

  const dx = xGrid[1] - xGrid[0]; // Assumed uniform spacing
  const dx2 = dx * dx;

  // Number of interior points (excluding the two boundary nodes)
  const M = N - 2;

  // Build tridiagonal system for interior points [1 .. N-2]
  // a[i]*ψ[i-1] + b[i]*ψ[i] + c[i]*ψ[i+1] = d[i]
  // a = c = 1, b = -2, d[i] = -dx² * ρ[i] / eps
  // Modify d for boundary nodes adjacent to BCs.

  const a = new Float64Array(M).fill(1);
  const b = new Float64Array(M).fill(-2);
  const c = new Float64Array(M).fill(1);
  const d = new Float64Array(M);

  for (let i = 0; i < M; i++) {
    const gridIdx = i + 1; // interior node index in xGrid
    d[i] = (-dx2 * chargeDensity[gridIdx]) / eps;
  }

  // Apply boundary conditions to RHS
  d[0] -= bcLeft;   // i=1 adjacent to left BC
  d[M - 1] -= bcRight; // i=N-2 adjacent to right BC

  // Thomas algorithm (forward sweep + back substitution)
  const cStar = new Float64Array(M);
  const dStar = new Float64Array(M);

  cStar[0] = c[0] / b[0];
  dStar[0] = d[0] / b[0];

  for (let i = 1; i < M; i++) {
    const denom = b[i] - a[i] * cStar[i - 1];
    cStar[i] = c[i] / denom;
    dStar[i] = (d[i] - a[i] * dStar[i - 1]) / denom;
  }

  // Back substitution
  const psiInterior = new Float64Array(M);
  psiInterior[M - 1] = dStar[M - 1];
  for (let i = M - 2; i >= 0; i--) {
    psiInterior[i] = dStar[i] - cStar[i] * psiInterior[i + 1];
  }

  // Assemble full potential array including BCs
  const potential = new Array<number>(N);
  potential[0] = bcLeft;
  potential[N - 1] = bcRight;
  for (let i = 0; i < M; i++) {
    potential[i + 1] = psiInterior[i];
  }

  // Compute electric field: E[i] = -dψ/dx (central differences for interior,
  // forward/backward for endpoints)
  const eField = new Array<number>(N);

  // Interior nodes: central difference
  for (let i = 1; i < N - 1; i++) {
    eField[i] = -(potential[i + 1] - potential[i - 1]) / (2 * dx);
  }

  // Endpoints: one-sided differences
  eField[0] = -(potential[1] - potential[0]) / dx;
  eField[N - 1] = -(potential[N - 1] - potential[N - 2]) / dx;

  return { potential, eField };
}
