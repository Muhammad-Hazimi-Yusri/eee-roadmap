// src/lib/circuit/mna-solver.test.ts

import { describe, it, expect } from 'vitest';
import { solve, checkExpected } from './mna-solver.js';
import type { CircuitLesson } from './types.js';

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Round to N decimal places for comparison. */
function round(v: number, places = 4) {
  return Math.round(v * 10 ** places) / 10 ** places;
}

// ─── Ohm's Law ───────────────────────────────────────────────────────────────

describe('Ohm\'s Law circuit', () => {
  const lesson: CircuitLesson = {
    id: 'ohms-law',
    title: "Ohm's Law",
    category: 'fundamentals',
    difficulty: 'beginner',
    description: 'Single resistor with voltage source.',
    simulator: 'mna',
    components: [
      { type: 'voltage_source', id: 'V1', nodes: ['n1', 'gnd'], value: 9, unit: 'V' },
      { type: 'resistor',       id: 'R1', nodes: ['n1', 'gnd'], value: 1000, unit: 'Ω' },
      { type: 'ground',         id: 'GND', nodes: ['gnd'] },
    ],
    probes: [
      { type: 'voltage', node: 'n1', label: 'V_n1' },
      { type: 'current', component: 'V1', label: 'I_R1' },
    ],
    expected: {
      V_n1: { value: 9,     tolerance: 0.001, unit: 'V' },
      I_R1: { value: 0.009, tolerance: 0.000001, unit: 'A' },
    },
    tutorial: { steps: [] },
  };

  it('node voltage equals supply voltage', () => {
    const result = solve(lesson);
    expect(round(result.nodeVoltages['n1'])).toBe(9);
  });

  it('current = V/R (Ohm\'s Law)', () => {
    const result = solve(lesson);
    // I = 9V / 1000Ω = 9 mA = 0.009 A
    expect(round(result.probeValues['I_R1'], 6)).toBe(0.009);
  });

  it('ground node is 0 V', () => {
    const result = solve(lesson);
    expect(result.nodeVoltages['gnd']).toBe(0);
  });

  it('all expected values pass tolerance check', () => {
    const result = solve(lesson);
    const check = checkExpected(result, lesson.expected);
    expect(check.pass).toBe(true);
    expect(check.failures).toHaveLength(0);
  });

  it('honours component override (R1 = 4500 Ω → I = 2 mA)', () => {
    // V=9V, R=4500Ω → I = 9/4500 = 0.002 A
    const result = solve(lesson, { R1: 4500 });
    expect(round(result.probeValues['I_R1'], 6)).toBe(0.002);
  });
});

// ─── Voltage Divider ─────────────────────────────────────────────────────────

describe('Voltage Divider circuit', () => {
  // V1=10V, R1=1kΩ (n1→n2), R2=2kΩ (n2→gnd)
  // Vout = 10 × 2/(1+2) = 6.6667 V
  const lesson: CircuitLesson = {
    id: 'voltage-divider',
    title: 'Voltage Divider',
    category: 'fundamentals',
    difficulty: 'beginner',
    description: 'Two resistors divide voltage proportionally.',
    simulator: 'mna',
    components: [
      { type: 'voltage_source', id: 'V1', nodes: ['n1', 'gnd'], value: 10,   unit: 'V' },
      { type: 'resistor',       id: 'R1', nodes: ['n1', 'n2'], value: 1000,  unit: 'Ω' },
      { type: 'resistor',       id: 'R2', nodes: ['n2', 'gnd'], value: 2000, unit: 'Ω' },
      { type: 'ground',         id: 'GND', nodes: ['gnd'] },
    ],
    probes: [
      { type: 'voltage', node: 'n1', label: 'Vin' },
      { type: 'voltage', node: 'n2', label: 'Vout' },
    ],
    expected: {
      Vin:  { value: 10,    tolerance: 0.001, unit: 'V' },
      Vout: { value: 6.667, tolerance: 0.01,  unit: 'V' },
    },
    tutorial: { steps: [] },
  };

  it('Vin = 10 V', () => {
    const result = solve(lesson);
    expect(round(result.nodeVoltages['n1'])).toBe(10);
  });

  it('Vout = Vin × R2/(R1+R2) = 6.6667 V', () => {
    const result = solve(lesson);
    expect(round(result.probeValues['Vout'], 4)).toBe(6.6667);
  });

  it('all expected values pass tolerance check', () => {
    const result = solve(lesson);
    const check = checkExpected(result, lesson.expected);
    expect(check.pass).toBe(true);
  });

  it('changing R2 to 1kΩ makes Vout = 5 V (equal divider)', () => {
    const result = solve(lesson, { R2: 1000 });
    expect(round(result.probeValues['Vout'])).toBe(5);
  });
});

