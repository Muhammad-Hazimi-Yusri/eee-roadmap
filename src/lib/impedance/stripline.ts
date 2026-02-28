// src/lib/impedance/stripline.ts
// Stripline characteristic impedance using Schneider's closed-form equation.
// Reference: M. V. Schneider, "Microstrip Lines for Microwave Integrated Circuits",
//            Bell System Technical Journal, 1969.

export interface StriplineParams {
  /** Trace width in metres (or any consistent unit). */
  w: number;
  /** Total dielectric thickness (separation between both reference planes) in same unit as w. */
  b: number;
  /** Trace thickness in the same unit as w. */
  t: number;
  /** Relative dielectric constant (εr) of the substrate. */
  er: number;
}

export interface StriplineResult {
  /** Characteristic impedance in Ω. */
  z0: number;
}

/**
 * Calculate centred stripline characteristic impedance Z0.
 *
 * The trace is assumed to be centred between the two ground planes.
 * Returns `null` if any input is physically invalid.
 */
export function striplineZ0(p: StriplineParams): StriplineResult | null {
  const { w, b, t, er } = p;

  if (w <= 0 || b <= 0 || t <= 0 || er < 1) return null;
  if (t >= b) return null; // trace thickness must be less than total board thickness

  // Effective width correction (Schneider)
  const wEff = w + (t / Math.PI) * (1 + Math.log(4 * Math.E * b / (t * Math.PI)));

  const z0 = (60 / Math.sqrt(er)) * Math.log((4 * b) / (0.67 * Math.PI * (0.8 * wEff + t)));

  if (z0 <= 0) return null;

  return { z0 };
}
