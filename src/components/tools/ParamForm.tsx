// ParamForm.tsx — renders editable parameters declared in tool.params.

import type { ToolParam } from '../../lib/tools/types';

interface Props {
  params: ToolParam[];
  values: Record<string, string | number>;
  onChange: (next: Record<string, string | number>) => void;
}

export default function ParamForm({ params, values, onChange }: Props) {
  if (!params.length) return null;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 8,
      padding: '8px 10px',
      border: '1px solid var(--color-border)',
      borderRadius: 4,
      background: 'var(--color-bg-grid)',
      marginTop: 8,
    }}>
      {params.map(p => (
        <ParamField
          key={p.name}
          param={p}
          value={values[p.name] ?? p.default}
          onChange={v => onChange({ ...values, [p.name]: v })}
        />
      ))}
    </div>
  );
}

function ParamField({ param, value, onChange }: {
  param: ToolParam;
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
      <span>{param.label}</span>
      {param.kind === 'number' && (
        <input
          type="number"
          min={param.min}
          max={param.max}
          step={param.step ?? 'any'}
          value={Number(value)}
          onChange={e => onChange(Number(e.target.value))}
          style={inputStyle()}
        />
      )}
      {param.kind === 'text' && (
        <input
          type="text"
          value={String(value)}
          onChange={e => onChange(e.target.value)}
          style={inputStyle()}
        />
      )}
      {param.kind === 'select' && (
        <select
          value={String(value)}
          onChange={e => onChange(e.target.value)}
          style={inputStyle()}
        >
          {param.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 3,
    padding: '3px 6px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
  };
}
