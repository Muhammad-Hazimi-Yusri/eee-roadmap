import { describe, it, expect } from 'vitest';
import {
  rfgProfile, limitAt, FRT_CURVES, mustRideThrough, dipVoltageAt,
  droopResponse, lfsmResponse, LFSM_SETTINGS, fsmResponse,
  initialRocof, inertiaForRocof, storedEnergy, slopeQ, qOverPAtPf,
} from '../curves';

const curve = (id: string) => {
  const c = FRT_CURVES.find(x => x.id === id);
  if (!c) throw new Error(`no curve ${id}`);
  return c.points;
};

describe('rfgProfile + limitAt', () => {
  it('reproduces the GB PPM <110 kV ramp: 0.1 pu to 140 ms, 0.85 pu at 2.2 s', () => {
    const pts = curve('gb-ppm-lt110');
    expect(limitAt(pts, 0.1)).toBeCloseTo(0.1);
    expect(limitAt(pts, 0.14)).toBeCloseTo(0.1);
    expect(limitAt(pts, 2.2)).toBeCloseTo(0.85);
    // halfway along the ramp
    expect(limitAt(pts, (0.14 + 2.2) / 2)).toBeCloseTo((0.1 + 0.85) / 2);
    expect(limitAt(pts, 3.4)).toBeCloseTo(0.85);
  });

  it('GB Type B synchronous: steps to 0.7 at clearance, holds to 0.45 s, ramps to 0.9 at 1.5 s', () => {
    const pts = curve('gb-sync-b');
    expect(limitAt(pts, 0.1)).toBeCloseTo(0.3);
    expect(limitAt(pts, 0.14)).toBeCloseTo(0.7);   // step: the stricter side applies at the edge
    expect(limitAt(pts, 0.3)).toBeCloseTo(0.7);
    expect(limitAt(pts, 0.45)).toBeCloseTo(0.7);
    expect(limitAt(pts, 1.5)).toBeCloseTo(0.9);
  });

  it('GB Type D synchronous at 110 kV+: 0 pu, step to 0.25, ramp to 0.5 by 0.25 s', () => {
    const pts = curve('gb-sync-d110');
    expect(limitAt(pts, 0.13)).toBeCloseTo(0);
    expect(limitAt(pts, 0.14)).toBeCloseTo(0.25);
    expect(limitAt(pts, 0.25)).toBeCloseTo(0.5);
    expect(limitAt(pts, 0.4)).toBeCloseTo(0.5);
  });

  it('IE non-RfG PPM: 15% for 625 ms then linear to 90% at 3 s', () => {
    const pts = curve('ie-ppm-nonrfg');
    expect(limitAt(pts, 0.6)).toBeCloseTo(0.15);
    expect(limitAt(pts, 3.0)).toBeCloseTo(0.9);
  });

  it('synchronous condenser profile is stepped 0 / 0.5 / 0.9', () => {
    const pts = curve('ie-scu');
    expect(limitAt(pts, 0.1)).toBe(0);
    expect(limitAt(pts, 0.3)).toBe(0.5);
    expect(limitAt(pts, 1)).toBe(0.9);
  });

  it('every curve is non-decreasing in time and stays within 0..1 pu', () => {
    for (const c of FRT_CURVES) {
      for (let i = 1; i < c.points.length; i++) {
        expect(c.points[i].t, c.id).toBeGreaterThanOrEqual(c.points[i - 1].t);
      }
      for (const p of c.points) {
        expect(p.u, c.id).toBeGreaterThanOrEqual(0);
        expect(p.u, c.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rfgProfile extends to tEnd', () => {
    const pts = rfgProfile({ Uret: 0, tclear: 0.15, Uclear: 0, trec1: 0.15, Urec1: 0, trec2: 0.15, Urec2: 0.85, trec3: 3 }, 5);
    expect(pts[pts.length - 1].t).toBe(5);
  });
});

describe('mustRideThrough', () => {
  const zeroVolt150 = { retained: 0, duration: 0.15, recovery: 0.05, final: 1 };

  it('a 0 pu, 150 ms dip must be ridden through under the IE RfG PPM curve', () => {
    expect(mustRideThrough(curve('ie-ppm-rfg'), zeroVolt150)).toBe(true);
  });

  it('the same dip falls below the GB PPM <110 kV curve (0.1 pu retained), so disconnection is allowed', () => {
    expect(mustRideThrough(curve('gb-ppm-lt110'), zeroVolt150)).toBe(false);
  });

  it('a slow recovery that sits under the ramp is outside the envelope', () => {
    const slow = { retained: 0.2, duration: 0.14, recovery: 0, final: 0.5 };
    expect(mustRideThrough(curve('gb-ppm-lt110'), slow)).toBe(false);
  });

  it('dipVoltageAt follows the dip shape', () => {
    expect(dipVoltageAt(zeroVolt150, -0.1)).toBe(1);
    expect(dipVoltageAt(zeroVolt150, 0.1)).toBe(0);
    expect(dipVoltageAt(zeroVolt150, 0.175)).toBeCloseTo(0.5);
    expect(dipVoltageAt(zeroVolt150, 1)).toBe(1);
  });
});

describe('frequency response', () => {
  it('10% droop = 2% per 0.1 Hz and 4% droop = 5% per 0.1 Hz', () => {
    expect(droopResponse(0.1, 10)).toBeCloseTo(0.02);
    expect(droopResponse(0.1, 4)).toBeCloseTo(0.05);
  });

  it('GB LFSM-O starts at 50.4 Hz; IE starts at 50.2 Hz', () => {
    const gb = LFSM_SETTINGS.find(s => s.id === 'gb-lfsm-o')!;
    const ie = LFSM_SETTINGS.find(s => s.id === 'ie-lfsm-o')!;
    expect(lfsmResponse(50.3, gb)).toBe(0);
    expect(lfsmResponse(50.5, gb)).toBeCloseTo(-0.02);
    expect(lfsmResponse(50.3, ie)).toBeCloseTo(-0.05);
  });

  it('LFSM-U raises output below the threshold', () => {
    const gb = LFSM_SETTINGS.find(s => s.id === 'gb-lfsm-u')!;
    expect(lfsmResponse(49.6, gb)).toBe(0);
    expect(lfsmResponse(49.4, gb)).toBeCloseTo(0.02);
  });

  it('FSM measured from nominal delivers db/(f0·s) more than measured from the deadband edge', () => {
    const f = 49.9;
    const edge = fsmResponse(f, 4, 0.015, 'edge');
    const nominal = fsmResponse(f, 4, 0.015, 'nominal');
    expect(nominal - edge).toBeCloseTo((0.015 / 50) / 0.04);
    expect(fsmResponse(50.01, 4, 0.015, 'nominal')).toBe(0);
  });
});

describe('inertia and RoCoF', () => {
  it('df/dt = ΔP·f0 / (2·Ek)', () => {
    expect(initialRocof(1000, 25_000)).toBeCloseTo(1.0);
    expect(initialRocof(1800, 120_000)).toBeCloseTo(0.375);
  });

  it('inertiaForRocof inverts initialRocof', () => {
    const ek = inertiaForRocof(700, 0.5);
    expect(initialRocof(700, ek)).toBeCloseTo(0.5);
  });

  it('storedEnergy is H·S', () => {
    expect(storedEnergy(4, 250)).toBe(1000);
  });
});

describe('voltage control', () => {
  it('slope: Q reaches its limit when V moves by the slope from setpoint', () => {
    expect(slopeQ(1.0, 1.0, 4)).toBe(0);
    expect(slopeQ(0.98, 1.0, 4)).toBeCloseTo(0.5);
    expect(slopeQ(0.9, 1.0, 4)).toBe(1);
    expect(slopeQ(1.1, 1.0, 4, 0.5)).toBe(-0.5);
  });

  it('0.95 pf ≈ 0.33 Q/P', () => {
    expect(qOverPAtPf(0.95)).toBeCloseTo(0.3287, 3);
  });
});
