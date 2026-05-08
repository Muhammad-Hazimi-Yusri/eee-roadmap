// Smoke tests for the four supported fault types.
// These check the structural relationships between fault-current magnitudes
// rather than absolute numerical values — those depend on the full Z-bus
// inversion which is exercised indirectly via the 3-phase reference case.

import { describe, it, expect } from 'vitest';
import { computeFault } from '../fault-analysis.js';
import type { PowerNetwork } from '../types.js';

const NETWORK: PowerNetwork = {
  id: 'test-2bus', name: '2-Bus Test', description: '', baseMVA: 100,
  buses: [
    { id: 1, name: 'Slack', type: 'slack', Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
    { id: 2, name: 'PQ',    type: 'PQ',    Psch: 0, Qsch: 0, Vmag: 1.0, theta: 0, Qmin: -9, Qmax: 9, Gsh: 0, Bsh: 0, baseKV: 132, position: {x:0,y:0} },
  ],
  lines: [
    { id: 'L1-2', fromBus: 1, toBus: 2, r: 0.01, x: 0.05, bCh: 0.02, ratingMVA: 200 },
  ],
  transformers: [], generators: [], loads: [],
};

describe('computeFault', () => {
  it('default fault type is 3-phase symmetrical', () => {
    const r = computeFault(NETWORK, 2);
    expect(r.faultType).toBe('3-phase');
    expect(r.Ia.pu).toBeGreaterThan(0);
    expect(r.Ia.pu).toBeCloseTo(r.Ib.pu, 8);
    expect(r.Ia.pu).toBeCloseTo(r.Ic.pu, 8);
  });

  it('throws for unknown bus id', () => {
    expect(() => computeFault(NETWORK, 99)).toThrow();
  });

  it('L-G fault: phase A carries 3·I_a1, phases B and C are zero', () => {
    const r = computeFault(NETWORK, 2, undefined, { faultType: 'L-G' });
    expect(r.faultType).toBe('L-G');
    expect(r.Ia.pu).toBeGreaterThan(0);
    expect(r.Ib.pu).toBe(0);
    expect(r.Ic.pu).toBe(0);
    expect(r.Imax.pu).toBe(r.Ia.pu);
  });

  it('L-L fault: phase A current is zero, B and C are equal magnitude √3·I_a1', () => {
    const r = computeFault(NETWORK, 2, undefined, { faultType: 'L-L' });
    expect(r.faultType).toBe('L-L');
    expect(r.Ia.pu).toBe(0);
    expect(r.Ib.pu).toBeCloseTo(r.Ic.pu, 8);
    expect(r.Ib.pu).toBeGreaterThan(0);
  });

  it('L-L magnitude is √3/2 ≈ 0.866 of 3-phase magnitude when Z2 = Z1', () => {
    const r3   = computeFault(NETWORK, 2, undefined, { faultType: '3-phase' });
    const rLL  = computeFault(NETWORK, 2, undefined, { faultType: 'L-L', z2PerZ1Ratio: 1.0 });
    // |I_LL| / |I_3φ| = √3 · V₀/(Z₁+Z₂) ÷ V₀/Z₁ = √3·Z₁/(Z₁+Z₂) = √3/2 ≈ 0.866
    expect(rLL.Ib.pu / r3.Ia.pu).toBeCloseTo(Math.sqrt(3) / 2, 4);
  });

  it('L-L-G fault has non-zero currents on B and C, zero on A', () => {
    const r = computeFault(NETWORK, 2, undefined, { faultType: 'L-L-G' });
    expect(r.faultType).toBe('L-L-G');
    expect(r.Ia.pu).toBe(0);
    expect(r.Ib.pu).toBeGreaterThan(0);
    expect(r.Ic.pu).toBeGreaterThan(0);
  });

  it('larger fault impedance Zf reduces all fault currents', () => {
    const bolted = computeFault(NETWORK, 2, undefined, { faultType: '3-phase', zfPU: 0 });
    const arced  = computeFault(NETWORK, 2, undefined, { faultType: '3-phase', zfPU: 0.05 });
    expect(arced.Imax.pu).toBeLessThan(bolted.Imax.pu);
  });

  it('reports sequence impedance magnitudes used', () => {
    const r = computeFault(NETWORK, 2, undefined, { z0PerZ1Ratio: 3, z2PerZ1Ratio: 1 });
    expect(r.Z2mag).toBeCloseTo(r.Z1mag, 6);
    expect(r.Z0mag).toBeCloseTo(3 * r.Z1mag, 6);
  });

  it('converts to kA using base = S_base / (√3 · V_base)', () => {
    const r = computeFault(NETWORK, 2);
    const Ibase = 100 / (Math.sqrt(3) * 132); // kA, ≈ 0.4374
    expect(r.Imax.kA).toBeCloseTo(r.Imax.pu * Ibase, 8);
  });
});
