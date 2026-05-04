// src/lib/power/dynamics.ts
// Single-machine-infinite-bus (SMIB) transient stability via the swing equation.
//
//   d²δ/dt² = (π·f₀ / H) · (P_m − P_e − D·dδ/dt)
//   P_e(δ)  = (E·V / X) · sin(δ)
//
// where δ is rotor angle (rad), H is inertia constant (s), D is damping (pu),
// f₀ is system frequency (Hz), E is internal EMF, V is infinite-bus voltage,
// X is reactance between machine and bus.
//
// During a 3-phase fault at the machine terminals, P_e ≈ 0 (sending-end V drops).
// After clearing, P_e returns to the post-fault X (which may differ if a line is
// tripped to clear the fault).

export interface SwingParams {
  /** Inertia constant on machine MVA base, seconds (typical 2–9). */
  H: number;
  /** Damping coefficient (pu torque per pu speed). */
  D: number;
  /** System frequency, Hz. */
  f0: number;
  /** Mechanical input power, pu. */
  Pm: number;
  /** Internal EMF behind transient reactance, pu. */
  E: number;
  /** Infinite-bus voltage, pu. */
  V: number;
  /** Pre-fault reactance, pu (machine X'd + step-up + line). */
  Xpre: number;
  /** During-fault reactance — large during a 3-phase fault on the line; ignored if fault cleared. */
  Xduring: number;
  /** Post-fault reactance — typically larger than Xpre if a line trips. */
  Xpost: number;
  /** Fault inception time, s. */
  tFault: number;
  /** Fault clearing time, s. */
  tClear: number;
  /** Total simulation time, s. */
  tEnd: number;
  /** Integration step, s. */
  dt: number;
}

export interface SwingTrajectoryPoint {
  t: number;
  delta: number; // rad
  omega: number; // rad/s deviation from synchronous
  Pe: number;    // pu
}

/** Pe-vs-δ for a stage (pre-fault, during-fault, post-fault). */
function pe(E: number, V: number, X: number, delta: number): number {
  if (X <= 0) return 0;
  return (E * V / X) * Math.sin(delta);
}

/** Initial rotor angle at steady state: δ₀ such that Pm = Pe(δ₀). */
export function steadyStateAngle(Pm: number, E: number, V: number, X: number): number {
  const arg = Pm * X / (E * V);
  if (Math.abs(arg) > 1) return Math.PI / 2;
  return Math.asin(arg);
}

/** Simulate the swing equation with 4th-order Runge-Kutta integration. */
export function simulateSwing(p: SwingParams): SwingTrajectoryPoint[] {
  const omega0 = 2 * Math.PI * p.f0;
  const M = 2 * p.H / omega0; // pu torque per (rad/s²)

  let delta = steadyStateAngle(p.Pm, p.E, p.V, p.Xpre);
  let omega = 0; // deviation from synchronous

  const trajectory: SwingTrajectoryPoint[] = [];
  const steps = Math.ceil(p.tEnd / p.dt);

  function stage(t: number): { X: number; faultActive: boolean } {
    if (t < p.tFault) return { X: p.Xpre, faultActive: false };
    if (t < p.tClear) return { X: p.Xduring, faultActive: true };
    return { X: p.Xpost, faultActive: false };
  }

  function deriv(t: number, d: number, w: number): { dd: number; dw: number } {
    const X = stage(t).X;
    const Pe = pe(p.E, p.V, X, d);
    return {
      dd: w,
      dw: (p.Pm - Pe - p.D * w) / M,
    };
  }

  for (let n = 0; n <= steps; n++) {
    const t = n * p.dt;
    const X = stage(t).X;
    const Pe = pe(p.E, p.V, X, delta);
    trajectory.push({ t, delta, omega, Pe });

    // RK4
    const k1 = deriv(t, delta, omega);
    const k2 = deriv(t + p.dt/2, delta + p.dt/2 * k1.dd, omega + p.dt/2 * k1.dw);
    const k3 = deriv(t + p.dt/2, delta + p.dt/2 * k2.dd, omega + p.dt/2 * k2.dw);
    const k4 = deriv(t + p.dt,   delta + p.dt   * k3.dd, omega + p.dt   * k3.dw);

    delta += p.dt / 6 * (k1.dd + 2*k2.dd + 2*k3.dd + k4.dd);
    omega += p.dt / 6 * (k1.dw + 2*k2.dw + 2*k3.dw + k4.dw);

    // Detect loss of synchronism — angle exceeds π or growing fast.
    if (Math.abs(delta) > 5 * Math.PI) break;
  }

  return trajectory;
}

/** Equal-area-criterion critical clearing angle (post-fault X = pre-fault X case).
 *  Useful intuition tool — analytical, not from the integration. */
export function criticalClearingAngle(Pm: number, E: number, V: number, X: number): number {
  const PeMax = E * V / X;
  if (PeMax <= Pm) return Math.PI;
  const delta0 = Math.asin(Pm / PeMax);
  const deltaMax = Math.PI - delta0;
  // Equal area: cos(δc) = (Pm/PeMax)·(δmax − δ0) + cos(δmax)
  const cosDc = (Pm / PeMax) * (deltaMax - delta0) + Math.cos(deltaMax);
  if (cosDc > 1) return Math.PI;
  if (cosDc < -1) return 0;
  return Math.acos(cosDc);
}

export function isStable(traj: SwingTrajectoryPoint[]): boolean {
  if (!traj.length) return true;
  const last = traj[traj.length - 1];
  return Math.abs(last.delta) < Math.PI && traj.every(p => Math.abs(p.delta) < 5 * Math.PI / 4);
}
