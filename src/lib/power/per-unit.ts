// src/lib/power/per-unit.ts
// Per-unit system conversions shared by the PerUnitConverter lab and the
// bulk-per-unit Tool. All conversions are between physical units and per-unit
// on a chosen system base (S_base in MVA, V_base in kV).
//
//   V_base = V_base_kV
//   I_base_3ph = S_base / (√3 · V_base)
//   I_base_1ph = S_base / V_base
//   Z_base = V_base² / S_base
//   S_base = S_base_MVA

export type PuQuantity = 'voltage' | 'current' | 'impedance' | 'power';
export type PuPhase    = '3ph' | '1ph';
export type PuDirection = 'to-pu' | 'from-pu';

export interface PuBase {
  /** System MVA base. */
  baseMVA: number;
  /** System line-line voltage base, kV. */
  baseKV: number;
}

export function baseQuantities(b: PuBase): {
  Zbase: number;       // ohms
  Ibase3ph: number;    // kA
  Ibase1ph: number;    // kA
  Sbase: number;       // MVA
} {
  const baseMVA = b.baseMVA || 100;
  const baseKV  = b.baseKV  || 132;
  return {
    Zbase:    (baseKV * baseKV) / baseMVA,
    Ibase3ph: baseMVA / (Math.sqrt(3) * baseKV),
    Ibase1ph: baseMVA / baseKV,
    Sbase:    baseMVA,
  };
}

/** Convert one value between physical and per-unit. */
export function convertPu(
  value: number,
  quantity: PuQuantity,
  direction: PuDirection,
  base: PuBase,
  phase: PuPhase = '3ph',
): number {
  const { Zbase, Ibase3ph, Ibase1ph, Sbase } = baseQuantities(base);
  const Ibase = phase === '3ph' ? Ibase3ph : Ibase1ph;

  switch (quantity) {
    case 'voltage':
      return direction === 'to-pu' ? value / base.baseKV  : value * base.baseKV;
    case 'current':
      return direction === 'to-pu' ? value / Ibase        : value * Ibase;
    case 'impedance':
      return direction === 'to-pu' ? value / Zbase        : value * Zbase;
    case 'power':
      return direction === 'to-pu' ? value / Sbase        : value * Sbase;
  }
}

/** Bulk-convert an array of {value, quantity?} rows. Quantity defaults to the
 *  outer `quantity` argument. */
export interface PuRow {
  value: number;
  quantity?: PuQuantity;
}

export function bulkConvert(
  rows: PuRow[],
  defaultQuantity: PuQuantity,
  direction: PuDirection,
  base: PuBase,
  phase: PuPhase = '3ph',
): { value: number; converted: number; quantity: PuQuantity }[] {
  return rows.map(r => {
    const q = r.quantity ?? defaultQuantity;
    return {
      value: r.value,
      converted: convertPu(r.value, q, direction, base, phase),
      quantity: q,
    };
  });
}

/** Physical unit label for each quantity. */
export function physicalUnit(q: PuQuantity, phase: PuPhase = '3ph'): string {
  switch (q) {
    case 'voltage':   return 'kV';
    case 'current':   return 'kA';
    case 'impedance': return 'Ω';
    case 'power':     return phase === '3ph' ? 'MVA' : 'MVA (1ph)';
  }
}
