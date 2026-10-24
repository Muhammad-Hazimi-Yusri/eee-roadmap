// FrtExplorer.tsx — compare fault ride-through curves across GB, Ireland and
// NI, then drop a voltage dip on top and see which codes require the plant to
// stay connected. Curves come from src/lib/field-guide/curves.ts.

import { useMemo, useState } from 'react';
import { FRT_CURVES, mustRideThrough, dipVoltageAt, type Dip, type FrtCurve } from '../../lib/field-guide/curves';
import { Axes, ChartBox, Slider, Toggle, TONE, polyline, scales, panelStyle, type Frame } from './chart-kit';

const PRESETS: { id: string; label: string; ids: string[] }[] = [
  { id: 'ppm', label: 'PPM: GB vs IE vs NI', ids: ['gb-ppm-lt110', 'gb-ppm-d110', 'ie-ppm-rfg', 'ni-ppm-nonrfg'] },
  { id: 'ie', label: 'IE: RfG vs non-RfG', ids: ['ie-ppm-rfg', 'ie-ppm-nonrfg', 'ie-scu'] },
  { id: 'sync', label: 'GB synchronous', ids: ['gb-sync-b', 'gb-sync-cd-lt110', 'gb-sync-d110'] },
  { id: 'scu', label: 'SynCon vs PPM', ids: ['ie-scu', 'ie-ppm-rfg', 'gb-ppm-d110'] },
];

const F: Frame = { W: 640, H: 300, L: 44, R: 12, T: 14, B: 32, x0: 0, x1: 3.5, y0: 0, y1: 1.1 };

function dash(c: FrtCurve): string | undefined {
  if (c.id.includes('nonrfg')) return '6 4';
  if (c.plant === 'Synchronous') return '2 3';
  return undefined;
}

export default function FrtExplorer() {
  const [preset, setPreset] = useState('ppm');
  const [selected, setSelected] = useState<string[]>(PRESETS[0].ids);
  const [dip, setDip] = useState<Dip>({ retained: 0.05, duration: 0.14, recovery: 0.4, final: 0.95 });
  const { x, y } = scales(F);

  const shown = useMemo(() => FRT_CURVES.filter(c => selected.includes(c.id)), [selected]);
  const verdicts = useMemo(
    () => shown.map(c => ({ c, ok: mustRideThrough(c.points, dip, F.x1) })),
    [shown, dip],
  );

  const dipPath = useMemo(() => {
    const pts = [{ x: x(0), y: y(1) }];
    for (let t = 0; t <= F.x1 + 1e-9; t += 0.005) pts.push({ x: x(t), y: y(dipVoltageAt(dip, t)) });
    return polyline(pts);
  }, [dip, x, y]);

  const choosePreset = (id: string) => {
    setPreset(id);
    setSelected(PRESETS.find(p => p.id === id)?.ids ?? []);
  };
  const toggle = (id: string) => {
    setPreset('');
    setSelected(s => (s.includes(id) ? s.filter(v => v !== id) : [...s, id]));
  };
  const set = <K extends keyof Dip>(k: K, v: number) => setDip(d => ({ ...d, [k]: v }));

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 8 }}>
        <Toggle label="Curve presets" value={preset} onChange={choosePreset}
          options={PRESETS.map(p => ({ id: p.id, label: p.label }))} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <ChartBox label="Fault ride-through voltage-against-time curves with a test dip">
            <svg viewBox={`0 0 ${F.W} ${F.H}`} className="fg-svg">
              <Axes f={F} xTicks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]} yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                xLabel="time from fault inception (s)" yLabel="voltage (pu)" yFmt={v => v.toFixed(1)} />
              {shown.map(c => (
                <path key={c.id} d={polyline(c.points.map(p => ({ x: x(p.t), y: y(p.u) })))}
                  fill="none" stroke={TONE[c.jurisdiction]} strokeWidth={2.2} strokeDasharray={dash(c)} />
              ))}
              <path d={dipPath} fill="none" stroke="var(--color-text)" strokeWidth={1.6} opacity={0.85} />
              <rect x={x(0)} y={F.T} width={Math.max(0, x(dip.duration) - x(0))} height={F.H - F.T - F.B}
                fill="var(--fg-bad)" opacity={0.08} />
              <text x={x(dip.duration / 2)} y={F.T + 10} textAnchor="middle" fontSize={11} fill="var(--fg-bad)">fault</text>
            </svg>
          </ChartBox>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: '0.7rem' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '3px 4px' }}>Curve</th>
                <th style={{ padding: '3px 4px' }}>Measured at</th>
                <th style={{ padding: '3px 4px' }}>This dip</th>
              </tr>
            </thead>
            <tbody>
              {verdicts.map(({ c, ok }) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '4px', color: TONE[c.jurisdiction], fontWeight: 600 }}>
                    {c.label}
                    <span style={{ display: 'block', color: 'var(--color-text-muted)', fontWeight: 400 }}>{c.pin}</span>
                  </td>
                  <td style={{ padding: '4px' }}>{c.measuredAt}</td>
                  <td style={{ padding: '4px', color: ok ? 'var(--fg-ok)' : 'var(--fg-bad)', fontWeight: 600 }}>
                    {ok ? 'must ride through' : 'below curve — may trip'}
                  </td>
                </tr>
              ))}
              {verdicts.length === 0 && (
                <tr><td colSpan={3} style={{ padding: 4, color: 'var(--color-text-muted)' }}>Pick a curve below.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong style={{ fontSize: '0.72rem' }}>Test dip (black line)</strong>
          <Slider label="Retained voltage" value={dip.retained} min={0} max={0.9} step={0.01}
            onChange={v => set('retained', v)} fmt={v => `${v.toFixed(2)} pu`} />
          <Slider label="Fault clearance" value={dip.duration} min={0.05} max={0.8} step={0.01}
            onChange={v => set('duration', v)} fmt={v => `${Math.round(v * 1000)} ms`} />
          <Slider label="Recovery ramp" value={dip.recovery} min={0} max={2.5} step={0.05}
            onChange={v => set('recovery', v)} fmt={v => `${v.toFixed(2)} s`} />
          <Slider label="Post-fault voltage" value={dip.final} min={0.8} max={1.05} step={0.01}
            onChange={v => set('final', v)} fmt={v => `${v.toFixed(2)} pu`} />

          <strong style={{ fontSize: '0.72rem', marginTop: 6 }}>Curves</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {FRT_CURVES.map(c => (
              <label key={c.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.7rem' }}>
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                <span style={{ width: 18, borderTop: `2px ${dash(c) ? 'dashed' : 'solid'} ${TONE[c.jurisdiction]}` }} />
                {c.label}
              </label>
            ))}
          </div>
          <p style={{ fontSize: '0.64rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
            Solid: RfG-era converter plant. Dashed: non-RfG. Dotted: synchronous. Each curve is a lower
            limit — above it the plant must stay on, below it the code allows a trip. Real
            assessments use the TSO&apos;s pre- and post-fault conditions, not a free-hand dip.
          </p>
        </div>
      </div>
    </div>
  );
}
