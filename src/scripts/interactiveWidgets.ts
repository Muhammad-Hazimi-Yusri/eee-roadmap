// src/scripts/interactiveWidgets.ts
// Mounts small interactive widgets inside rendered concept notes.
//
// Widgets are opt-in: an author embeds a raw HTML placeholder in the
// concept's markdown, e.g.
//
//   <div data-widget="power-factor-slider"></div>
//
// After the window innerHTML is set, call `mountWidgetsIn(bodyEl)` to scan
// for these placeholders and hydrate them with real DOM + event handlers.
// Already-mounted widgets are skipped via a `data-widget-mounted` guard so
// this function is safe to call repeatedly.

type WidgetMounter = (el: HTMLElement) => void;

const widgets: Record<string, WidgetMounter> = {
  'power-factor-slider': mountPowerFactorSlider,
};

export function mountWidgetsIn(root: Element | null | undefined): void {
  if (!root) return;
  const nodes = root.querySelectorAll<HTMLElement>('[data-widget]');
  nodes.forEach((el) => {
    if (el.dataset.widgetMounted === 'true') return;
    const name = el.dataset.widget;
    if (!name) return;
    const mounter = widgets[name];
    if (!mounter) return;
    try {
      mounter(el);
      el.dataset.widgetMounted = 'true';
    } catch (err) {
      console.error(`Failed to mount widget "${name}":`, err);
    }
  });
}

// --- Power Factor Slider ---------------------------------------------------

/**
 * An interactive slider that lets the reader sweep the power-factor angle φ
 * and see how P (real), Q (reactive), S (apparent), and cos φ relate. It
 * also toggles between leading (capacitive) and lagging (inductive) loads.
 *
 * Visuals:
 *   - An SVG "power triangle" that redraws as the angle changes.
 *   - A phasor diagram (V on the x-axis, I rotated by ±φ) showing the
 *     phase relationship between voltage and current.
 *   - A cos(φ) vs φ curve with a marker at the current angle.
 */
