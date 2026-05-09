// JsToolView.tsx — picks a JS tool component out of the registry by key.
// Hydrated as client:visible from the [tool].astro page.

import { JS_TOOL_REGISTRY } from './registry';

interface Props {
  componentKey: string;
}

export default function JsToolView({ componentKey }: Props) {
  const Comp = JS_TOOL_REGISTRY[componentKey];
  if (!Comp) {
    return (
      <div style={{
        padding: '1rem 1.25rem',
        border: '1px solid #ef4444',
        borderRadius: 4,
        background: 'rgba(239, 68, 68, 0.06)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        color: '#ef4444',
      }}>
        Unknown JS tool: <code>{componentKey}</code>. Register it in
        <code> src/components/tools/registry.ts</code>.
      </div>
    );
  }
  return <Comp />;
}
