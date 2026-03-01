// PerUnitConverter.tsx — interactive per-unit system calculator.
// client:idle — no solver dependency.
import { useState } from 'react';

type Quantity = 'voltage' | 'current' | 'impedance' | 'power';
type Mode     = 'to-pu' | 'from-pu';
type Phase    = '3ph' | '1ph';

interface State {
  quantity: Quantity;
  mode: Mode;
  phase: Phase;
  physical: string;
  pu: string;
  baseMVA: string;
  baseKV: string;
}

const DEFAULTS: State = {
  quantity: 'voltage',
  mode: 'to-pu',
  phase: '3ph',
  physical: '132',
  pu: '',
  baseMVA: '100',
  baseKV: '132',
};

export default function PerUnitConverter() {
  const [s, setS] = useState<State>(DEFAULTS);

  const baseMVA = parseFloat(s.baseMVA) || 100;
  const baseKV  = parseFloat(s.baseKV)  || 132;

  // Derived base quantities
  const Zbase  = (baseKV * baseKV) / baseMVA;                  // Ω
  const Ibase  = baseMVA / (Math.sqrt(3) * baseKV);             // kA (3-ph)  or  baseMVA/baseKV (1-ph)
  const Ibase1 = baseMVA / baseKV;                               // kA (1-ph)
  const Sbase  = baseMVA;                                        // MVA

  function compute(field: 'physical' | 'pu', raw: string) {
    const v = parseFloat(raw);
    if (!isFinite(v)) {
      setS(prev => ({ ...prev, [field]: raw, pu: '', physical: field === 'pu' ? prev.physical : raw }));
      return;
    }

    let physical = field === 'physical' ? v : NaN;
    let pu       = field === 'pu'       ? v : NaN;

    switch (s.quantity) {
      case 'voltage':
        if (field === 'physical') pu       = v / baseKV;
        else                      physical = v * baseKV;
        break;
      case 'current': {
        const iBase = s.phase === '3ph' ? Ibase : Ibase1;
        if (field === 'physical') pu       = v / iBase;
        else                      physical = v * iBase;
        break;
      }
      case 'impedance':
        if (field === 'physical') pu       = v / Zbase;
        else                      physical = v * Zbase;
        break;
      case 'power':
        if (field === 'physical') pu       = v / Sbase;
        else                      physical = v * Sbase;
        break;
    }

    setS(prev => ({
      ...prev,
      [field]: raw,
      pu:       field === 'pu'       ? raw : pu.toFixed(5),
      physical: field === 'physical' ? raw : physical.toFixed(4),
    }));
  }

  const unitLabel: Record<Quantity, { phys: string; pu: string }> = {
    voltage:   { phys: 'kV',  pu: 'pu' },
    current:   { phys: 'kA',  pu: 'pu' },
    impedance: { phys: 'Ω',   pu: 'pu' },
    power:     { phys: 'MVA', pu: 'pu' },
  };

  const set = (k: keyof State) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setS(prev => ({ ...prev, [k]: e.target.value, pu: '', physical: '' }));

  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)',
      maxWidth: 560,
    }}>
      {/* Controls row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <Select label="Quantity" value={s.quantity} onChange={set('quantity')}>
          <option value="voltage">Voltage (kV)</option>
          <option value="current">Current (kA)</option>
          <option value="impedance">Impedance (Ω)</option>
          <option value="power">Power (MVA)</option>
        </Select>
        <Select label="Phase" value={s.phase} onChange={set('phase')}>
          <option value="3ph">3-phase</option>
          <option value="1ph">1-phase</option>
        </Select>
      </div>

      {/* Base quantities */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <NumField label="S_base" value={s.baseMVA}
          onChange={e => setS(prev => ({ ...prev, baseMVA: e.target.value, pu: '', physical: '' }))}
          unit="MVA" />
        <NumField label="V_base" value={s.baseKV}
          onChange={e => setS(prev => ({ ...prev, baseKV: e.target.value, pu: '', physical: '' }))}
          unit="kV" />
      </div>

      {/* Derived bases display */}
      <div style={{
        background: 'var(--color-bg-grid, #0002)',
        border: '1px solid var(--color-border)',
        borderRadius: 4, padding: '8px 12px', marginBottom: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px',
        fontSize: '0.76rem',
      }}>
        <BaseRow label="Z_base" value={Zbase.toFixed(3)} unit="Ω"
          formula={`${baseKV}² / ${baseMVA}`} />
        <BaseRow label="I_base (3φ)" value={Ibase.toFixed(4)} unit="kA"
          formula={`${baseMVA} / (√3 × ${baseKV})`} />
        <BaseRow label="I_base (1φ)" value={Ibase1.toFixed(4)} unit="kA"
          formula={`${baseMVA} / ${baseKV}`} />
        <BaseRow label="S_base" value={Sbase.toFixed(0)} unit="MVA" formula="" />
      </div>

      {/* Conversion fields */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <NumField
          label={`Physical (${unitLabel[s.quantity].phys})`}
          value={s.physical}
          onChange={e => compute('physical', e.target.value)}
          unit={unitLabel[s.quantity].phys}
        />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>⇔</span>
        <NumField
          label="Per-unit (pu)"
          value={s.pu}
          onChange={e => compute('pu', e.target.value)}
          unit="pu"
        />
      </div>

      {/* Change-of-base section */}
      <ChangeOfBase baseMVA={baseMVA} baseKV={baseKV} Zbase={Zbase} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Select({ label, value, onChange, children }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{label}</span>
      <select value={value} onChange={onChange} style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
        background: 'var(--color-bg)', color: 'var(--color-text)',
        border: '1px solid var(--color-border)', borderRadius: 3, padding: '3px 6px',
      }}>
        {children}
      </select>
    </label>
  );
}

