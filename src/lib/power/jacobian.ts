// src/lib/power/jacobian.ts
// Assemble the Newton-Raphson Jacobian for AC power flow.
//
// Standard formulation (Glover, Sarma & Overbye — Power Systems Analysis and Design):
//
//   J = | H  N |    where dimensions are:
//       | M  L |
//
//   H (∂P/∂θ):   (nNonSlack × nNonSlack)
//   N (∂P/∂|V|·|V|): (nNonSlack × nPQ)    — using |V|-scaled column
//   M (∂Q/∂θ):   (nPQ × nNonSlack)
//   L (∂Q/∂|V|·|V|): (nPQ × nPQ)           — using |V|-scaled column
//
// Full Jacobian dimension: (nNonSlack + nPQ) × (nNonSlack + nPQ)
//
// Diagonal elements (i == j):
//   H[i,i] = -Q_i - B[i,i]·|V_i|²
//   N[i,i] =  P_i + G[i,i]·|V_i|²
//   M[i,i] =  P_i - G[i,i]·|V_i|²
//   L[i,i] =  Q_i - B[i,i]·|V_i|²
//
// Off-diagonal elements (i ≠ j):
//   H[i,j] = |V_i||V_j|·(G[i,j]·sin(θ_i - θ_j) - B[i,j]·cos(θ_i - θ_j))
//   N[i,j] = |V_i||V_j|·(G[i,j]·cos(θ_i - θ_j) + B[i,j]·sin(θ_i - θ_j))
//   M[i,j] = -H[i,j]
//   L[i,j] = -N[i,j]

/** Assemble the full Newton-Raphson Jacobian as a 2-D real array.
 *
 * @param G       Real part of Y-bus (n×n)
 * @param B       Imaginary part of Y-bus (n×n)
 * @param Vmag    Voltage magnitudes for all buses (length n), indexed by busIdx
 * @param theta   Voltage angles for all buses (length n), indexed by busIdx
 * @param P       Calculated active power injections (length n)
 * @param Q       Calculated reactive power injections (length n)
 * @param nonSlackIdx  0-based indices (into length-n arrays) of non-slack buses
 * @param pqIdx        0-based indices (into length-n arrays) of PQ buses
 */
export function buildJacobian(
  G: number[][],
  B: number[][],
  Vmag: number[],
  theta: number[],
  P: number[],
  Q: number[],
  nonSlackIdx: number[],
  pqIdx: number[],
): number[][] {
  const nns = nonSlackIdx.length; // rows/cols for θ block
  const npq = pqIdx.length;       // rows/cols for |V| block
  const dim = nns + npq;

  // Initialise full Jacobian to zero
  const J: number[][] = Array.from({ length: dim }, () => new Array(dim).fill(0));

  // Helper: map a Y-bus index to its column/row in the θ block (-1 if slack)
  const thetaCol = new Map<number, number>();
  nonSlackIdx.forEach((busIdx, col) => thetaCol.set(busIdx, col));

  // Helper: map a Y-bus index to its column/row in the |V| block (-1 if PV/slack)
  const vCol = new Map<number, number>();
  pqIdx.forEach((busIdx, col) => vCol.set(busIdx, nns + col));

  // Fill H (top-left) and N (top-right) — rows = nonSlack buses
  for (let ri = 0; ri < nns; ri++) {
    const i = nonSlackIdx[ri]; // Y-bus index for this row
    const Vi = Vmag[i];
    const ti = theta[i];

    // H diagonal
    J[ri][ri] = -Q[i] - B[i][i] * Vi * Vi;

    // N diagonal (if bus i is PQ)
    const nc = vCol.get(i);
    if (nc !== undefined) {
      J[ri][nc] = P[i] + G[i][i] * Vi * Vi;
    }

    // Off-diagonal terms: iterate over all buses j
    for (let j = 0; j < G.length; j++) {
      if (j === i) continue;
      const Vj = Vmag[j];
      const dtheta = ti - theta[j];
      const cosD = Math.cos(dtheta);
      const sinD = Math.sin(dtheta);

      const hij = Vi * Vj * (G[i][j] * sinD - B[i][j] * cosD);
      const nij = Vi * Vj * (G[i][j] * cosD + B[i][j] * sinD);

      // H off-diagonal: col = thetaCol(j)
      const hc = thetaCol.get(j);
      if (hc !== undefined) {
        J[ri][hc] = hij;
      }

      // N off-diagonal: col = vCol(j)
      const nc2 = vCol.get(j);
      if (nc2 !== undefined) {
        J[ri][nc2] = nij;
      }
    }
  }

  // Fill M (bottom-left) and L (bottom-right) — rows = PQ buses only
  for (let ri = 0; ri < npq; ri++) {
    const i = pqIdx[ri]; // Y-bus index for this row
    const Vi = Vmag[i];
    const ti = theta[i];
    const jRow = nns + ri; // row in full Jacobian

    // M diagonal
    J[jRow][thetaCol.get(i)!] = P[i] - G[i][i] * Vi * Vi;

    // L diagonal
    const nc = vCol.get(i)!;
    J[jRow][nc] = Q[i] - B[i][i] * Vi * Vi;

    // Off-diagonal terms
    for (let j = 0; j < G.length; j++) {
      if (j === i) continue;
      const Vj = Vmag[j];
      const dtheta = ti - theta[j];
      const cosD = Math.cos(dtheta);
      const sinD = Math.sin(dtheta);

      const hij = Vi * Vj * (G[i][j] * sinD - B[i][j] * cosD);
      const nij = Vi * Vj * (G[i][j] * cosD + B[i][j] * sinD);

      // M off-diagonal: ∂Q_i/∂θ_j = −nij
      const mc = thetaCol.get(j);
      if (mc !== undefined) {
        J[jRow][mc] = -nij;
      }

      // L off-diagonal: |V_j|·∂Q_i/∂|V_j| = hij
      const lc = vCol.get(j);
      if (lc !== undefined) {
        J[jRow][lc] = hij;
      }
    }
  }

  return J;
}
