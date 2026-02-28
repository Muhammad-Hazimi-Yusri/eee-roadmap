// src/lib/impedance/microstrip.ts
// Microstrip characteristic impedance using Wheeler (1977) closed-form equations.
// Reference: H. A. Wheeler, "Transmission-Line Properties of a Strip on a Dielectric Sheet
//            on a Plane", IEEE Trans. MTT, vol. 25, no. 8, pp. 631-647, 1977.

export interface MicrostripParams {
  /** Trace width in metres (or any consistent unit). */
  w: number;
  /** Substrate height (dielectric thickness) in the same unit as w. */
  h: number;
  /** Trace thickness in the same unit as w. */
  t: number;
  /** Relative dielectric constant (εr) of the substrate. */
  er: number;
}

export interface MicrostripResult {
  /** Characteristic impedance in Ω. */
  z0: number;
  /** Effective relative dielectric constant (dimensionless). */
  erEff: number;
}

/**
 * Calculate microstrip characteristic impedance Z0 and effective εr.
 *
 * Returns `null` if any input is physically invalid (non-positive dimensions, εr < 1).
 *
 * Valid range: 0.05 ≤ W/H ≤ 20, 1 ≤ εr ≤ 16, T/H < 0.1.
 * Outside this range the Wheeler formula degrades in accuracy.
 */
export function microstripZ0(p: MicrostripParams): MicrostripResult | null {
  const { w, h, t, er } = p;

  if (w <= 0 || h <= 0 || t <= 0 || er < 1) return null;

  // Effective strip width (accounting for finite thickness)
  // IPC-2141A approximation for width correction.
  const wEff = w + (t / Math.PI) * (1 + Math.log(2 * h / t));

  const ratio = wEff / h;

  let z0: number;
  let erEff: number;

  if (ratio < 1) {
    // Narrow trace regime (W/H < 1) — Wheeler 1977 eq. 10
    erEff =
      (er + 1) / 2 +
      ((er - 1) / 2) * (1 / Math.sqrt(1 + 12 * (h / wEff)) + 0.04 * (1 - ratio) ** 2);

    z0 = (60 / Math.sqrt(erEff)) * Math.log(8 * h / wEff + wEff / (4 * h));
  } else {
    // Wide trace regime (W/H ≥ 1) — Wheeler 1977 eq. 12
    erEff =
      (er + 1) / 2 + ((er - 1) / 2) * (1 / Math.sqrt(1 + 12 * (h / wEff)));

    z0 =
      (120 * Math.PI) /
      (Math.sqrt(erEff) * (ratio + 1.393 + 0.667 * Math.log(ratio + 1.444)));
  }

  return { z0, erEff };
}
