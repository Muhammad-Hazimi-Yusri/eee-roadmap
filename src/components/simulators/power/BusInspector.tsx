// BusInspector.tsx — click-to-inspect panel for a single bus result.
import type { BusResult, Bus } from '../../../lib/power/types.js';

interface Props {
  bus: Bus;
  result: BusResult;
  baseMVA: number;
  onClose: () => void;
}

export default function BusInspector({ bus, result, baseMVA, onClose }: Props) {
  const thetaDeg = (result.theta * 180 / Math.PI).toFixed(3);
  const vKV = (result.Vmag * bus.baseKV).toFixed(2);
  const pMW = (result.Pinj * baseMVA).toFixed(2);
  const qMVAr = (result.Qinj * baseMVA).toFixed(2);

  const vColor =
    result.Vmag < 0.90 || result.Vmag > 1.10 ? '#ef4444'
    : result.Vmag < 0.95 || result.Vmag > 1.05 ? '#f97316'
    : '#22c55e';

  const typeBadgeColor: Record<string, string> = {
    slack: '#2563eb',
    PV:    '#16a34a',
    PQ:    '#9333ea',
  };

  return (
    <div style={{
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: '6px',
      padding: '12px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
      minWidth: '200px',
      position: 'relative',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 6, right: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1,
        }}
        aria-label="Close inspector"
      >×</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{
          background: typeBadgeColor[bus.type] ?? '#6b7280',
          color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: '0.7rem',
        }}>
          {bus.type}
        </span>
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{bus.name}</span>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <Row label="|V|" value={result.Vmag.toFixed(4)} unit="pu" valueColor={vColor} />
          <Row label="|V|" value={vKV} unit="kV" />
          <Row label="θ"   value={thetaDeg} unit="°" />
          <Row label="P"   value={pMW} unit="MW"   valueColor={Number(pMW) >= 0 ? '#22c55e' : '#ef4444'} />
          <Row label="Q"   value={qMVAr} unit="MVAr" />
        </tbody>
      </table>

      <div style={{ marginTop: 6, color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
        base: {baseMVA} MVA · {bus.baseKV} kV
      </div>
    </div>
  );
}

function Row({ label, value, unit, valueColor }: {
  label: string; value: string; unit: string; valueColor?: string;
}) {
  return (
    <tr>
      <td style={{ color: 'var(--color-text-muted)', paddingRight: 8, paddingBottom: 3 }}>{label}</td>
      <td style={{ color: valueColor ?? 'var(--color-text)', fontWeight: 500 }}>{value}</td>
      <td style={{ color: 'var(--color-text-muted)', paddingLeft: 4 }}>{unit}</td>
    </tr>
  );
}