// ─── Series-Parallel (KCL) ───────────────────────────────────────────────────

describe('Series-Parallel (KCL) circuit', () => {
  // V1=12V, R1=1kΩ series, R2=2kΩ ‖ R3=3kΩ parallel load
  // R_parallel = (2000×3000)/(2000+3000) = 1200Ω
  // Total R = 1000 + 1200 = 2200Ω
  // I_total = 12/2200 ≈ 5.4545 mA
  // Vout (across R2||R3) = I_total × R_parallel ≈ 6.5455 V
  // I_R2 = Vout/2000 ≈ 3.2727 mA
  // I_R3 = Vout/3000 ≈ 2.1818 mA
  const lesson: CircuitLesson = {
    id: 'kvl-kcl',
    title: 'KVL and KCL',
    category: 'fundamentals',
    difficulty: 'beginner',
    description: 'Series-parallel circuit demonstrating KVL and KCL.',
    simulator: 'mna',
    components: [
      { type: 'voltage_source', id: 'V1', nodes: ['n1', 'gnd'], value: 12,   unit: 'V' },
      { type: 'resistor',       id: 'R1', nodes: ['n1', 'n2'], value: 1000,  unit: 'Ω' },
      { type: 'resistor',       id: 'R2', nodes: ['n2', 'gnd'], value: 2000, unit: 'Ω' },
      { type: 'resistor',       id: 'R3', nodes: ['n2', 'gnd'], value: 3000, unit: 'Ω' },
      { type: 'ground',         id: 'GND', nodes: ['gnd'] },
    ],
    probes: [
      { type: 'voltage', node: 'n1', label: 'V_source' },
      { type: 'voltage', node: 'n2', label: 'V_junction' },
    ],
    expected: {
      V_source:  { value: 12,     tolerance: 0.001, unit: 'V' },
      V_junction: { value: 6.545, tolerance: 0.01,  unit: 'V' },
    },
    tutorial: { steps: [] },
  };

  it('source node = 12 V', () => {
    const result = solve(lesson);
    expect(round(result.nodeVoltages['n1'])).toBe(12);
  });

  it('junction voltage ≈ 6.5455 V (KVL)', () => {
    const result = solve(lesson);
    // Vout = 12 × 1200/2200 = 6.5455…
    const expected = 12 * (1 / (1 / 2000 + 1 / 3000)) / (1000 + 1 / (1 / 2000 + 1 / 3000));
    expect(Math.abs(result.nodeVoltages['n2'] - expected)).toBeLessThan(0.0001);
  });

  it('KCL holds at junction: I_R1 ≈ I_R2 + I_R3', () => {
    const result = solve(lesson);
    const vn2 = result.nodeVoltages['n2'];
    const vn1 = result.nodeVoltages['n1'];
    const iR1 = (vn1 - vn2) / 1000;
    const iR2 = vn2 / 2000;
    const iR3 = vn2 / 3000;
    // KCL: current into n2 = current out of n2
    expect(Math.abs(iR1 - (iR2 + iR3))).toBeLessThan(1e-10);
  });
});
