// SwingDynamics.tsx — interactive single-machine-infinite-bus swing equation lab.
// Slide H, Pm, fault clearing time and watch the rotor angle trajectory.

import { useMemo, useState, useCallback } from 'react';
import {
  simulateSwing, criticalClearingAngle, isStable,
  type SwingParams,
} from '../../../lib/power/dynamics.js';
import { downloadText } from '../../../lib/power/export.js';

const DEFAULT: SwingParams = {
  H: 4.0,
  D: 0.0,
  f0: 50,
  Pm: 0.7,
  E: 1.05,
  V: 1.0,
  Xpre: 0.4,
  Xduring: 9999, // 3-phase fault → infinite reactance approximation
  Xpost: 0.6,    // post-fault: weaker tie (one line out)
  tFault: 0.1,
  tClear: 0.25,
  tEnd: 3.0,
  dt: 0.005,
};

export default function SwingDynamics() {
  const [params, setParams] = useState<SwingParams>(DEFAULT);

  const trajectory = useMemo(() => simulateSwing(params), [params]);
  const stable = isStable(trajectory);
  const dCritRad = useMemo(
    () => criticalClearingAngle(params.Pm, params.E, params.V, params.Xpost),
    [params.Pm, params.E, params.V, params.Xpost],
  );
  const dCritDeg = (dCritRad * 180 / Math.PI).toFixed(1);

  const update = useCallback(<K extends keyof SwingParams>(k: K, v: SwingParams[K]) => {
    setParams(p => ({ ...p, [k]: v }));
  }, []);

  const exportCSV = useCallback(() => {
    const lines = ['t_s,delta_deg,omega_rad_per_s,Pe_pu'];
    for (const pt of trajectory) {
      lines.push([
        pt.t.toFixed(4),
        (pt.delta * 180 / Math.PI).toFixed(3),
        pt.omega.toFixed(4),
        pt.Pe.toFixed(4),
      ].join(','));
    }
    downloadText('swing-trajectory.csv', lines.join('\n'));
  }, [trajectory]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(220px,300px)', gap: 14 }}>
        <div>
          <RotorAngleChart trajectory={trajectory} params={params} />
          <PowerAngleChart trajectory={trajectory} params={params} />
          <StatusBar stable={stable} dCritDeg={dCritDeg} clearTime={params.tClear - params.tFault} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={exportCSV} style={btnStyle()}>⤓ Trajectory CSV</button>
            <button onClick={() => setParams(DEFAULT)} style={btnStyle()}>Reset</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Slider label="H (inertia, s)" min={1} max={10} step={0.1}
            value={params.H} onChange={v => update('H', v)} />
          <Slider label="Pm (mech. power, pu)" min={0.1} max={1.0} step={0.01}
            value={params.Pm} onChange={v => update('Pm', v)} />
          <Slider label="D (damping, pu)" min={0} max={5} step={0.1}
            value={params.D} onChange={v => update('D', v)} />
          <Slider label="X_post (post-fault X, pu)" min={0.2} max={1.5} step={0.01}
            value={params.Xpost} onChange={v => update('Xpost', v)} />
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 4, paddingTop: 6 }}>
            <Slider label="Fault inception (s)" min={0} max={0.5} step={0.01}
              value={params.tFault} onChange={v => update('tFault', v)} />
            <Slider label="Fault clearing (s)" min={params.tFault + 0.01} max={1.0} step={0.01}
              value={params.tClear} onChange={v => update('tClear', v)} />
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginTop: 4 }}>
            Fault is a 3-phase short at the line midpoint. Xduring → ∞ (P_e ≈ 0 during the fault).
            Post-fault X reflects the surviving topology after the fault is cleared.
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{value.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}

