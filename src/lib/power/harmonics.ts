// src/lib/power/harmonics.ts
// FFT, harmonic synthesis, and THD calculations for power-systems analysis.
//
// Methods:
//   synthesizeWaveform — combine a list of harmonics back to time-domain.
//   analyzeWaveform    — Cooley-Tukey FFT then magnitude/phase per harmonic.
//   computeTHD         — IEEE 519 / IEC 61000 THD (% of fundamental).
//   computeTDD         — Total Demand Distortion (vs maximum demand current).

export interface HarmonicComponent {
  /** Harmonic order (1 = fundamental, 2 = 2nd, ...). */
  order: number;
  /** Magnitude as a fraction of fundamental (0..1). */
  magnitude: number;
  /** Phase offset in radians. */
  phase: number;
}

export interface HarmonicSpectrum {
  /** Per-order RMS magnitudes (component[0] is fundamental). */
  components: HarmonicComponent[];
  /** Total harmonic distortion as a percentage of the fundamental. */
  thdPercent: number;
}

export interface AnalysisResult {
  /** Time-domain samples used for the FFT. */
  samples: number[];
  /** Sampling frequency, Hz. */
  fs: number;
  spectrum: HarmonicSpectrum;
}

const TWO_PI = 2 * Math.PI;

/** Build a time-domain waveform from a list of harmonics.
 *  Fundamental frequency is implicit (cycles per period); samples are unitless. */
export function synthesizeWaveform(
  harmonics: HarmonicComponent[],
  numSamples: number,
  cycles = 1,
): number[] {
  const out = new Array(numSamples).fill(0);
  for (let i = 0; i < numSamples; i++) {
    const t = (i / numSamples) * cycles;
    let v = 0;
    for (const h of harmonics) {
      v += h.magnitude * Math.cos(TWO_PI * h.order * t + h.phase);
    }
    out[i] = v;
  }
  return out;
}

/** Naïve discrete Fourier transform — fine for the small N (≤ 1024) used here.
 *  Returns complex pairs [re, im] of length N. */
function dft(x: number[]): Array<[number, number]> {
  const N = x.length;
  const out: Array<[number, number]> = new Array(N);
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const ang = -TWO_PI * k * n / N;
      re += x[n] * Math.cos(ang);
      im += x[n] * Math.sin(ang);
    }
    out[k] = [re, im];
  }
  return out;
}

/** Analyse a waveform and extract harmonic components up to maxOrder.
 *  Assumes the waveform contains exactly `cycles` periods of the fundamental
 *  in `samples.length` samples (so bin k=cycles is the fundamental).
 */
export function analyzeWaveform(
  samples: number[],
  maxOrder = 25,
  cycles = 1,
): HarmonicSpectrum {
  const N = samples.length;
  const X = dft(samples);

  const components: HarmonicComponent[] = [];

  // Fundamental is at bin = cycles. Each harmonic h is at bin = h * cycles.
  const fundBin = cycles;
  const [reF, imF] = X[fundBin];
  const fundMag = (2 / N) * Math.hypot(reF, imF);

  if (fundMag === 0) {
    return { components: [], thdPercent: 0 };
  }

  for (let order = 1; order <= maxOrder; order++) {
    const bin = order * cycles;
    if (bin >= N / 2) break;
    const [re, im] = X[bin];
    const mag = (2 / N) * Math.hypot(re, im);
    const phase = Math.atan2(im, re);
    components.push({
      order,
      magnitude: mag / fundMag,
      phase,
    });
  }

  // THD = √(Σ V_h²) / V_1, h ≥ 2
  let sumSq = 0;
  for (let i = 1; i < components.length; i++) {
    sumSq += components[i].magnitude ** 2;
  }
  const thdPercent = Math.sqrt(sumSq) * 100;

  return { components, thdPercent };
}

/** ENA G5/5 individual-harmonic voltage planning levels (transmission, %).
 *  Lower-voltage networks use the LV/MV table — these are the EHV values that
 *  most consultancy work references. Source: ENA EREC G5/5 (2020) Stage 3. */
export const G5_5_VOLTAGE_LIMITS_HV: Record<number, number> = {
   2: 1.0,   3: 2.0,   4: 0.8,   5: 2.0,
   6: 0.5,   7: 2.0,   8: 0.4,   9: 1.0,
  10: 0.4,  11: 1.5,  12: 0.2,  13: 1.5,
  14: 0.2,  15: 0.3,  16: 0.2,  17: 1.0,
  18: 0.2,  19: 1.0,  20: 0.2,  21: 0.2,
  22: 0.2,  23: 0.7,  24: 0.2,  25: 0.7,
};

/** Total voltage THD limit (G5/5 EHV) — 3.0%. */
export const G5_5_THD_LIMIT_HV = 3.0;
