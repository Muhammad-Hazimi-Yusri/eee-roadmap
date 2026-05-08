// ProtectionCoordination.tsx — IEC 60255 inverse-time curve plotter & grader.
// Configure two relays (downstream + upstream), pick a fault current,
// and the panel reports the operating times and grading margin.

import { useMemo, useState, useCallback } from 'react';
import {
  curvePoints, operatingTime, discriminationMargin, curveLabel,
  type RelaySettings, type IECCurveClass,
} from '../../../lib/power/protection.js';
import { downloadText } from '../../../lib/power/export.js';

const CURVES: IECCurveClass[] = ['SI', 'VI', 'EI', 'LTI'];

const DEFAULT_DOWNSTREAM: RelaySettings = {
  name: 'R1 (downstream feeder)',
  pickupA: 200,
  tms: 0.10,
  curve: 'SI',
  color: '#2563eb',
};
const DEFAULT_UPSTREAM: RelaySettings = {
  name: 'R2 (upstream incomer)',
  pickupA: 400,
  tms: 0.20,
  curve: 'SI',
  color: '#ef4444',
};

const I_MIN = 50;     // A
const I_MAX = 50000;  // A

export default function ProtectionCoordination() {
  const [r1, setR1] = useState<RelaySettings>(DEFAULT_DOWNSTREAM);
  const [r2, setR2] = useState<RelaySettings>(DEFAULT_UPSTREAM);
  const [faultA, setFaultA] = useState<number>(3000);
  const [gradingMargin, setGradingMargin] = useState<number>(0.3);

  const margin = useMemo(() => discriminationMargin(r1, r2, faultA), [r1, r2, faultA]);
  const t1 = operatingTime(r1, faultA);
  const t2 = operatingTime(r2, faultA);
  const gradingOK = margin >= gradingMargin;

  const pts1 = useMemo(() => curvePoints(r1, I_MIN, I_MAX), [r1]);
  const pts2 = useMemo(() => curvePoints(r2, I_MIN, I_MAX), [r2]);

  const exportCSV = useCallback(() => {
    const lines = ['Current_A,t_R1_s,t_R2_s,Margin_s'];
    const logMin = Math.log10(I_MIN);
    const logMax = Math.log10(I_MAX);
    for (let n = 0; n < 50; n++) {
      const i = Math.pow(10, logMin + (n / 49) * (logMax - logMin));
      const td = operatingTime(r1, i);
      const tu = operatingTime(r2, i);
      lines.push([
        i.toFixed(1),
        Number.isFinite(td) ? td.toFixed(4) : '',
        Number.isFinite(tu) ? tu.toFixed(4) : '',
        Number.isFinite(td) && Number.isFinite(tu) ? (tu - td).toFixed(4) : '',
      ].join(','));
    }
    downloadText('protection-coordination.csv', lines.join('\n'));
  }, [r1, r2]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(220px,300px)', gap: 14 }}>
        <div>
          <Plot
            pts1={pts1}
            pts2={pts2}
            color1={r1.color}
            color2={r2.color}
            faultA={faultA}
            t1={t1}
            t2={t2}
            gradingOK={gradingOK}
          />
          <ResultPanel
            r1={r1} r2={r2}
            t1={t1} t2={t2}
            margin={margin}
            gradingMargin={gradingMargin}
            faultA={faultA}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={exportCSV} style={btnStyle()}>⤓ Curves CSV</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <RelayEditor relay={r1} setRelay={setR1} />
          <RelayEditor relay={r2} setRelay={setR2} />
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
            <Field label={`Fault current (A): ${faultA.toFixed(0)}`}>
              <input
                type="range"
                min={Math.log10(I_MIN)}
                max={Math.log10(I_MAX)}
                step={0.01}
                value={Math.log10(faultA)}
                onChange={e => setFaultA(Math.pow(10, Number(e.target.value)))}
                style={{ width: '100%' }}
              />
            </Field>
            <Field label={`Required margin: ${gradingMargin.toFixed(2)} s`}>
              <input
                type="range" min={0.1} max={0.5} step={0.05}
                value={gradingMargin}
                onChange={e => setGradingMargin(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelayEditor({ relay, setRelay }: {
  relay: RelaySettings;
  setRelay: (r: RelaySettings) => void;
}) {
  return (
    <div style={{
      border: `1px solid ${relay.color}`,
      borderRadius: 4, padding: '8px 10px',
      background: `color-mix(in srgb, ${relay.color} 6%, transparent)`,
    }}>
      <div style={{ color: relay.color, fontWeight: 600, marginBottom: 6, fontSize: '0.78rem' }}>
        {relay.name}
      </div>
      <Field label={`Pickup Iₛ (A): ${relay.pickupA.toFixed(0)}`}>
        <input type="range" min={50} max={2000} step={10}
          value={relay.pickupA}
          onChange={e => setRelay({ ...relay, pickupA: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label={`TMS: ${relay.tms.toFixed(2)}`}>
        <input type="range" min={0.05} max={1.0} step={0.01}
          value={relay.tms}
          onChange={e => setRelay({ ...relay, tms: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Curve">
        <select
          value={relay.curve}
          onChange={e => setRelay({ ...relay, curve: e.target.value as IECCurveClass })}
          style={selectStyle()}
        >
          {CURVES.map(c => <option key={c} value={c}>{curveLabel(c)}</option>)}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
      <span style={{ display: 'block', marginBottom: 2 }}>{label}</span>
      {children}
    </label>
  );
}

function Plot({ pts1, pts2, color1, color2, faultA, t1, t2, gradingOK }: {
  pts1: { i: number; t: number }[];
  pts2: { i: number; t: number }[];
  color1: string;
  color2: string;
  faultA: number;
  t1: number;
  t2: number;
  gradingOK: boolean;
}) {
  const W = 540, H = 360, PAD_L = 48, PAD_B = 30, PAD_T = 14, PAD_R = 14;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const xLogMin = Math.log10(I_MIN);
  const xLogMax = Math.log10(I_MAX);
  const yLogMin = -2; // 0.01 s
  const yLogMax = 2;  // 100 s

  const xAt = (i: number) => PAD_L + ((Math.log10(i) - xLogMin) / (xLogMax - xLogMin)) * plotW;
  const yAt = (t: number) => PAD_T + ((Math.log10(t) - yLogMin) / (yLogMax - yLogMin)) * plotH;

  const path = (pts: { i: number; t: number }[]) =>
    pts.map((p, k) => `${k === 0 ? 'M' : 'L'} ${xAt(p.i).toFixed(1)} ${yAt(p.t).toFixed(1)}`).join(' ');

  // Decade gridlines
  const xDecades = [];
  for (let d = Math.ceil(xLogMin); d <= Math.floor(xLogMax); d++) {
    xDecades.push(10 ** d);
  }
  const yDecades = [];
  for (let d = Math.ceil(yLogMin); d <= Math.floor(yLogMax); d++) {
    yDecades.push(10 ** d);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg)' }}>
      {/* Decade grid */}
      {xDecades.map(d => (
        <g key={`xg${d}`}>
          <line x1={xAt(d)} x2={xAt(d)} y1={PAD_T} y2={PAD_T + plotH}
            stroke="var(--color-border)" strokeOpacity={0.4} />
          <text x={xAt(d)} y={H - 12} textAnchor="middle" fontSize={9}
            fill="var(--color-text-muted)" fontFamily="var(--font-mono)">
            {d >= 1000 ? `${d/1000}k` : d}
          </text>
        </g>
      ))}
      {yDecades.map(d => (
        <g key={`yg${d}`}>
          <line x1={PAD_L} x2={PAD_L + plotW} y1={yAt(d)} y2={yAt(d)}
            stroke="var(--color-border)" strokeOpacity={0.4} />
          <text x={PAD_L - 4} y={yAt(d) + 3} textAnchor="end" fontSize={9}
            fill="var(--color-text-muted)" fontFamily="var(--font-mono)">
            {d >= 1 ? `${d}s` : `${(d * 1000).toFixed(0)}ms`}
          </text>
        </g>
      ))}

      {/* Curves */}
      <path d={path(pts1)} fill="none" stroke={color1} strokeWidth={2} />
      <path d={path(pts2)} fill="none" stroke={color2} strokeWidth={2} />

      {/* Fault current cursor */}
      <line x1={xAt(faultA)} x2={xAt(faultA)} y1={PAD_T} y2={PAD_T + plotH}
        stroke={gradingOK ? '#22c55e' : '#ef4444'} strokeDasharray="3 3" strokeWidth={1.5} />

      {Number.isFinite(t1) && (
        <circle cx={xAt(faultA)} cy={yAt(t1)} r={4} fill={color1} stroke="#fff" strokeWidth={1} />
      )}
      {Number.isFinite(t2) && (
        <circle cx={xAt(faultA)} cy={yAt(t2)} r={4} fill={color2} stroke="#fff" strokeWidth={1} />
      )}

      {/* Axis labels */}
      <text x={PAD_L + plotW / 2} y={H - 1} textAnchor="middle" fontSize={9}
        fill="var(--color-text-muted)" fontFamily="var(--font-mono)">
        Current (A) — log scale
      </text>
      <text x={12} y={PAD_T + plotH / 2} textAnchor="middle" fontSize={9}
        fill="var(--color-text-muted)" fontFamily="var(--font-mono)"
        transform={`rotate(-90, 12, ${PAD_T + plotH / 2})`}>
        Operating time (s) — log
      </text>
    </svg>
  );
}

function ResultPanel({ r1, r2, t1, t2, margin, gradingMargin, faultA }: {
  r1: RelaySettings;
  r2: RelaySettings;
  t1: number;
  t2: number;
  margin: number;
  gradingMargin: number;
  faultA: number;
}) {
  const ok = margin >= gradingMargin;
  return (
    <div style={{
      marginTop: 10,
      border: `1px solid ${ok ? '#22c55e' : '#ef4444'}`,
      borderRadius: 4, padding: '10px 14px',
      background: ok ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: ok ? '#22c55e' : '#ef4444' }}>
          {ok ? '✓ Discrimination OK' : '✗ Discrimination FAIL'}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
          @ {faultA.toFixed(0)} A
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
        <tbody>
          <tr>
            <td style={{ color: r1.color, paddingRight: 8 }}>{r1.name}</td>
            <td style={{ color: 'var(--color-text)' }}>
              {Number.isFinite(t1) ? `${t1.toFixed(3)} s` : 'no operate'}
            </td>
          </tr>
          <tr>
            <td style={{ color: r2.color, paddingRight: 8 }}>{r2.name}</td>
            <td style={{ color: 'var(--color-text)' }}>
              {Number.isFinite(t2) ? `${t2.toFixed(3)} s` : 'no operate'}
            </td>
          </tr>
          <tr>
            <td style={{ color: 'var(--color-text-muted)', paddingTop: 4 }}>Margin</td>
            <td style={{ color: ok ? '#22c55e' : '#ef4444', fontWeight: 600, paddingTop: 4 }}>
              {Number.isFinite(margin) ? `${margin.toFixed(3)} s` : '—'}
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 6 }}>
                (need ≥ {gradingMargin.toFixed(2)} s)
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function btnStyle(): React.CSSProperties {
  return {
    background: 'transparent', color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border)', borderRadius: 3,
    padding: '3px 9px', cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 3,
    padding: '3px 6px',
  };
}
