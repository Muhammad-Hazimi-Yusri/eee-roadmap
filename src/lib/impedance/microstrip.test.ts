// src/lib/impedance/microstrip.test.ts

import { describe, it, expect } from 'vitest';
import { microstripZ0 } from './microstrip.js';

/** Round to N significant decimal places. */
function round(v: number, places = 2) {
  return Math.round(v * 10 ** places) / 10 ** places;
}

describe('microstripZ0', () => {
  // ─── Validation / null returns ──────────────────────────────────────────────

  it('returns null for zero width', () => {
    expect(microstripZ0({ w: 0, h: 1.6e-3, t: 35e-6, er: 4.4 })).toBeNull();
  });

  it('returns null for negative height', () => {
    expect(microstripZ0({ w: 1e-3, h: -1e-3, t: 35e-6, er: 4.4 })).toBeNull();
  });

  it('returns null for zero thickness', () => {
    expect(microstripZ0({ w: 1e-3, h: 1.6e-3, t: 0, er: 4.4 })).toBeNull();
  });

  it('returns null for er < 1', () => {
    expect(microstripZ0({ w: 1e-3, h: 1.6e-3, t: 35e-6, er: 0.9 })).toBeNull();
  });

  // ─── 50 Ω reference case (wide-trace branch, W/H ≈ 1.9) ────────────────────
  // Standard FR4: 50 Ω microstrip on 1.6 mm substrate → W ≈ 3.0 mm (W/H = 1.875)

  it('50 Ω: FR4 W=3.0mm H=1.6mm T=35µm er=4.4', () => {
    const result = microstripZ0({ w: 3.0e-3, h: 1.6e-3, t: 35e-6, er: 4.4 });
    expect(result).not.toBeNull();
    expect(round(result!.z0, 1)).toBeGreaterThanOrEqual(48);
    expect(round(result!.z0, 1)).toBeLessThanOrEqual(53);
  });

  // ─── 75 Ω reference case (narrow-trace branch, W/H < 1) ────────────────────
  // FR4 1.6mm substrate: W=1.3mm → Z0 ≈ 74–79 Ω

  it('~75 Ω: FR4 W=1.3mm H=1.6mm T=35µm er=4.4', () => {
    const result = microstripZ0({ w: 1.3e-3, h: 1.6e-3, t: 35e-6, er: 4.4 });
    expect(result).not.toBeNull();
    expect(round(result!.z0, 1)).toBeGreaterThanOrEqual(72);
    expect(round(result!.z0, 1)).toBeLessThanOrEqual(82);
  });

  // ─── Wide trace (W/H > 1) ──────────────────────────────────────────────────

  it('wide trace regime: W=3.0mm H=0.8mm T=35µm er=4.4 → low Z0', () => {
    const result = microstripZ0({ w: 3.0e-3, h: 0.8e-3, t: 35e-6, er: 4.4 });
    expect(result).not.toBeNull();
    // W/H = 3.75 → well below 50 Ω
    expect(result!.z0).toBeLessThan(40);
  });

  // ─── erEff is between 1 and er ─────────────────────────────────────────────

  it('erEff is between 1 and er', () => {
    const result = microstripZ0({ w: 3.0e-3, h: 1.6e-3, t: 35e-6, er: 4.4 });
    expect(result).not.toBeNull();
    expect(result!.erEff).toBeGreaterThan(1);
    expect(result!.erEff).toBeLessThan(4.4);
  });

  // ─── Rogers 4003C high-speed case ──────────────────────────────────────────
  // Rogers 4003C (er=3.55), 0.508mm substrate, 1oz copper → W≈1.1mm for ~50 Ω

  it('Rogers 4003C: W=1.1mm H=0.508mm T=35µm er=3.55 → ~50 Ω', () => {
    const result = microstripZ0({ w: 1.1e-3, h: 0.508e-3, t: 35e-6, er: 3.55 });
    expect(result).not.toBeNull();
    expect(round(result!.z0, 1)).toBeGreaterThanOrEqual(47);
    expect(round(result!.z0, 1)).toBeLessThanOrEqual(54);
  });
});
