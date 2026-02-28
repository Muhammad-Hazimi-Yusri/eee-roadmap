// src/components/simulators/pcb/DRCDemo.tsx
// Interactive DRC (Design Rule Check) teaching tool.
// SVG layout with clickable violations that reveal explanations.
// Hydration: client:visible

import { useState } from 'react';

interface Violation {
  id: string;
  x: number;
  y: number;
  rule: string;
  severity: 'error' | 'warning';
  explanation: string;
  fix: string;
}

const VIOLATIONS: Violation[] = [
  {
    id: 'clearance',
    x: 120,
    y: 60,
    rule: 'Min. Clearance Violation',
    severity: 'error',
    explanation: 'Two copper features are closer than the minimum allowed clearance (0.127 mm / 5 mil). During etching or reflow, copper bridges can form between adjacent conductors, causing short circuits.',
    fix: 'Increase the spacing between the traces to at least 0.127 mm (5 mil). Use DRC constraints in your EDA tool to auto-enforce this.',
  },
  {
    id: 'width',
    x: 240,
    y: 130,
    rule: 'Min. Trace Width Violation',
    severity: 'error',
    explanation: 'This trace is narrower than the minimum 0.127 mm (5 mil) manufacturing limit. Thin traces are susceptible to under-etching (trace break) and have higher resistance, limiting current capacity.',
    fix: 'Widen the trace to at least 0.127 mm. For power traces, calculate the required width using the IPC-2221 formula based on current and temperature rise.',
  },
  {
    id: 'annular',
    x: 340,
    y: 70,
    rule: 'Annular Ring Too Small',
    severity: 'error',
    explanation: 'The annular ring (copper around a via/hole) is below the minimum 0.1 mm. If the drill wanders during fabrication, it can cut through the ring entirely, breaking the connection.',
    fix: 'Increase the pad diameter so the annular ring is at least 0.1 mm after drill tolerance is accounted for. Standard: pad = drill + 0.5 mm.',
  },
  {
    id: 'soldermask',
    x: 180,
    y: 200,
    rule: 'Soldermask Sliver',
    severity: 'warning',
    explanation: 'Two adjacent pads have soldermask openings that are so close together that the sliver of solder resist between them may lift during the reflow process, leaving both pads exposed and potentially bridging.',
    fix: 'Either increase the gap between pads, or deliberately merge the soldermask openings if the component requires it (e.g., exposed-pad ICs).',
  },
  {
    id: 'silkscreen',
    x: 300,
    y: 195,
    rule: 'Silkscreen on Pad',
    severity: 'warning',
    explanation: 'Silkscreen ink printed over a solder pad contaminates the surface and prevents proper solder wetting. This causes cold joints or no-solder opens during assembly.',
    fix: 'Move the reference designator or silk outline so it does not overlap the solder pad footprint. Most EDA tools auto-clip silkscreen to soldermask openings.',
  },
];

// Build a simple PCB SVG layout
function buildLayout(selectedId: string | null): string {
  const W = 480;
  const H = 280;

  // Background
  let svg = `<rect width="${W}" height="${H}" fill="#1a3a1a" rx="4"/>`;

  // Traces
  svg += `<line x1="40" y1="60" x2="200" y2="60" stroke="#b87333" stroke-width="8"/>`;
  svg += `<line x1="109" y1="60" x2="109" y2="150" stroke="#b87333" stroke-width="2.5"/>`; // clearance violation — narrow gap
  svg += `<line x1="131" y1="60" x2="131" y2="150" stroke="#b87333" stroke-width="2.5"/>`;  // close to above

  // Wide trace continues
  svg += `<line x1="200" y1="60" x2="380" y2="60" stroke="#b87333" stroke-width="8"/>`;

  // Thin trace (width violation)
  svg += `<line x1="200" y1="130" x2="380" y2="130" stroke="#b87333" stroke-width="1.5"/>`;
  svg += `<line x1="40" y1="130" x2="200" y2="130" stroke="#b87333" stroke-width="8"/>`;

  // Pads (annular ring violation)
  svg += `<circle cx="340" cy="70" r="12" fill="#b87333" stroke="#1a3a1a" stroke-width="0.5"/>`;
  svg += `<circle cx="340" cy="70" r="6" fill="#1a3a1a"/>`;  // drill
  svg += `<circle cx="340" cy="70" r="7" fill="none" stroke="#b87333" stroke-width="0.5"/>`;  // tiny annular ring

  // SMT pads (soldermask sliver)
  svg += `<rect x="145" y="185" width="32" height="24" fill="#b87333" rx="2"/>`;
  svg += `<rect x="183" y="185" width="32" height="24" fill="#b87333" rx="2"/>`;
  svg += `<text x="164" y="199" font-family="monospace" font-size="7" fill="#1a3a1a" text-anchor="middle">U1</text>`;

  // Component with silkscreen on pad
  svg += `<rect x="268" y="185" width="30" height="22" fill="#b87333" rx="2"/>`;
  svg += `<rect x="304" y="185" width="30" height="22" fill="#b87333" rx="2"/>`;
  // silkscreen line overlapping pad (violation)
  svg += `<text x="305" y="196" font-family="monospace" font-size="9" fill="#fff" stroke="#fff" stroke-width="0.3">R1</text>`;

  // DRC violation markers
  for (const v of VIOLATIONS) {
    const isSelected = v.id === selectedId;
    const color = v.severity === 'error' ? '#e84040' : '#e8a040';
    const r = isSelected ? 16 : 12;
    svg += `<circle cx="${v.x}" cy="${v.y}" r="${r}" fill="none" stroke="${color}" stroke-width="${isSelected ? 2.5 : 1.5}" stroke-dasharray="${isSelected ? '0' : '4,2'}" class="drc-marker" data-id="${v.id}" style="cursor:pointer"/>`;
    svg += `<text x="${v.x}" y="${v.y + 4}" font-family="monospace" font-size="${isSelected ? 11 : 9}" fill="${color}" text-anchor="middle" style="pointer-events:none">!</text>`;
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-height:280px">${svg}</svg>`;
}

export default function DRCDemo() {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSvgClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as SVGElement;
    const marker = target.closest?.('[data-id]') as SVGElement | null;
    if (marker) {
      const id = marker.dataset['id'] ?? null;
      setSelected(prev => (prev === id ? null : id));
    } else {
      setSelected(null);
    }
  }

  const violation = VIOLATIONS.find(v => v.id === selected);

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        Click a violation marker (!) to learn about each DRC rule.
      </p>

      {/* PCB layout */}
      <div
        onClick={handleSvgClick}
        dangerouslySetInnerHTML={{ __html: buildLayout(selected) }}
        style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }}
      />

      {/* Violation legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: '#e84040' }}>⬤ Error</span>
        <span style={{ fontSize: '0.72rem', color: '#e8a040' }}>⬤ Warning</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{VIOLATIONS.length} violations total</span>
      </div>

      {/* Selected violation panel */}
      {violation ? (
        <div style={{ marginTop: '0.75rem', padding: '0.9rem', background: 'var(--color-bg-grid)', borderRadius: '4px', border: `1px solid ${violation.severity === 'error' ? '#c04040' : '#c08030'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: violation.severity === 'error' ? '#e84040' : '#e8a040', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {violation.severity}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{violation.rule}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 0.6rem' }}>
            {violation.explanation}
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6, paddingLeft: '0.6rem', borderLeft: '2px solid var(--color-border)' }}>
            <strong style={{ color: 'var(--color-text)' }}>Fix: </strong>{violation.fix}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-grid)', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
          Select a violation marker above to see its explanation and fix.
        </div>
      )}
    </div>
  );
}
