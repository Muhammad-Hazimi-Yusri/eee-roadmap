// src/lib/semiconductor/carrier-stats.ts
// Silicon carrier statistics: intrinsic concentration, Fermi-Dirac distribution, mobility.
// Reference: S. M. Sze, "Physics of Semiconductor Devices", 3rd Ed., Wiley, 2006.

// ─── Physical Constants ───────────────────────────────────────────────────────

/** Elementary charge (C). */
export const q = 1.602176634e-19;

/** Boltzmann constant (J/K). */
export const kB = 1.380649e-23;

/** Vacuum permittivity (F/m). */
export const eps0 = 8.854187817e-12;

/** Silicon relative permittivity. */
export const epsSi = 11.7;

/** Silicon bandgap at 300 K (eV). */
export const EgSi300 = 1.12;

// ─── Intrinsic Carrier Concentration ─────────────────────────────────────────

/**
 * Intrinsic carrier concentration of silicon at temperature T (K).
 * Uses Sze (2006) empirical model: ni = 3.87e16 * T^1.5 * exp(-Eg/2kT)
 * Returns ni in cm⁻³.
 *
 * Valid for ~200 K – 500 K.
 */
export function intrinsicConcentration(T: number): number {
  // Temperature-dependent bandgap (Varshni equation for Si)
  const Eg = 1.17 - (4.73e-4 * T * T) / (T + 636); // eV

  // Effective density of states prefactor (Sze model)
  const niRef = 3.87e16; // cm⁻³ K^(-3/2)

  return niRef * T ** 1.5 * Math.exp((-Eg * q) / (2 * kB * T));
}

// ─── Fermi–Dirac Distribution ─────────────────────────────────────────────────

/**
 * Fermi–Dirac occupation probability.
 *
 * @param E  Energy level (eV).
 * @param Ef Fermi energy (eV).
 * @param T  Temperature (K).
 * @returns  Probability in [0, 1].
 */
export function fermiDirac(E: number, Ef: number, T: number): number {
  if (T <= 0) return E < Ef ? 1 : 0;
  const kT = (kB * T) / q; // eV
  const arg = (E - Ef) / kT;
  // Clamp to avoid overflow: exp(709) overflows float64
  if (arg > 709) return 0;
  if (arg < -709) return 1;
  return 1 / (1 + Math.exp(arg));
}

// ─── Carrier Mobility ─────────────────────────────────────────────────────────

/**
 * Electron mobility in silicon (cm²/V·s) as a function of total doping concentration.
 * Uses Sze (2006) Caughey-Thomas model.
 *
 * @param Nd  Donor concentration (cm⁻³). Use 0 for undoped.
 */
export function electronMobility(Nd: number): number {
  const muMin = 65; // cm²/V·s
  const muMax = 1330; // cm²/V·s
  const Nref = 8.5e16; // cm⁻³
  const alpha = 0.72;
  return muMin + (muMax - muMin) / (1 + (Nd / Nref) ** alpha);
}

/**
 * Hole mobility in silicon (cm²/V·s) as a function of total doping concentration.
 * Uses Sze (2006) Caughey-Thomas model.
 *
 * @param Na  Acceptor concentration (cm⁻³). Use 0 for undoped.
 */
export function holeMobility(Na: number): number {
  const muMin = 47.7; // cm²/V·s
  const muMax = 495; // cm²/V·s
  const Nref = 6.3e17; // cm⁻³
  const alpha = 0.76;
  return muMin + (muMax - muMin) / (1 + (Na / Nref) ** alpha);
}

// ─── Thermal Voltage ──────────────────────────────────────────────────────────

/**
 * Thermal voltage kT/q in volts.
 * At 300 K ≈ 0.02585 V ≈ 25.85 mV.
 */
export function thermalVoltage(T: number): number {
  return (kB * T) / q;
}
