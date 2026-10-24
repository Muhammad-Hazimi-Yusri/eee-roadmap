// VoltageSlope.tsx — a slope (droop) voltage controller, and why two plants
// on one bus share reactive power instead of fighting.

import { useState } from 'react';
import { slopeQ } from '../../lib/field-guide/curves';
import { Axes, ChartBox, Slider, Toggle, polyline, scales, panelStyle, type Frame } from './chart-kit';

const F: Frame = { W: 640, H: 280, L: 48, R: 12, T: 14, B: 32, x0: 0.94, x1: 1.06, y0: -1.1, y1: 1.1 };

const LIMITS = {
  ppm: { label: 'PPM (symmetric ±Qmax)', absorb: 1 },
  scu: { label: 'SynCon (+0.8 / −0.4 MVA → absorb half)', absorb: 0.5 },
} as const;

export default function VoltageSlope() {
  const [vset, setVset] = useState(1.0);
  const [slopeA, setSlopeA] = useState(2);
  const [slopeB, setSlopeB] = useState(6);
  const [v, setV] = useState(0.985);
  const [limits, setLimits] = useState<keyof typeof LIMITS>('ppm');
  const { x, y } = scales(F);
  const absorb = LIMITS[limits].absorb;

  const vs: number[] = [];
  for (let k = F.x0; k <= F.x1 + 1e-9; k += 0.0005) vs.push(k);
  const curve = (s: number) => polyline(vs.map(vv => ({ x: x(vv), y: y(slopeQ(vv, vset, s, absorb)) })));

  const qa = slopeQ(v, vset, slopeA, absorb);
  const qb = slopeQ(v, vset, slopeB, absorb);

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 8 }}>
        <Toggle label="Capability limits" value={limits} onChange={id => setLimits(id as keyof typeof LIMITS)}
          options={Object.entries(LIMITS).map(([id, l]) => ({ id, label: l.label }))} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <ChartBox label="Reactive output against voltage for two slope settings">
            <svg viewBox={`0 0 ${F.W} ${F.H}`} className="fg-svg">
              <Axes f={F} xTicks={[0.94, 0.97, 1, 1.03, 1.06]} yTicks={[-1, -0.5, 0, 0.5, 1]}
                xLabel="voltage at the control point (pu)" yLabel="Q / Qmax (+ = export)" xFmt={t => t.toFixed(2)} yFmt={t => t.toFixed(1)} />
              <line x1={x(vset)} x2={x(vset)} y1={F.T} y2={F.H - F.B} stroke="var(--color-text-muted)" strokeDasharray="2 3" />
              <text x={x(vset) + 4} y={F.T + 10} fontSize={10} fill="var(--color-text-muted)">setpoint · 0% slope would be this vertical line</text>
              <path d={curve(slopeA)} fill="none" stroke="var(--fg-gb)" strokeWidth={2.2} />
              <path d={curve(slopeB)} fill="none" stroke="var(--fg-ie)" strokeWidth={2.2} />
              <line x1={x(v)} x2={x(v)} y1={F.T} y2={F.H - F.B} stroke="var(--color-text)" opacity={0.6} />
              <circle cx={x(v)} cy={y(qa)} r={4} fill="var(--fg-gb)" />
              <circle cx={x(v)} cy={y(qb)} r={4} fill="var(--fg-ie)" />
            </svg>
          </ChartBox>
          <p style={{ fontSize: '0.72rem', lineHeight: 1.6, margin: '8px 0 0' }}>
            Bus at <strong>{v.toFixed(3)} pu</strong>: plant A ({slopeA}% slope) gives{' '}
            <strong style={{ color: 'var(--fg-gb)' }}>{(qa * 100).toFixed(0)}%</strong> of its Qmax, plant B ({slopeB}%) gives{' '}
            <strong style={{ color: 'var(--fg-ie)' }}>{(qb * 100).toFixed(0)}%</strong>. The stiffer plant does more of the work,
            and neither winds up against its limit trying to hold an exact voltage.
          </p>
        </div>
        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Slider label="Bus voltage" value={v} min={0.94} max={1.06} step={0.001} onChange={setV} fmt={t => `${t.toFixed(3)} pu`} />
          <Slider label="Setpoint" value={vset} min={0.95} max={1.05} step={0.0025} onChange={setVset} fmt={t => `${(t * 100).toFixed(2)}%`}
            hint="GB 95–105% in 0.25% steps" />
          <Slider label="Plant A slope" value={slopeA} min={1} max={10} step={0.5} onChange={setSlopeA} fmt={t => `${t}%`}
            hint="GB 2–7% · IE RfG 2–7% · IE non-RfG and SCU 1–10%" />
          <Slider label="Plant B slope" value={slopeB} min={1} max={10} step={0.5} onChange={setSlopeB} fmt={t => `${t}%`} />
          <p style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
            Convention used here: Q reaches its limit when voltage has moved by the slope from setpoint.
            Codes define the slope base differently — check the clause before setting a real controller.
          </p>
        </div>
      </div>
    </div>
  );
}
