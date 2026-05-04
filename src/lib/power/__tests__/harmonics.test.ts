// Smoke tests for harmonic synthesis & FFT. Verify the spectrum recovers
// the harmonics that were used to synthesise the waveform.

import { describe, it, expect } from 'vitest';
import {
  synthesizeWaveform, analyzeWaveform, G5_5_VOLTAGE_LIMITS_HV,
} from '../harmonics.js';

describe('analyzeWaveform', () => {
  it('a pure fundamental has THD = 0', () => {
    const samples = synthesizeWaveform([{ order: 1, magnitude: 1, phase: 0 }], 256);
    const sp = analyzeWaveform(samples);
    expect(sp.thdPercent).toBeLessThan(1e-6);
    expect(sp.components[0].order).toBe(1);
    expect(sp.components[0].magnitude).toBeCloseTo(1, 5);
  });

  it('round-trips a 5th-harmonic injection', () => {
    const samples = synthesizeWaveform([
      { order: 1, magnitude: 1, phase: 0 },
      { order: 5, magnitude: 0.2, phase: 0 },
    ], 512);
    const sp = analyzeWaveform(samples);
    expect(sp.components[4].order).toBe(5);
    expect(sp.components[4].magnitude).toBeCloseTo(0.2, 4);
    // THD = 20% (a single 5th at 0.2 of fundamental)
    expect(sp.thdPercent).toBeCloseTo(20, 2);
  });

  it('square-wave-like odd harmonics reproduce the textbook 48.3% THD', () => {
    const harmonics = [];
    for (let h = 1; h <= 25; h += 2) {
      harmonics.push({ order: h, magnitude: 1 / h, phase: 0 });
    }
    const samples = synthesizeWaveform(harmonics, 1024);
    const sp = analyzeWaveform(samples, 25);
    // Truncated square wave (odd harmonics 1..25, 1/h amplitude) → THD ≈ 47%.
    // Exact infinite series gives π²/8 − 1 ≈ 23.4% in V², so √0.234 ≈ 48.3%.
    expect(sp.thdPercent).toBeGreaterThan(45);
    expect(sp.thdPercent).toBeLessThan(50);
  });

  it('G5/5 EHV limit table contains expected planning levels', () => {
    expect(G5_5_VOLTAGE_LIMITS_HV[5]).toBe(2.0);  // 5th harmonic
    expect(G5_5_VOLTAGE_LIMITS_HV[7]).toBe(2.0);
    expect(G5_5_VOLTAGE_LIMITS_HV[11]).toBe(1.5);
  });
});