function mountPowerFactorSlider(host: HTMLElement): void {
  // Read optional initial values from data attributes.
  const initialAngleDeg = clamp(
    Number(host.dataset.initialAngleDeg ?? 30),
    0,
    89,
  );
  const initialMode = host.dataset.initialMode === 'leading' ? 'leading' : 'lagging';

  host.classList.add('pf-slider-widget');
  host.innerHTML = `
    <div class="pf-slider__header">
      <strong>Power Factor Explorer</strong>
      <span class="pf-slider__hint">drag the slider or toggle leading/lagging</span>
    </div>

    <div class="pf-slider__controls">
      <label class="pf-slider__label">
        <span>Angle φ</span>
        <input
          type="range"
          class="pf-slider__range"
          min="0"
          max="89"
          step="1"
          value="${initialAngleDeg}"
        />
        <span class="pf-slider__angle-readout">${initialAngleDeg}°</span>
      </label>

      <div class="pf-slider__mode" role="radiogroup" aria-label="Load type">
        <button type="button" class="pf-slider__mode-btn" data-mode="lagging" aria-pressed="${initialMode === 'lagging'}">
          Lagging <span class="pf-slider__mode-sub">(inductive)</span>
        </button>
        <button type="button" class="pf-slider__mode-btn" data-mode="leading" aria-pressed="${initialMode === 'leading'}">
          Leading <span class="pf-slider__mode-sub">(capacitive)</span>
        </button>
      </div>
    </div>

    <div class="pf-slider__readouts">
      <div class="pf-slider__readout">
        <span class="pf-slider__readout-label">cos φ</span>
        <span class="pf-slider__readout-value" data-readout="cos">—</span>
      </div>
      <div class="pf-slider__readout">
        <span class="pf-slider__readout-label">P / S</span>
        <span class="pf-slider__readout-value" data-readout="p">—</span>
      </div>
      <div class="pf-slider__readout">
        <span class="pf-slider__readout-label">Q / S</span>
        <span class="pf-slider__readout-value" data-readout="q">—</span>
      </div>
      <div class="pf-slider__readout">
        <span class="pf-slider__readout-label">type</span>
        <span class="pf-slider__readout-value" data-readout="type">—</span>
      </div>
    </div>

    <div class="pf-slider__diagrams">
      <svg class="pf-slider__svg pf-slider__triangle" viewBox="0 0 220 160" aria-label="Power triangle">
        <title>Power triangle (P, Q, S)</title>
        <!-- Axes / grid drawn at render time -->
        <g data-layer="triangle"></g>
      </svg>

      <svg class="pf-slider__svg pf-slider__phasor" viewBox="-120 -120 240 240" aria-label="Phasor diagram">
        <title>Phasor diagram (V and I)</title>
        <circle cx="0" cy="0" r="90" fill="none" stroke="currentColor" stroke-opacity="0.15"/>
        <line x1="-100" y1="0" x2="100" y2="0" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
        <line x1="0" y1="-100" x2="0" y2="100" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
        <g data-layer="phasor"></g>
      </svg>
    </div>

    <p class="pf-slider__explanation" data-readout="explanation"></p>
  `;

  const range = host.querySelector<HTMLInputElement>('.pf-slider__range')!;
  const angleReadout = host.querySelector<HTMLElement>('.pf-slider__angle-readout')!;
  const cosReadout = host.querySelector<HTMLElement>('[data-readout="cos"]')!;
  const pReadout = host.querySelector<HTMLElement>('[data-readout="p"]')!;
  const qReadout = host.querySelector<HTMLElement>('[data-readout="q"]')!;
  const typeReadout = host.querySelector<HTMLElement>('[data-readout="type"]')!;
  const explanation = host.querySelector<HTMLElement>('[data-readout="explanation"]')!;
  const triangleLayer = host.querySelector<SVGGElement>('[data-layer="triangle"]')!;
  const phasorLayer = host.querySelector<SVGGElement>('[data-layer="phasor"]')!;
  const modeButtons = host.querySelectorAll<HTMLButtonElement>('.pf-slider__mode-btn');

  let mode: 'lagging' | 'leading' = initialMode;

  function setMode(next: 'lagging' | 'leading') {
    mode = next;
    modeButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.mode === mode));
    });
    render();
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode === 'leading' ? 'leading' : 'lagging');
    });
  });

  range.addEventListener('input', render);

  function render() {
    const deg = Number(range.value);
    const rad = (deg * Math.PI) / 180;
    const cosPhi = Math.cos(rad);
    const sinPhi = Math.sin(rad);

    angleReadout.textContent = `${deg}°`;
    cosReadout.textContent = cosPhi.toFixed(3);
    pReadout.textContent = cosPhi.toFixed(3);
    qReadout.textContent = sinPhi.toFixed(3);
    typeReadout.textContent = deg === 0 ? 'unity' : mode;

    renderTriangle(triangleLayer, cosPhi, sinPhi, deg, mode);
    renderPhasor(phasorLayer, rad, mode);

    explanation.textContent = describe(deg, cosPhi, mode);
  }

  // Initial render
  render();
}

function renderTriangle(
  layer: SVGGElement,
  cosPhi: number,
  sinPhi: number,
  deg: number,
  mode: 'lagging' | 'leading',
): void {
  // Coordinate system: P along x-axis (apparent power S = 1 for all cases).
  // For lagging (inductive), Q is positive (drawn upward, but SVG y grows
  // downward so we flip sign). For leading (capacitive), Q is negative.
  const pad = 20;
  const originX = pad;
  const originY = 110; // baseline for P
  const scale = 160;   // length of P side when cosPhi = 1

  const pLen = cosPhi * scale;
  const qLen = sinPhi * scale;
  const qDir = mode === 'lagging' ? -1 : 1; // lagging draws upward in screen coords (y shrinks)

  const px = originX + pLen;
  const py = originY;
  const qx = px;
  const qy = originY + qDir * qLen;

  // Always render the full S hypotenuse from origin to (qx, qy).
  layer.innerHTML = `
    <!-- S (apparent power) -->
    <line x1="${originX}" y1="${originY}" x2="${qx}" y2="${qy}"
          stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/>
    <!-- P (real power) -->
    <line x1="${originX}" y1="${originY}" x2="${px}" y2="${py}"
          stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Q (reactive power) -->
    <line x1="${px}" y1="${py}" x2="${qx}" y2="${qy}"
          stroke="#fb923c" stroke-width="2.5" stroke-linecap="round"/>

    <!-- Labels -->
    <text x="${originX + pLen / 2}" y="${originY + 14}" fill="#4ade80"
          text-anchor="middle" font-size="11" font-weight="600">P</text>
    <text x="${px + 10}" y="${originY + (qDir * qLen) / 2}" fill="#fb923c"
          text-anchor="start" font-size="11" font-weight="600">Q</text>
    <text x="${originX + (qx - originX) / 2 - 12}" y="${originY + (qy - originY) / 2 - 6}"
          fill="#c084fc" text-anchor="end" font-size="11" font-weight="600">S</text>

    <!-- Angle arc at origin -->
    ${renderAngleArc(originX, originY, deg, qDir)}
    <text x="${originX + 36}" y="${originY + qDir * 10}"
          fill="currentColor" font-size="10">φ=${deg}°</text>
  `;
}

