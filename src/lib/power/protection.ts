// src/lib/power/protection.ts
// IEC 60255-151 inverse-time overcurrent relay curves and discrimination checks.
//
//   t = TMS · k / ((I/Is)^α − 1)        (IEC class)
//
//   Class            k       α
//   Standard Inv     0.14    0.02
//   Very Inv         13.5    1.0
//   Extremely Inv    80.0    2.0
//   Long-Time Inv    120.0   1.0
//
// Below pickup (I/Is ≤ 1) the relay does not operate. Above pickup, t is
// monotonically decreasing in I.

export type IECCurveClass = 'SI' | 'VI' | 'EI' | 'LTI';

const COEFFS: Record<IECCurveClass, { k: number; alpha: number; label: string }> = {
  SI:  { k: 0.14,  alpha: 0.02, label: 'Standard Inverse' },
  VI:  { k: 13.5,  alpha: 1.0,  label: 'Very Inverse' },
  EI:  { k: 80.0,  alpha: 2.0,  label: 'Extremely Inverse' },
  LTI: { k: 120.0, alpha: 1.0,  label: 'Long-Time Inverse' },
};

export interface RelaySettings {
  /** Display name (e.g. "Feeder R1"). */
  name: string;
  /** Pickup current in amps (primary or CT-secondary; pick a base and stick to it). */
  pickupA: number;
  /** Time multiplier setting (typical 0.05–1.0). */
  tms: number;
  curve: IECCurveClass;
  /** Optional definite-time element overlay: instantaneous trip above this multiplier of pickup. */
  instantaneousMultiplier?: number;
  /** Definite-time delay for the instantaneous element (s). */
  instantaneousDelay?: number;
  color: string;
}

export function curveLabel(c: IECCurveClass): string {
  return COEFFS[c].label;
}

/** Operating time at fault current i (A). Returns Infinity below pickup. */
export function operatingTime(relay: RelaySettings, faultA: number): number {
  if (faultA <= relay.pickupA) return Infinity;
  const ratio = faultA / relay.pickupA;
  // Definite-time / instantaneous element
  if (
    relay.instantaneousMultiplier !== undefined &&
    ratio >= relay.instantaneousMultiplier
  ) {
    return relay.instantaneousDelay ?? 0;
  }
  const { k, alpha } = COEFFS[relay.curve];
  return relay.tms * k / (Math.pow(ratio, alpha) - 1);
}

/** Compute (current, time) curve points for plotting. Logarithmic in current. */
export function curvePoints(
  relay: RelaySettings,
  iMin: number,
  iMax: number,
  numPoints = 200,
): { i: number; t: number }[] {
  const out: { i: number; t: number }[] = [];
  const logMin = Math.log10(iMin);
  const logMax = Math.log10(iMax);
  for (let n = 0; n < numPoints; n++) {
    const i = Math.pow(10, logMin + (n / (numPoints - 1)) * (logMax - logMin));
    const t = operatingTime(relay, i);
    if (Number.isFinite(t) && t > 0 && t < 1e4) {
      out.push({ i, t });
    }
  }
  return out;
}

/** Check that downstream relay R operates BEFORE upstream R+1 across a current
 *  range, with at least the supplied grading margin (typically 0.3 s). */
export function discriminationMargin(
  downstream: RelaySettings,
  upstream: RelaySettings,
  faultA: number,
): number {
  const td = operatingTime(downstream, faultA);
  const tu = operatingTime(upstream,   faultA);
  if (!Number.isFinite(td) || !Number.isFinite(tu)) return Infinity;
  return tu - td;
}
