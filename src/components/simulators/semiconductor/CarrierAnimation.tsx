// src/components/simulators/semiconductor/CarrierAnimation.tsx
// Canvas particle simulation: electrons (blue) and holes (red) with drift + diffusion.
// No field: Brownian random walk. With field: net drift velocity added.
// requestAnimationFrame loop; cleanup on unmount.
// Hydration: client:visible

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  q, kB,
  electronMobility, holeMobility,
} from '../../../lib/semiconductor/carrier-stats.js';

// ─── Particle type ────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'electron' | 'hole';
}

function makeParticles(count: number, W: number, H: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0,
      vy: 0,
      type: i < count / 2 ? 'electron' : 'hole',
    });
  }
  return particles;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CarrierAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);

  const [Efield, setEfield] = useState(0);     // V/cm
  const [T, setT] = useState(300);             // K
  const [Nd, setNd] = useState(1e16);          // cm⁻³ (log slider)
  const [logNd, setLogNd] = useState(16);
  const [running, setRunning] = useState(true);

  // Derived transport quantities
  const muN = electronMobility(Nd);           // cm²/V·s
  const muP = holeMobility(Nd);
  const vdN = muN * Math.abs(Efield) * 1e-4;  // cm/s → scaled for display
  const vdP = muP * Math.abs(Efield) * 1e-4;
  const D_N = muN * (kB * T / q) * 1;         // cm²/s (Einstein relation)
  const D_P = muP * (kB * T / q) * 1;

  const W = 320; const H = 160;
  const NPARTICLES = 30;

  // Initialise particles once
  useEffect(() => {
    particlesRef.current = makeParticles(NPARTICLES, W, H);
  }, []);

  // Handle Nd slider
  function handleLogNd(v: number) {
    setLogNd(v);
    setNd(10 ** v);
  }

  // Animation loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameRef.current++;

    // Update particles
    const thermalSpeed = Math.sqrt((kB * T) / (9.109e-31)) * 1e-7; // scaled
    const driftNorm = Efield * 1e-3; // normalise for canvas pixels

    for (const p of particlesRef.current) {
      // Thermal (diffusion) velocity — Gaussian random step
      const sigma = Math.sqrt(2 * (D_N + D_P) * 0.001 + thermalSpeed * 0.001);
      p.vx = (Math.random() - 0.5) * sigma * 4;
      p.vy = (Math.random() - 0.5) * sigma * 4;

      // Drift: electrons move opposite to E, holes with E
      if (p.type === 'electron') {
        p.vx -= driftNorm * muN * 0.003;
      } else {
        p.vx += driftNorm * muP * 0.003;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x += W;
      if (p.x > W) p.x -= W;
      if (p.y < 0) p.y += H;
      if (p.y > H) p.y -= H;
    }

    // Clear
    ctx.fillStyle = '#0d1a0d';
    ctx.fillRect(0, 0, W, H);

    // Draw E-field arrows if active
    if (Math.abs(Efield) > 0) {
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.15)';
      ctx.lineWidth = 0.8;
      const arrowDir = Efield > 0 ? 1 : -1;
      for (let ax = 20; ax < W; ax += 40) {
        for (let ay = 20; ay < H; ay += 40) {
          ctx.beginPath();
          ctx.moveTo(ax - arrowDir * 10, ay);
          ctx.lineTo(ax + arrowDir * 10, ay);
          ctx.stroke();
          // arrowhead
          ctx.beginPath();
          ctx.moveTo(ax + arrowDir * 10, ay);
          ctx.lineTo(ax + arrowDir * 6, ay - 4);
          ctx.moveTo(ax + arrowDir * 10, ay);
          ctx.lineTo(ax + arrowDir * 6, ay + 4);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particlesRef.current) {
      if (p.type === 'electron') {
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        // Negative charge symbol
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x - 3, p.y - 0.8, 6, 1.6);
      } else {
        ctx.strokeStyle = '#ff6644';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.stroke();
        // Plus symbol
        ctx.fillStyle = '#ff6644';
        ctx.fillRect(p.x - 3, p.y - 0.8, 6, 1.6);
        ctx.fillRect(p.x - 0.8, p.y - 3, 1.6, 6);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [Efield, T, D_N, D_P, muN, muP]);

  // Start/stop animation
  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, draw]);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-text)' }}>
      {/* Controls */}
      <div style={{ marginBottom: '0.75rem' }}>
        {/* E-field */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
            <label htmlFor="Efield">E-field</label>
            <span style={{ color: 'var(--color-text)' }}>{Efield.toFixed(0)} V/cm</span>
          </div>
          <input type="range" id="Efield" min={-500} max={500} step={10} value={Efield}
            onChange={e => setEfield(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-copper)' }} />
        </div>
        {/* Temperature */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
            <label htmlFor="temp">Temperature</label>
            <span style={{ color: 'var(--color-text)' }}>{T} K</span>
          </div>
          <input type="range" id="temp" min={100} max={500} step={10} value={T}
            onChange={e => setT(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-copper)' }} />
        </div>
        {/* Doping */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
            <label htmlFor="nd-log">Doping Nd</label>
            <span style={{ color: 'var(--color-text)' }}>10^{logNd.toFixed(1)} cm⁻³</span>
          </div>
          <input type="range" id="nd-log" min={14} max={19} step={0.1} value={logNd}
            onChange={e => handleLogNd(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-copper)' }} />
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ display: 'block', width: '100%', border: '1px solid var(--color-border)', borderRadius: '3px' }}
      />

      {/* Play/pause */}
      <button onClick={() => setRunning(r => !r)} style={{
        marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
        padding: '0.3rem 0.8rem', borderRadius: '3px', cursor: 'pointer',
        border: '1px solid var(--color-border)', background: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
      }}>
        {running ? '⏸ Pause' : '▶ Play'}
      </button>

      {/* Transport metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.72rem' }}>
        <div style={{ padding: '0.5rem', background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
          <div style={{ color: '#4488ff', marginBottom: '0.25rem' }}>Electrons</div>
          <div style={{ color: 'var(--color-text-muted)' }}>μn = {muN.toFixed(0)} cm²/V·s</div>
          <div style={{ color: 'var(--color-text-muted)' }}>vd = {vdN.toExponential(2)} cm/s</div>
          <div style={{ color: 'var(--color-text-muted)' }}>D = {D_N.toFixed(1)} cm²/s</div>
        </div>
        <div style={{ padding: '0.5rem', background: 'var(--color-bg-grid)', border: '1px solid var(--color-border)', borderRadius: '3px' }}>
          <div style={{ color: '#ff6644', marginBottom: '0.25rem' }}>Holes</div>
          <div style={{ color: 'var(--color-text-muted)' }}>μp = {muP.toFixed(0)} cm²/V·s</div>
          <div style={{ color: 'var(--color-text-muted)' }}>vd = {vdP.toExponential(2)} cm/s</div>
          <div style={{ color: 'var(--color-text-muted)' }}>D = {D_P.toFixed(1)} cm²/s</div>
        </div>
      </div>

      <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginTop: '0.5rem', marginBottom: 0 }}>
        Blue ● = electrons drift opposite to E; Red ○ = holes drift with E. Random walk represents thermal diffusion.
        Einstein relation: D = μkT/q.
      </p>
    </div>
  );
}
