// Smoke tests for the per-unit conversion library.

import { describe, it, expect } from 'vitest';
import {
  baseQuantities, convertPu, bulkConvert, physicalUnit,
} from '../per-unit.js';

const BASE = { baseMVA: 100, baseKV: 132 };

describe('baseQuantities', () => {
  it('Z_base = V² / S', () => {
    const { Zbase } = baseQuantities(BASE);
    expect(Zbase).toBeCloseTo(132 * 132 / 100, 6);
  });

  it('I_base 3-phase = S / (√3 V)', () => {
    const { Ibase3ph } = baseQuantities(BASE);
    expect(Ibase3ph).toBeCloseTo(100 / (Math.sqrt(3) * 132), 6);
  });

  it('I_base single-phase = S / V', () => {
    const { Ibase1ph } = baseQuantities(BASE);
    expect(Ibase1ph).toBeCloseTo(100 / 132, 6);
  });
});

describe('convertPu round-trip', () => {
  it('voltage to-pu then from-pu returns original', () => {
    const v = 130.5;
    const pu = convertPu(v, 'voltage', 'to-pu', BASE);
    const back = convertPu(pu, 'voltage', 'from-pu', BASE);
    expect(back).toBeCloseTo(v, 8);
  });

  it('current to-pu uses 3-phase Ibase by default', () => {
    const i = 0.5; // kA physical
    const pu = convertPu(i, 'current', 'to-pu', BASE);
    const expected = i / (100 / (Math.sqrt(3) * 132));
    expect(pu).toBeCloseTo(expected, 8);
  });

  it('impedance to-pu / from-pu uses Z_base = V²/S', () => {
    const z = 50; // ohms
    const pu = convertPu(z, 'impedance', 'to-pu', BASE);
    expect(pu).toBeCloseTo(z * 100 / (132 * 132), 8);
    const back = convertPu(pu, 'impedance', 'from-pu', BASE);
    expect(back).toBeCloseTo(z, 8);
  });

  it('power to-pu divides by S_base', () => {
    expect(convertPu(50, 'power', 'to-pu', BASE)).toBeCloseTo(0.5, 8);
    expect(convertPu(0.7, 'power', 'from-pu', BASE)).toBeCloseTo(70, 8);
  });
});

describe('bulkConvert', () => {
  it('preserves order and converts each row', () => {
    const out = bulkConvert(
      [{ value: 132 }, { value: 130.5 }, { value: 128 }],
      'voltage', 'to-pu', BASE,
    );
    expect(out.length).toBe(3);
    expect(out[0].converted).toBeCloseTo(1.0, 6);
    expect(out[2].converted).toBeCloseTo(128 / 132, 6);
  });
});

describe('physicalUnit', () => {
  it('returns kV / kA / Ω / MVA labels', () => {
    expect(physicalUnit('voltage')).toBe('kV');
    expect(physicalUnit('current')).toBe('kA');
    expect(physicalUnit('impedance')).toBe('Ω');
    expect(physicalUnit('power')).toBe('MVA');
    expect(physicalUnit('power', '1ph')).toBe('MVA (1ph)');
  });
});
