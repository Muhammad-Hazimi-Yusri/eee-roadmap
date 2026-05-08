// Smoke tests for IEC 60255 inverse-time relay model.

import { describe, it, expect } from 'vitest';
import {
  operatingTime, curvePoints, discriminationMargin,
  type RelaySettings,
} from '../protection.js';

const SI: RelaySettings = {
  name: 'R', pickupA: 100, tms: 0.1, curve: 'SI', color: '#000',
};

describe('IEC inverse-time curves', () => {
  it('does not operate at or below pickup', () => {
    expect(operatingTime(SI, 99)).toBe(Infinity);
    expect(operatingTime(SI, 100)).toBe(Infinity);
  });

  it('Standard Inverse: t = TMS · 0.14 / ((I/Is)^0.02 − 1)', () => {
    // At I/Is = 2: t = 0.1 · 0.14 / (2^0.02 − 1) ≈ 1.0061 s
    const t = operatingTime(SI, 200);
    expect(t).toBeCloseTo(1.0061, 2);
  });

  it('higher TMS scales operating time linearly', () => {
    const t1 = operatingTime({ ...SI, tms: 0.10 }, 1000);
    const t2 = operatingTime({ ...SI, tms: 0.20 }, 1000);
    expect(t2 / t1).toBeCloseTo(2, 6);
  });

  it('Extremely Inverse is faster than Standard Inverse at high current', () => {
    const tSI = operatingTime({ ...SI, curve: 'SI' }, 5000);
    const tEI = operatingTime({ ...SI, curve: 'EI' }, 5000);
    expect(tEI).toBeLessThan(tSI);
  });

  it('curvePoints returns finite, monotonically decreasing times', () => {
    const pts = curvePoints(SI, 110, 10000, 50);
    expect(pts.length).toBeGreaterThan(20);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].t).toBeLessThanOrEqual(pts[i - 1].t);
    }
  });

  it('discrimination margin: upstream relay operates after downstream', () => {
    const downstream: RelaySettings = { ...SI, tms: 0.10, pickupA: 100 };
    const upstream:   RelaySettings = { ...SI, tms: 0.30, pickupA: 200 };
    const margin = discriminationMargin(downstream, upstream, 1000);
    expect(margin).toBeGreaterThan(0);
  });

  it('definite-time / instantaneous element overrides inverse-time at high current', () => {
    const r: RelaySettings = {
      ...SI,
      instantaneousMultiplier: 8,
      instantaneousDelay: 0.02,
    };
    expect(operatingTime(r, 800)).toBeCloseTo(0.02, 6);  // I/Is = 8 → instant
    expect(operatingTime(r, 200)).toBeGreaterThan(0.05); // below threshold → inverse-time
  });
});
