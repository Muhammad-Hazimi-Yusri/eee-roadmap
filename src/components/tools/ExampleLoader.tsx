// ExampleLoader.tsx — a row of "load example" buttons that pre-populate a tool
// with sample inputs so the user can verify the tool works without hunting for
// real data. Each example calls back into the tool to apply itself.

export interface ToolExample {
  /** Short label shown on the button. */
  label: string;
  /** Optional tooltip — appears as `title` on hover. */
  description?: string;
  /** Apply the example: set files, params, textarea, etc. */
  onLoad: () => void;
}

interface Props {
  examples: ToolExample[];
  /** Override the leading label. Defaults to "Try sample". */
  intro?: string;
}

export default function ExampleLoader({ examples, intro = 'Try sample' }: Props) {
  if (examples.length === 0) return null;
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      padding: '6px 10px',
      marginBottom: 10,
      background: 'color-mix(in srgb, var(--color-copper, #c87533) 6%, transparent)',
      border: '1px dashed color-mix(in srgb, var(--color-copper, #c87533) 35%, var(--color-border))',
      borderRadius: 4,
    }}>
      <span style={{
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-text-muted)',
        marginRight: 2,
      }}>{intro}</span>
      {examples.map((ex, i) => (
        <button
          key={i}
          onClick={ex.onLoad}
          title={ex.description}
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-copper, #c87533)',
            border: '1px solid var(--color-copper, #c87533)',
            borderRadius: 3,
            padding: '3px 9px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            lineHeight: 1.2,
          }}
        >
          ⚡ {ex.label}
        </button>
      ))}
    </div>
  );
}
