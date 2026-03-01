// SingleLineDiagram.tsx — pure React/SVG single-line diagram renderer.
// Pan/zoom via pointer events (no D3 dependency).
import { useRef, useState, useCallback } from 'react';
import type { PowerNetwork, PowerFlowResults } from '../../../lib/power/types.js';

interface Props {
  network: PowerNetwork;
  results: PowerFlowResults | null;
  selectedBusId: number | null;
  onBusClick: (busId: number) => void;
  faultBusId?: number;
}

function voltColor(vmag: number): string {
  if (vmag < 0.90 || vmag > 1.10) return '#ef4444';
  if (vmag < 0.95 || vmag > 1.05) return '#f97316';
  return '#22c55e';
}

function lineLoadColor(frac: number): string {
  if (frac > 0.90) return '#ef4444';
  if (frac > 0.60) return '#f97316';
  return '#22c55e';
}

interface Transform { x: number; y: number; scale: number }

export default function SingleLineDiagram({
  network, results, selectedBusId, onBusClick, faultBusId,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [xfm, setXfm] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const busResult = (id: number) => results?.buses.find(b => b.busId === id);

  // Pan handlers
  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('.bus-hit')) return; // don't pan on bus click
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: xfm.x, origY: xfm.y };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  }, [xfm]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setXfm(t => ({ ...t, x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy }));
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setXfm(t => ({ ...t, scale: Math.max(0.3, Math.min(4, t.scale * factor)) }));
  }, []);

  const allBranches = [
    ...network.lines.map(l => ({ id: l.id, from: l.fromBus, to: l.toBus, isTransformer: false })),
    ...network.transformers.map(t => ({ id: t.id, from: t.fromBus, to: t.toBus, isTransformer: true })),
  ];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Reset view button */}
      <button
        onClick={() => setXfm({ x: 0, y: 0, scale: 1 })}
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 2,
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)', cursor: 'pointer',
          color: 'var(--color-text-muted)',
        }}
      >reset view</button>

      <svg
        ref={svgRef}
        viewBox="0 0 700 520"
        style={{
          width: '100%', height: 'auto', display: 'block',
          background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          borderRadius: 6, cursor: dragRef.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          {/* Bus bar marker */}
          <rect id="sym-bus" x="-36" y="-4" width="72" height="8" rx="1" />
          {/* Generator circle */}
          <circle id="sym-gen-circle" cx="0" cy="0" r="14" />
          {/* Load triangle (pointing down) */}
          <polygon id="sym-load" points="0,-10 9,6 -9,6" />
        </defs>

        <g transform={`translate(${xfm.x},${xfm.y}) scale(${xfm.scale})`}>
          {/* ── Lines & Transformers ───────────────────────────────────── */}
          {allBranches.map(branch => {
            const fromBus = network.buses.find(b => b.id === branch.from)!;
            const toBus   = network.buses.find(b => b.id === branch.to)!;
            if (!fromBus || !toBus) return null;

            const x1 = fromBus.position.x, y1 = fromBus.position.y;
            const x2 = toBus.position.x,   y2 = toBus.position.y;
            const lr = results?.lines.find(l => l.lineId === branch.id);
            const color = lr ? lineLoadColor(lr.loadingFraction) : 'var(--color-text-muted)';
            const strokeW = lr ? 2 + lr.loadingFraction * 2 : 1.5;

            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;

            return (
              <g key={branch.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color} strokeWidth={strokeW}
                  strokeOpacity={0.85}
                />
                {/* Transformer symbol at midpoint */}
                {branch.isTransformer && (
                  <g transform={`translate(${mx},${my})`}>
                    <circle cx="-7" cy="0" r="10"
                      fill="color-mix(in srgb, var(--color-copper) 12%, transparent)"
                      stroke="var(--color-copper)" strokeWidth={1.5} />
                    <circle cx="7" cy="0" r="10"
                      fill="color-mix(in srgb, var(--color-copper) 12%, transparent)"
                      stroke="var(--color-copper)" strokeWidth={1.5} />
                  </g>
                )}
                {/* Loading % label at midpoint */}
                {lr && (
                  <text x={mx} y={my - 8} textAnchor="middle"
                    fontSize={7} fontFamily="var(--font-mono)" fill={color}>
                    {(lr.loadingFraction * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Buses ─────────────────────────────────────────────────── */}
          {network.buses.map(bus => {
            const r = busResult(bus.id);
            const cx = bus.position.x, cy = bus.position.y;
            const isSelected = bus.id === selectedBusId;
            const isFault    = bus.id === faultBusId;
            const busColor = r
              ? voltColor(r.Vmag)
              : (isFault ? '#ef4444' : 'var(--color-text)');

            // Find generators and loads on this bus
            const hasGen  = network.generators.some(g => g.busId === bus.id);
            const hasLoad = network.loads.some(l => l.busId === bus.id);

            return (
              <g key={bus.id} transform={`translate(${cx},${cy})`}>
                {/* Generator symbol (above bus) */}
                {hasGen && (
                  <g transform="translate(0,-34)">
                    <line x1={0} y1={20} x2={0} y2={14}
                      stroke="#2563eb" strokeWidth={1.5} />
                    <circle cx={0} cy={0} r={14}
                      fill="rgba(37,99,235,0.12)"
                      stroke="#2563eb" strokeWidth={1.5} />
                    <text x={0} y={4} textAnchor="middle" fontSize={10}
                      fontWeight="600" fill="#2563eb" fontFamily="var(--font-mono)">G</text>
                  </g>
                )}

                {/* Bus bar — clickable hit area */}
                <g
                  className="bus-hit"
                  onClick={() => onBusClick(bus.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect x="-36" y="-4" width="72" height="8" rx="1"
                    fill={isSelected ? busColor : (isFault ? '#ef4444' : 'var(--color-text)')}
                    stroke={isSelected ? '#fff' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                  {/* Invisible wider hit rect */}
                  <rect x="-40" y="-14" width="80" height="28"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />
                </g>

                {/* Load symbol (below bus) */}
                {hasLoad && (
                  <g transform="translate(0,34) rotate(180)">
                    <line x1={0} y1={-20} x2={0} y2={-10}
                      stroke="#dc2626" strokeWidth={1.5} />
                    <polygon points="0,-10 9,6 -9,6"
                      fill="rgba(220,38,38,0.12)"
                      stroke="#dc2626" strokeWidth={1.5} />
                  </g>
                )}

                {/* Bus name label */}
                <text x={0} y={-14} textAnchor="middle" fontSize={8}
                  fontFamily="var(--font-mono)" fill="var(--color-text-muted)">
                  {bus.name.length > 12 ? `Bus ${bus.id}` : bus.name}
                </text>

                {/* Voltage annotation (post-solve) */}
                {r && (
                  <text x={40} y={-2} fontSize={7.5}
                    fontFamily="var(--font-mono)" fill={busColor}>
                    {r.Vmag.toFixed(3)} pu
                  </text>
                )}

                {/* Fault indicator */}
                {isFault && (
                  <text x={0} y={20} textAnchor="middle" fontSize={9}
                    fontFamily="var(--font-mono)" fill="#ef4444" fontWeight="600">
                    ⚡ FAULT
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Instructions */}
      <div style={{
        fontSize: '0.7rem', color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)', marginTop: 4,
      }}>
        Click bus to inspect · Scroll to zoom · Drag to pan
      </div>
    </div>
  );
}