function RotorAngleChart({
  trajectory, params,
}: { trajectory: ReturnType<typeof simulateSwing>; params: SwingParams }) {
  const W = 540, H = 180, PAD_L = 38, PAD_B = 22, PAD_T = 14, PAD_R = 10;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const allDeg = trajectory.map(p => p.delta * 180 / Math.PI);
  const yMin = Math.min(0, Math.min(...allDeg, -10));
  const yMaxRaw = Math.max(180, Math.max(...allDeg) + 20);
  const yMax = Math.min(yMaxRaw, 720);

  const xAt = (t: number) => PAD_L + (t / params.tEnd) * plotW;
  const yAt = (d: number) => PAD_T + plotH * (1 - (d - yMin) / (yMax - yMin));

  const path = trajectory
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p.t).toFixed(1)} ${yAt(p.delta * 180 / Math.PI).toFixed(1)}`)
    .join(' ');

  const yTicks = [];
  const span = yMax - yMin;
  const stepV = span > 360 ? 90 : span > 180 ? 60 : 30;
  for (let v = Math.ceil(yMin / stepV) * stepV; v <= yMax; v += stepV) yTicks.push(v);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        Rotor angle δ vs time
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg)' }}>
        {/* Y ticks */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD_L} x2={PAD_L + plotW} y1={yAt(v)} y2={yAt(v)}
              stroke="var(--color-border)" strokeOpacity={0.3} />
            <text x={PAD_L - 4} y={yAt(v) + 3} textAnchor="end" fontSize={8} fill="var(--color-text-muted)">
              {v}°
            </text>
          </g>
        ))}
        {/* 180° instability line */}
        {yMax > 180 && (
          <line x1={PAD_L} x2={PAD_L + plotW} y1={yAt(180)} y2={yAt(180)}
            stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.2} />
        )}
        {/* Fault interval shading */}
        <rect
          x={xAt(params.tFault)}
          y={PAD_T}
          width={Math.max(0, xAt(params.tClear) - xAt(params.tFault))}
          height={plotH}
          fill="rgba(239,68,68,0.12)"
        />
        <text x={xAt((params.tFault + params.tClear) / 2)} y={PAD_T + 10}
          textAnchor="middle" fontSize={8} fill="#ef4444">fault</text>

        <path d={path} fill="none" stroke="#2563eb" strokeWidth={2} />

        <text x={PAD_L + plotW / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--color-text-muted)">
          time (s)
        </text>
      </svg>
    </div>
  );
}

function PowerAngleChart({
  trajectory, params,
}: { trajectory: ReturnType<typeof simulateSwing>; params: SwingParams }) {
  const W = 540, H = 180, PAD_L = 38, PAD_B = 22, PAD_T = 14, PAD_R = 10;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const PeMaxPre = params.E * params.V / params.Xpre;
  const PeMaxPost = params.E * params.V / params.Xpost;
  const yMax = Math.max(PeMaxPre, PeMaxPost) * 1.1;

  // Sweep δ 0..π
  const N = 120;
  const xAt = (deg: number) => PAD_L + (deg / 180) * plotW;
  const yAt = (p: number) => PAD_T + plotH * (1 - p / yMax);

  const buildCurve = (X: number) => {
    const pts: string[] = [];
    for (let i = 0; i < N; i++) {
      const dDeg = i * 180 / (N - 1);
      const dRad = dDeg * Math.PI / 180;
      const Pe = (params.E * params.V / X) * Math.sin(dRad);
      pts.push(`${i === 0 ? 'M' : 'L'} ${xAt(dDeg).toFixed(1)} ${yAt(Pe).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const trajPath = trajectory
    .map((p, i) => {
      const dDeg = (p.delta * 180 / Math.PI) % 360;
      return `${i === 0 ? 'M' : 'L'} ${xAt(Math.max(0, Math.min(180, dDeg))).toFixed(1)} ${yAt(p.Pe).toFixed(1)}`;
    })
    .join(' ');

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
        Power-angle curve (P_e vs δ) — equal-area visualisation
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-bg)' }}>
        {/* Pm horizontal line */}
        <line x1={PAD_L} x2={PAD_L + plotW} y1={yAt(params.Pm)} y2={yAt(params.Pm)}
          stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1.2} />
        <text x={PAD_L + 6} y={yAt(params.Pm) - 3} fontSize={8} fill="#22c55e">Pm = {params.Pm.toFixed(2)}</text>

        {/* Pre-fault and post-fault curves */}
        <path d={buildCurve(params.Xpre)} fill="none" stroke="var(--color-text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={buildCurve(params.Xpost)} fill="none" stroke="#f97316" strokeWidth={2} />
        <text x={PAD_L + plotW - 80} y={PAD_T + 12} fontSize={8} fill="var(--color-text-muted)">pre-fault</text>
        <text x={PAD_L + plotW - 80} y={PAD_T + 24} fontSize={8} fill="#f97316">post-fault</text>

        {/* Trajectory overlay */}
        <path d={trajPath} fill="none" stroke="#2563eb" strokeWidth={1.5} strokeOpacity={0.85} />

        {/* Axis labels */}
        {[0, 45, 90, 135, 180].map(d => (
          <text key={d} x={xAt(d)} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--color-text-muted)">
            {d}°
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatusBar({ stable, dCritDeg, clearTime }: {
  stable: boolean; dCritDeg: string; clearTime: number;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      border: `1px solid ${stable ? '#22c55e' : '#ef4444'}`, borderRadius: 4,
      padding: '6px 12px', fontSize: '0.78rem',
      background: stable ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.06)',
    }}>
      <span style={{ fontWeight: 600, color: stable ? '#22c55e' : '#ef4444' }}>
        {stable ? '✓ Stable' : '✗ Loss of synchronism'}
      </span>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
        clearing time: {(clearTime * 1000).toFixed(0)} ms · δ_crit (post): {dCritDeg}°
      </span>
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