function renderAngleArc(cx: number, cy: number, deg: number, qDir: number): string {
  if (deg === 0) return '';
  const r = 28;
  const rad = (deg * Math.PI) / 180;
  const endX = cx + r * Math.cos(rad);
  const endY = cy + qDir * r * Math.sin(rad);
  const sweep = qDir > 0 ? 1 : 0;
  return `<path d="M ${cx + r} ${cy} A ${r} ${r} 0 0 ${sweep} ${endX.toFixed(2)} ${endY.toFixed(2)}"
            fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.2"/>`;
}

function renderPhasor(layer: SVGGElement, rad: number, mode: 'lagging' | 'leading'): void {
  const vLen = 90;
  // Voltage phasor along +x axis
  const vx = vLen;
  const vy = 0;

  // Current phasor: lagging → I lags V → I angle = -φ (rotates clockwise
  // from V by φ in math convention, but SVG y is inverted so it draws
  // downward). Leading → I angle = +φ.
  const iAngle = mode === 'lagging' ? -rad : rad;
  // Display: SVG y is flipped vs. math convention, so to show lagging
  // as "below" V we use +sin for the y in SVG space.
  const iDrawAngle = mode === 'lagging' ? rad : -rad;
  const iLen = 80;
  const ix = iLen * Math.cos(iDrawAngle);
  const iy = iLen * Math.sin(iDrawAngle);

  layer.innerHTML = `
    <!-- V phasor -->
    <line x1="0" y1="0" x2="${vx}" y2="${vy}"
          stroke="#60a5fa" stroke-width="2.5"
          marker-end="url(#pf-arrow-blue)"/>
    <text x="${vx + 6}" y="4" fill="#60a5fa" font-size="12" font-weight="600">V</text>

    <!-- I phasor -->
    <line x1="0" y1="0" x2="${ix.toFixed(2)}" y2="${iy.toFixed(2)}"
          stroke="#f472b6" stroke-width="2.5"
          marker-end="url(#pf-arrow-pink)"/>
    <text x="${(ix * 1.08).toFixed(2)}" y="${(iy * 1.08 + 4).toFixed(2)}"
          fill="#f472b6" font-size="12" font-weight="600">I</text>

    <!-- Arrow marker defs (inline so the widget is self-contained) -->
    <defs>
      <marker id="pf-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="#60a5fa"/>
      </marker>
      <marker id="pf-arrow-pink" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="#f472b6"/>
      </marker>
    </defs>

    <!-- φ label near origin -->
    <text x="10" y="${mode === 'lagging' ? 14 : -6}" fill="currentColor"
          font-size="11" opacity="0.7">φ</text>
  `;
  // iAngle is used conceptually but we drew with iDrawAngle, this suppress
  // the unused-variable warning.
  void iAngle;
}

function describe(deg: number, cosPhi: number, mode: 'lagging' | 'leading'): string {
  if (deg === 0) {
    return 'Unity power factor: V and I are in phase, all apparent power becomes real power.';
  }
  const pct = Math.round(cosPhi * 100);
  if (mode === 'lagging') {
    return `Lagging (inductive): current lags voltage by ${deg}°. Only ${pct}% of apparent power is real — the rest is reactive power absorbed by inductance. Adding capacitors cancels Q and raises PF.`;
  }
  return `Leading (capacitive): current leads voltage by ${deg}°. Only ${pct}% of apparent power is real — the rest is reactive power supplied by capacitance. Over-compensation can cause self-excitation in nearby machines.`;
}

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
