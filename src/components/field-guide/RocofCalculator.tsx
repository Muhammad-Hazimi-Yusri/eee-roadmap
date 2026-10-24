// RocofCalculator.tsx — initial RoCoF from stored energy and loss size, and
// how much a fleet of synchronous condensers moves it. Aggregate swing
// equation only: no load relief, no response, no network spread.

import { useState } from 'react';
import { initialRocof, inertiaForRocof, storedEnergy } from '../../lib/field-guide/curves';
import { Axes, ChartBox, Slider, Toggle, polyline, scales, panelStyle, type Frame } from './chart-kit';

const PRESETS = {
  large: { label: 'Large system (illustrative)', ek: 150, loss: 1800 },
  small: { label: 'Small island system (illustrative)', ek: 25, loss: 500 },
} as const;

const F: Frame = { W: 640, H: 240, L: 48, R: 12, T: 14, B: 32, x0: 0, x1: 1, y0: 48.5, y1: 50.1 };

export default function RocofCalculator() {
  const [preset, setPreset] = useState<string>('small');
  const [ekGWs, setEk] = useState<number>(PRESETS.small.ek);
  const [loss, setLoss] = useState<number>(PRESETS.small.loss);
  const [units, setUnits] = useState(0);
  const [mva, setMva] = useState(250);
  const [h, setH] = useState(1.5);
  const { x, y } = scales(F);

  const addedMWs = units * storedEnergy(h, mva);
  const totalMWs = ekGWs * 1000 + addedMWs;
  const rocof = initialRocof(loss, totalMWs);
  const rocofBase = initialRocof(loss, ekGWs * 1000);
  const need1 = inertiaForRocof(loss, 1) / 1000;
  const need05 = inertiaForRocof(loss, 0.5) / 1000;

  const line = (r: number) => polyline([0, 1].map(t => ({ x: x(t), y: y(Math.max(F.y0, 50 - r * t)) })));

  const choose = (id: string) => {
    const p = PRESETS[id as keyof typeof PRESETS];
    setPreset(id);
    setEk(p.ek);
    setLoss(p.loss);
  };

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 8 }}>
        <Toggle label="Presets" value={preset} onChange={choose}
          options={Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label }))} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <ChartBox label="Frequency in the first second after a loss">
            <svg viewBox={`0 0 ${F.W} ${F.H}`} className="fg-svg">
              <Axes f={F} xTicks={[0, 0.25, 0.5, 0.75, 1]} yTicks={[48.5, 49, 49.5, 50]}
                xLabel="time after the loss (s)" yLabel="frequency (Hz)" yFmt={v => v.toFixed(1)} />
              <rect x={x(0)} y={F.T} width={x(0.5) - x(0)} height={F.H - F.T - F.B} fill="var(--color-copper)" opacity={0.08} />
              <text x={x(0.25)} y={F.T + 10} textAnchor="middle" fontSize={10} fill="var(--color-copper)">500 ms window</text>
              <path d={line(1)} fill="none" stroke="var(--fg-bad)" strokeDasharray="5 4" strokeWidth={1.4} />
              <text x={x(0.98)} y={y(49) - 4} textAnchor="end" fontSize={10} fill="var(--fg-bad)">1 Hz/s withstand</text>
              {units > 0 && <path d={line(rocofBase)} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.5} strokeDasharray="2 3" />}
              <path d={line(rocof)} fill="none" stroke="var(--fg-gb)" strokeWidth={2.4} />
            </svg>
          </ChartBox>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            <Stat label="Initial RoCoF" value={`${rocof.toFixed(2)} Hz/s`} tone={rocof > 1 ? 'var(--fg-bad)' : 'var(--fg-ok)'} />
            <Stat label="Stored energy" value={`${(totalMWs / 1000).toFixed(1)} GW·s`} />
            <Stat label="Needed for ≤1 Hz/s" value={`${need1.toFixed(1)} GW·s`} />
            <Stat label="Needed for ≤0.5 Hz/s" value={`${need05.toFixed(1)} GW·s`} />
          </div>
        </div>

        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Slider label="System stored energy Ek" value={ekGWs} min={5} max={300} step={1} onChange={v => { setEk(v); setPreset(''); }}
            fmt={v => `${v} GW·s`} />
          <Slider label="Largest loss ΔP" value={loss} min={50} max={2500} step={10} onChange={v => { setLoss(v); setPreset(''); }}
            fmt={v => `${v} MW`} />
          <strong style={{ fontSize: '0.72rem', marginTop: 4 }}>Add synchronous condensers</strong>
          <Slider label="Units" value={units} min={0} max={10} step={1} onChange={setUnits} fmt={v => String(v)} />
          <Slider label="Rating each" value={mva} min={50} max={500} step={10} onChange={setMva} fmt={v => `${v} MVA`} />
          <Slider label="Inertia constant H" value={h} min={0.5} max={10} step={0.1} onChange={setH} fmt={v => `${v.toFixed(1)} s`}
            hint="On the unit's own MVA. A flywheel raises it — use the manufacturer's figure." />
          <p style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
            df/dt = ΔP·f₀ / (2·Ek). Presets are round illustrative numbers, not published system values.
            This is the first instant only — load relief and response bend the real curve.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 10px', minWidth: 120 }}>
      <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: tone ?? 'var(--color-text)' }}>{value}</div>
    </div>
  );
}