function NumField({ label, value, onChange, unit }: {
  label: string; value: string; unit: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number" value={value} onChange={onChange}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', width: 100,
            background: 'var(--color-bg)', color: 'var(--color-text)',
            border: '1px solid var(--color-border)', borderRadius: 3, padding: '3px 6px',
          }}
        />
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{unit}</span>
      </div>
    </label>
  );
}

function BaseRow({ label, value, unit, formula }: {
  label: string; value: string; unit: string; formula: string;
}) {
  return (
    <>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span>
        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{value} {unit}</span>
        {formula && <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>= {formula}</span>}
      </span>
    </>
  );
}

function ChangeOfBase({ baseMVA, baseKV, Zbase: _Zbase }: { baseMVA: number; baseKV: number; Zbase: number }) {
  const [zOld, setZOld] = useState('0.1');
  const [oldMVA, setOldMVA] = useState('100');
  const [oldKV,  setOldKV]  = useState('11');

  const zPuOld = parseFloat(zOld)  || 0;
  const sMVAOld = parseFloat(oldMVA) || 100;
  const vKVOld  = parseFloat(oldKV)  || 11;

  // Z_pu_new = Z_pu_old × (S_base_new / S_base_old) × (V_base_old / V_base_new)²
  const zNew = zPuOld * (baseMVA / sMVAOld) * Math.pow(vKVOld / baseKV, 2);

  return (
    <div style={{
      marginTop: 20, padding: '10px 12px',
      border: '1px solid var(--color-border)', borderRadius: 4,
    }}>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginBottom: 8 }}>
        Change of Base: Z_pu_new = Z_pu_old × (S_new/S_old) × (V_old/V_new)²
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <NumField label="Z_pu (old base)" value={zOld}
          onChange={e => setZOld(e.target.value)} unit="pu" />
        <NumField label="Old S_base" value={oldMVA}
          onChange={e => setOldMVA(e.target.value)} unit="MVA" />
        <NumField label="Old V_base" value={oldKV}
          onChange={e => setOldKV(e.target.value)} unit="kV" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
            Z_pu (new base: {baseMVA} MVA, {baseKV} kV)
          </span>
          <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
            {zNew.toFixed(6)} pu
          </span>
        </div>
      </div>
    </div>
  );
}
