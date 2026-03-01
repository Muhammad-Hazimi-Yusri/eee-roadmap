# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

> ⚠️ **Content Notice:** Roadmap content (descriptions, concepts, resources) is AI-generated. Topics marked ✓ have been manually reviewed by a verifier. Unverified content may be inaccurate or contain broken links. Use as a learning guide, not authoritative reference. Contributions and corrections welcome!

---

[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Version](https://img.shields.io/badge/version-0.22.14-blue.svg)]()
[![Status](https://img.shields.io/badge/status-In%20Development-yellow.svg)]()

<details>
<summary><strong>Table of Contents</strong></summary>

- [Current Features](#current-features)
  - [For Learners](#for-learners)
  - [For Explorers](#for-explorers)
  - [For Contributors](#for-contributors)
  - [Technical Highlights](#technical-highlights)
- [Roadmap](#roadmap)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Run Locally](#run-locally)
- [Contributing](#contributing)
- [License](#license)

</details>

## Current Features
Current version is v0.22.14

### For Verifiers & Admins
- **Content Verification** — Trusted users can verify topic quality across three aspects: *content* (accuracy), *resources* (links valid/relevant), and *pedagogy* (outcomes, prereqs, ordering)
- **Verification Badges** — Topics show a green ✓ (all 3 aspects), amber partial (1–2), or red `0/3` (unverified) badge on their title; badge tooltip shows ✓/✗ status per aspect; section pills and track-level summary cascade automatically; a "◎ Hide badges / ◉ Show badges" toggle next to the track summary controls badge visibility (preference persisted in localStorage, defaults to visible)
- **Verifier Panel** — Users with verifier or admin role see a 3-aspect checkbox panel at the bottom of each expanded topic; confirm dialog before recording; toast feedback on success/failure; collapsible via a per-page "↓ Show panels / ↑ Collapse panels" toggle (preference persisted in localStorage)
- **Admin Panel** — Role management at `/admin`: grant/revoke verifier or admin roles by user UUID; verification dashboard showing coverage per track
- **Graceful Degradation** — Supabase unavailable or unconfigured? Badges simply don't appear; no errors shown to end users

### For Learners
- **Interactive Roadmaps** — Expand/collapse topic nodes with descriptions, prerequisites, and curated resources
- **Progress Tracking** — Mark concepts complete (✓) or important (★), persists across sessions
- **Cross-Device Sync** — Sign in with Google to sync progress across devices; works offline with automatic merge on reconnect
- **Focus View** — Quickly expand only incomplete or highlighted topics with visual glow feedback
- **Expand/Collapse All** — Manage topic visibility in one click
- **Two Interaction Modes:**
  - *Simple* — Click (notes), double-click (complete), shift+click (important)
  - *Tools* — Swipe gestures with pen/highlighter/eraser (optimized for tablet/stylus)
- **Concept Windows** — Draggable, resizable note windows with markdown, LaTeX equations, and embedded PDFs; open windows persist across page refreshes; taskbar for window management; built-in markdown editor for adding personal notes; collapse windows to titlebar-only (position/width preserved); pin windows to lock position and prevent accidental dragging; per-window transparency slider (30–100%) with frosted-paper backdrop effect; global transparency control in the settings panel
- **Custom Concept Notes** — Add personal notes to any concept (official or custom tracks); notes appear above original content with visual distinction; supports full markdown with LaTeX
- **Add Custom Concepts** — Create your own concept pills on official track topics (signed-in users); concepts sync across devices
- **Global Search** — Fuzzy search across all tracks, topics, and concept notes (`Ctrl+K`)
- **Deep Links** — Share links directly to specific concepts
- **State Persistence** — Topic expand/collapse state saved per track, settings panel remembers preferences
- **Glossary** — 100+ EEE terms with definitions, LaTeX equations, and cross-references
- **Auto-linked Terms** — Glossary terms in roadmap content show tooltips on hover
- **Profile Page** — View your progress across all tracks; works offline for guests, syncs when signed in
- **Import/Export** — Back up your progress as JSON; import with merge or replace options
- **Graph View** — Interactive visualization of topic connections and prerequisites; fullscreen mode on all devices; dark mode support; progress status indicators; per-track focused view on roadmap pages
- **Print Mode** — Select individual concepts, topics, or entire sections to export as a clean PDF; cascading checkbox tree with live preview; field-level toggles (description, prerequisites, outcomes, concept notes, resources); optional 2-column layout; section page breaks (new page per section, or column break in 2-column mode); high contrast mode (no gray text); A5 booklet printing with pdf-lib imposition (double-sided or single-sided); progress-based quick-select filters (completed, highlighted, incomplete — union logic); QR codes for embedded PDFs and resource links (links to source URL with hosted-site fallback); per-type display controls for PDF and resource links (QR + URL, QR only, URL only, hidden); fallback URL toggle; works for both official and custom tracks

### For Explorers
- **Four Tracks** — Fundamentals, Core, Advanced, Distributed Generation
- **Browse All Tracks** — `/roadmaps/` page with category + progress filters and boxed/unboxed view
- **Custom Tracks** — Create your own learning roadmaps with the built-in editor (requires sign-in)
  - Full track editor: sections, topics, concepts, resources, prerequisites
  - **Official concept picker** — "Browse Library" button opens a searchable modal to pick from 427 library concepts across 14 domains; concepts added this way resolve their full notes from the library at view-time; picked concepts show a green `L` badge in the editor
  - Custom inline concepts still supported via text-input (type name + Enter); both formats coexist in the same topic (mixed format, fully backward compatible with existing data)
  - Inline concept notes editor: click a concept pill to edit its markdown notes directly; includes a 10-button markdown formatting toolbar (Bold, Italic, Heading, Link, Image, LaTeX inline/block, Bulleted list, Inline/Block code) and an Edit/Preview toggle that renders the markdown with `parseNotesClient()` (supports KaTeX, images, PDFs) — instant, no page refresh
  - Prerequisite picker with cascading dropdowns (official + custom tracks)
  - Drag-and-drop reordering for sections and topics
  - Collapsible sections/topics for easier organization
  - Live preview before saving
  - Export track as JSON for backup/sharing
  - Import track from JSON file
  - Delete track with confirmation (cleans up all associated data)
  - Print mode with same features as official tracks (client-side rendering)
  - Stored in Supabase (syncs across devices)
- **Custom Track Display** — View custom tracks at `/roadmaps/custom/?track=slug` with full interactivity (progress tracking, tools mode, concept windows)
- **Cross-track Navigation** — Clickable prerequisites link between related topics
- **Prerequisite Behavior** — Smart defaults (same-track = same tab, cross-track = new tab)

### For Contributors
- **YAML Content Format** — Human-readable with auto-defaults and schema validation
- **Dynamic Track Discovery** — Drop a YAML file in `content/`, track appears automatically
- **Developer Tooling:**
  - `npm run validate` — Schema validation
  - `npm run lint` — ESLint (JS/TS/Astro) + Stylelint (CSS/Astro)
  - `npm run version:bump` — Interactive version updater
  - Pre-commit hooks for build/validate/lint

### Technical Highlights
- **Stack:** Astro, React 19, TypeScript, Tailwind CSS
- **Interactive Simulators:** React (`@astrojs/react`) for canvas/SVG visualisers; hydration strategies: `client:idle` (calculators), `client:visible` (animations), `client:only="react"` (browser-only APIs)
- **Search:** Fuse.js fuzzy matching with highlighted snippets
- **PDFs:** PDF.js for cross-browser viewing, auto-downloaded at build time; pdf-lib for client-side booklet imposition; qrcode for print-mode QR codes
- **Math:** KaTeX for LaTeX equation rendering (conditionally loaded, non-render-blocking)
- **Performance:** Non-render-blocking fonts/CSS, HTML compression, viewport prefetching, CLS prevention, sitemap, canonical URLs
- **SEO:** Dynamic OG meta tags, robots.txt, `@astrojs/sitemap`, canonical URLs, theme-color
- **Accessibility:** Skip-to-content link, WCAG 2.1 AA compliance (axe-core tested), `main` landmarks
- **Mobile:** Touch + stylus support, responsive design
- **Theming:** Dark mode with system preference detection

---

## Roadmap

> See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Completed

<details>
<summary><strong>v0.16 - ConceptWindows Persistence ✓</strong></summary>

- [x] Persist open windows to localStorage
- [x] Restore windows on page load
- [x] Per-track state storage
- [x] Taskbar with "Minimize all" and "Close all" buttons
</details>

<details>
<summary><strong>v0.17 - Cross-Device Sync ✓</strong></summary>

- [x] Supabase integration (auth + PostgreSQL)
- [x] Google OAuth authentication
- [x] Real-time sync on every progress change
- [x] Union merge on login (local + cloud combined)
- [x] Duplicate topic ID validation
- [x] Auth UI with dropdown menu
- [x] Graceful degradation when Supabase not configured
</details>

<details>
<summary><strong>v0.18 - Profile & Data Export ✓</strong></summary>

- [x] GitHub Actions: add Supabase env vars for deployment
- [x] Profile page with progress visualization
- [x] Privacy policy page
- [x] Import/export progress as JSON (merge or replace)
- [x] Auth dropdown for guests with View Profile link
</details>

<details>
<summary><strong>v0.19 - Roadmap Graph View ✓</strong></summary>

- [x] Node-based visualization showing prereq connections
- [x] Interactive graph (click to navigate)
- [x] Dynamic track colors (curated palette + HSL overflow)
- [x] Fullscreen modal for mobile (tap to explore)
- [x] Fullscreen button for desktop
- [x] UI polish (node sizing, labels, dark mode)
- [x] Progress status on nodes (complete/important)
- [x] Legend for node states
- [x] Per-track mini graph on roadmap pages (focused on current track with cross-track prereqs)
- [x] Filter by track on homepage graph

</details>

<details>
<summary><strong>v0.20 - Custom Tracks & Editor ✓</strong></summary>
**Goal:** Let users create and manage their own learning tracks.

- [x] Custom content storage in Supabase (per-user, private, 500KB limit)
- [x] Custom concept notes on existing tracks (distinct styling)
- [x] Display custom tracks on /roadmaps/ with "Custom" badge
- [x] Custom track detail page
- [x] Form-based web editor with validation
  - [x] Editor shell with edit/preview toggle
  - [x] Meta fields (title, description, icon, category, order)
  - [x] Sections management (add/remove/edit title)
  - [x] Topics management (title, description, add/remove)
  - [x] Concepts list (names only - add/remove)
  - [x] Resources within topics (label + url)
  - [x] Prerequisites with cascading dropdown picker (track → section → topic)
  - [x] Validation before save (required fields, duplicate detection)
  - [x] Save to Supabase
  - [x] "Create New Track" button on /roadmaps/ page
- [x] Concept Notes Editor (separate from roadmap editor)
  - Markdown editor inside ConceptWindow (edit button)
  - Works for custom track concepts AND custom notes on official tracks
  - Keeps roadmap editor focused on structure (sections/topics/concept names)
  - Concept content editing is contextual (edit while viewing the concept)
- [x] UI to add custom concept notes on existing tracks
  - "+" button on concept lists (signed-in users)
  - Modal for entering concept name
  - Custom concepts styled distinctly (dashed border)
- [x] Live preview (edit/preview toggle in editor)
- [x] Export as JSON (single track with conceptNotes)
- [x] Import track from JSON file
- [x] Drag-and-drop reordering for sections and topics
</details>

---

### Completed (cont.)

<details>
<summary><strong>v0.21 - Test Coverage & Code Quality (Refactor) ✓</strong></summary>

**Goal:** Improve existing test suite for better reliability and coverage, then improve code quality by linting checks and refactor.

- [x] Add linting (ESLint with TypeScript + Astro)
- [x] Add lint to pre-commit hook
- [x] Fix/unskip flaky Playwright tests (Supabase timing issues)
- [x] Add knip for unused code detection
- [x] Add madge for dependency graph / circular import detection
- [x] Print mode (select & print concepts/topics/sections as PDF)
- [x] Delete custom tracks (with confirmation modal, cleans up associated data)
- [x] Print mode for custom tracks (client-side rendering)
- [x] Fix custom track concept notes not persisting on reload
- [x] Fix concept window rendering raw markdown instead of HTML on custom tracks
- [x] Print mode: field-level toggles and 2-column layout option (both official and custom tracks)
- [x] Print mode: shared CSS/JS extracted into `src/styles/print.css` and `src/utils/printUtils.ts`
- [x] Print mode: fix page 1 wasted space, table whitespace gaps, column balancing on last page
- [x] Inline concept notes editor in track editor (click pill to edit `concept.notes` markdown)
- [x] Add tests for new sync/auth functionality
- [x] Accessibility tests (a11y)
- [x] Increase unit test coverage for utilities
- [x] CSS duplicate audit and refactoring (design tokens, deduplication, dead code cleanup)
- [x] Stylelint for CSS linting (`.css` + `.astro` `<style>` blocks)
- [x] Fix broken Wikimedia image URLs in advanced-power-system-analysis track
- [x] Print mode: high contrast toggle, A5 booklet printing, section page breaks, progress filters, QR codes
- [x] Lighthouse score and performance optimisation
  - Non-render-blocking KaTeX CSS (conditional `needsKatex` prop — only loaded on pages that need math)
  - Non-render-blocking Google Fonts (preload + media swap pattern)
  - `@astrojs/sitemap`, `robots.txt`, canonical URLs, dynamic OG meta tags
  - HTML compression, viewport-based link prefetching, skip-to-content link
  - Homepage Lighthouse Performance: 35 → 69, FCP: 13.2s → 4.8s, LCP: 19.5s → 5.1s
</details>

---

<details>
<summary><strong>v0.22 - Content Verification ✓</strong></summary>

**Goal:** Infrastructure for manually vetting AI-generated content before 1.0.

- [x] `user_roles` + `verifications` tables with RLS (Supabase SQL schema)
- [x] Three verification aspects per topic: *content*, *resources*, *pedagogy*
- [x] Partial unique index — one active verification per (topic, aspect) at a time
- [x] `public.has_role()` SECURITY DEFINER function for RLS policies
- [x] `src/types/verification.ts` — typed interfaces for all verification data
- [x] `src/utils/verification.ts` — Supabase helpers + pure status computation (fetch, build summaries, verify, revoke, role management)
- [x] Verification badges on topic titles: green ✓ (all 3 aspects), amber partial (1–2)
- [x] Tooltip on badges: verifier name + date per aspect
- [x] Section-level count pill (e.g. "3/5 verified") on section headers
- [x] Track-level summary in track page header
- [x] Track card labels on `/roadmaps/` update from ⚠ UNVERIFIED → X% VERIFIED or ✓ VERIFIED
- [x] Verifier panel injected into topic nodes for users with verifier/admin role
- [x] Confirm dialog before verifying; toast on success/failure; optimistic UI with revert on error
- [x] Admin revoke option in verifier panel (soft delete via `revoked_at`)
- [x] Admin panel at `/admin`: role grant/revoke + verification coverage dashboard
- [x] Graceful degradation — Supabase down → no badges, no errors
</details>

---

<details>
<summary><strong>v0.22.12 - Phase 1 Circuit Simulator (Tier 1 + Tier 2 foundation) ✓</strong></summary>

**Goal:** Launch interactive circuit tutorials with Falstad iframe embed, TypeScript MNA solver, and tutorial stepper.

- [x] `FalstadEmbed.astro` — iframe wrapper for CircuitJS1 hosted at falstad.com; circuit text via `ctz` URL param (URL-encoded at build time); GPL-2.0 isolation: iframe-only, never bundled; configurable height and editable props; attribution footer
- [x] MNA solver (`src/lib/circuit/mna-solver.ts`) — Modified Nodal Analysis engine using `mathjs` `lusolve`; stamps resistors, voltage/current sources into conductance matrix; supports per-component value overrides for slider-driven re-simulation; `checkExpected()` for probe tolerance checking; 12 unit tests (Ohm's Law, Voltage Divider, Series-Parallel KCL)
- [x] `TutorialStepper.astro` — prev/next navigation, dot indicators, hint `<details>` reveal per step, completion banner; step persisted to `sessionStorage`; pure vanilla JS
- [x] Circuit lesson JSON schema (`src/data/circuits/_schema/circuit.schema.json`) — JSON Schema draft-07 validating component types, probes, expected values, tutorial steps
- [x] 3 fundamentals lessons: `ohms-law.json`, `voltage-divider.json`, `kvl-kcl.json` — each with components, probes, expected values (with tolerances), Falstad circuit string, 4 tutorial steps
- [x] `/learn/circuits/` lesson browser — auto-discovers lesson files via `import.meta.glob`; groups by category; difficulty badges
- [x] `/learn/circuits/[category]/[lesson]/` lesson page — Falstad embed + tutorial stepper; two-column layout on wide screens; static paths from JSON at build time
- [x] `circuits` added to main header nav
- [x] `mathjs` v15.1.1 dependency (Apache-2.0)
</details>

---

<details>
<summary><strong>v0.22.13 - Phase 2 PCB Design, Digital Electronics & Semiconductor Physics ✓</strong></summary>

**Goal:** Three new interactive learning domains with 12 lessons, 10 React visualiser components, 4 TypeScript library modules, and 35 new concept library entries.

- [x] `@astrojs/react` integration; React 19 + TypeScript; `wavedrom` and `web-gerber` dependencies
- [x] **Impedance library** — `microstripZ0` (Wheeler 1977) + `striplineZ0` (Schneider) with unit tests (FR4 50 Ω / 75 Ω reference values)
- [x] **Semiconductor physics library** — `carrier-stats.ts`: intrinsic concentration (Sze), Fermi-Dirac, Caughey-Thomas mobility; `poisson-solver.ts`: 1D FD Poisson via Thomas algorithm with BC unit tests
- [x] **PCB static components** — `LayerStackupDiagram.astro` (2/4/6/8-layer SVG cross-section, interactive `<select>`), `ViaTypeVisualizer.astro` (4 via types side-by-side), `KiCanvasEmbed.astro` (CDN web component)
- [x] **PCB React components** — `ImpedanceCalculator.tsx` (linked sliders + Z₀/εr_eff display + mini Z₀-vs-W/H chart), `TraceRoutingDemo.tsx` (canvas tutorial: 45°/differential/return-path), `DRCDemo.tsx` (5 clickable DRC violations), `GerberViewer.tsx` (drag-drop, `web-gerber` SVG render, layer selector)
- [x] **4 PCB lessons** at `/learn/pcb/`: stackup basics, via types, impedance control, trace routing
- [x] **Digital static components** — `WaveDromDiagram.astro` (CDN WaveDrom), `CircuitVerseEmbed.astro` (sandboxed iframe)
- [x] **Digital React components** — `TruthTableGenerator.tsx` (recursive-descent parser for AND/OR/NOT/XOR/NAND/NOR/XNOR + SOP output), `VerilogPlayground.tsx` (Yosys WASM lazy-loaded on button click → DigitalJS simulation)
- [x] **4 digital lessons** at `/learn/digital/`: timing diagrams (WaveDrom), logic gates, truth tables, Verilog intro
- [x] **Semiconductor React components** — `PNJunctionViz.tsx` (4-panel SVG: ρ/E/ψ/I-V with Shockley operating point), `MOSFETCrossSectionViz.tsx` (SVG cross-section + Id-Vds curves, region labels), `BandDiagramSim.tsx` (Ec/Ev/Ei/EFn/EFp via Poisson solver, 3 modes), `CarrierAnimation.tsx` (canvas particle system with drift + Einstein relation display)
- [x] **4 semiconductor lessons** at `/learn/semiconductor/`: PN junction, MOSFET operation, band diagrams, carrier transport
- [x] **Concept library** — `pcb-design.yaml` (20 concepts) + `semiconductor-physics.yaml` (15 concepts); library grows from 392 → 427 concepts across 14 domains
- [x] `@yowasp/yosys`, `yosys2digitaljs`, `digitaljs` marked Rollup `external` (lazy WASM, not pre-installed)
</details>

---

<details>
<summary><strong>v0.22.14 - Phase 3 Power Systems Analysis ✓</strong></summary>

**Goal:** AC power flow solver with Newton-Raphson and Gauss-Seidel, fault analysis, interactive single-line diagram, and 5 power systems lessons — all running in the browser without a backend.

- [x] **Power flow library** (`src/lib/power/`) — `types.ts` (interfaces: Bus, Line, Transformer, Generator, Load, PowerNetwork, PowerFlowResults), `ybus.ts` (pi-model line + off-nominal transformer Y-bus stamping via mathjs), `jacobian.ts` (H/N/M/L sub-matrices in polar form, full `(nNonSlack + nPQ) × (nNonSlack + nPQ)` Jacobian), `newton-raphson.ts` (flat start, `lusolve`, |V|-scaled update, 1e-6 pu tolerance, max 50 iterations, divergence guard), `gauss-seidel.ts` (complex voltage iteration, α=1.6 acceleration, Q-clamped PV buses), `fault-analysis.ts` (Z-bus = Y-bus⁻¹ via `mathjs` `inv`, `I_fault = V₀/Z_kk`, per-bus faulted voltage profile)
- [x] **63 new unit tests** — `ybus.test.ts` (17: Y-bus construction, transformer tap-side admittance `y_t/a²`, symmetry), `newton-raphson.test.ts` (40: all 14 IEEE 14-bus buses vs MATPOWER case14 to ±0.002 pu / ±0.1°, loss balance), `gauss-seidel.test.ts` (6: convergence, GS iterations > NR, voltage agreement with NR within 0.01 pu); total 284 → **347 tests**
- [x] **Network data** (`src/data/power-networks/`): `simple-3bus.json` (3-bus hand-calculable), `ieee-14bus.json` (14 buses, 17 lines, 3 off-nominal transformers, 5 generators), `dg-integration.json` (5-bus with solar PV bus), `reference/ieee-test-cases.json` (MATPOWER case14 expected values)
- [x] **7 React components** (`src/components/simulators/power/`): `PowerFlowSimulator.tsx` (orchestrator, NR/GS dispatch, fault mode), `SingleLineDiagram.tsx` (pure React/SVG: bus bars, generators, loads, transformers, color-coded lines; pointer-event pan/zoom, no D3), `BusInspector.tsx` (click-to-inspect V pu/kV, θ, P, Q), `VoltageProfileChart.tsx` (SVG bar chart with ±5% bands), `LineLoadingOverlay.tsx` (green/orange/red thermal coloring), `ConvergenceChart.tsx` (log-scale mismatch vs iteration, NR vs GS comparison), `PerUnitConverter.tsx` (V/I/Z/S per-unit calculator)
- [x] **5 lesson pages** at `/learn/power-systems/`: per-unit system, 3-bus power flow, IEEE 14-bus power flow, NR-vs-GS algorithm comparison, 3-phase fault analysis
- [x] **`/learn/power-systems/playground/`** — JupyterLite + Pyodide iframe for browser-based pandapower (30–80 MB WASM Python runtime, no server required); starter code for IEEE 14-bus `case14()` power flow
- [x] `'power-systems'` added to domain union in `src/lib/learn/types.ts`; `power systems` nav entry added to `Header.astro`
</details>

---

### Planned

### Known Issues & Polish

- [ ] Wikimedia embedded images: ~175 return 429 (rate-limited by link checker). Add concurrency/retry to `check-links` so Wikimedia 429s don't fail the build. Verify all embedded images and PDFs are accessible on the live site.
- [ ] iOS Safari: dark mode demo tools switch menu arrow visibility
- [ ] iOS Safari: trail persistence in two-finger swipe (tools mode)
- [ ] Mobile: fullscreen mode bottom bar overlap
- [ ] PDF.js: open-in-new-tab and fullscreen viewer icons
- [ ] Unboxed view: overlapping card layout for overflow
- [ ] Refactor: localStorage keys duplicated across files (should use shared constants)
- [ ] Custom track cards: display Lucide icon from meta (currently hardcoded)
- [ ] Custom tracks: integrate with category filters on /roadmaps/ page
- [ ] Replace browser alerts with custom toast notifications (editor validation)
- [ ] Visual regression tests (when UI stabilizes)

---

### v1.0.0 - Official Release

**Goal:** Production-ready, verified educational resource.

- [ ] All content manually verified
- [ ] Comprehensive test coverage
- [ ] Performance optimized
- [ ] Accessibility audit passed
- [ ] PWA support for offline access
- [ ] Filter by section on track page graph (post-v1.0)

---

### Future Ideas

> Post-launch features, no timeline commitment.

- Gamification (streaks, achievements, learning stats)
- Image/file attachments for notes (Supabase Storage)
- AI-generated roadmap remixing
- Notes parser (upload .md → convert to roadmap format)
- In-class note-taking mode
- WebAssembly circuit simulator *(expanded — see [Interactive Learning Modules](#interactive-learning-modules) below)*
- Freemium tiers (if user growth warrants)
- Community contributions workflow
- User feedback system (comments per section)
- WYSIWYG concept notes editor (Notion-like toolbar with bold, linking, embedding support) to replace the current raw markdown textarea in ConceptWindows

---

### Interactive Learning Modules

> Post-launch. Expands the *WebAssembly circuit simulator* Future Idea into three phases.

#### Phase 1: Circuit Simulator

- [x] CircuitJS1 iframe embeds (`FalstadEmbed.astro`, GPL-2.0, iframe isolation only)
- [x] Custom TypeScript MNA solver (`mathjs`): stamp-based conductance matrix, LU decomposition, 12 unit tests
- [ ] ngspice-WASM (MIT, via EEcircuit/Wokwi) for SPICE-accurate simulation, lazy-loaded (~20 MB)
- [ ] SVG schematic renderer with IEEE symbols, oscilloscope, and parameter sliders
- [ ] WaveDrom (`npm: wavedrom`) for digital timing diagrams
- [x] Tutorial stepper: step-by-step walkthroughs with hints, dot indicators, completion state (`TutorialStepper.astro`)
- [ ] 57 circuit lessons across 7 categories: fundamentals, RC/RL/RLC, diodes, op-amps, transistors, digital, power electronics (3 fundamentals done)
- [x] Circuit lessons defined as JSON (components, probes, expected values, tutorial steps, Falstad/SPICE strings)

#### Phase 2: PCB Design & Semiconductor Learning ✓

- [x] KiCanvas (MIT) web component for KiCad file viewing
- [x] CircuitVerse (MIT iframe) for digital logic; WaveDrom for timing diagrams
- [x] DigitalJS + YoWASP Yosys Verilog playground (~50 MB WASM, lazy-loaded)
- [x] Custom SVG: layer stackup visualizer, via type visualizer, DRC rules demo
- [x] Custom Canvas trace routing tutorial
- [x] Microstrip/stripline impedance calculator (Wheeler/Schneider equations)
- [x] Truth table generator
- [x] PN junction visualizer: depletion width and carrier concentration vs. bias (custom Canvas/SVG)
- [x] Band diagram simulator: 1D Poisson solver (custom Canvas/SVG)
- [x] MOSFET cross-section animation with synchronized I-V curves (custom Canvas/SVG)
- [x] Carrier drift/diffusion animation (custom Canvas/SVG)
- [ ] 3D PCB viewer (Three.js + web-gerber) — future

#### Phase 3: Power Systems Analysis ✓ (core; backend future)

- [x] TypeScript Newton-Raphson power flow solver (`mathjs`) for educational networks (3–50 buses); IEEE 14-bus validated vs MATPOWER case14
- [x] Y-bus builder (pi-model + off-nominal transformers), Jacobian matrix (polar H/N/M/L), and Gauss-Seidel solver for algorithm comparison
- [x] Pure React/SVG single-line diagram with pointer-event pan/zoom and power system symbols (no D3 dependency)
- [x] Color-coded results: bus voltage bar chart with ±5% bands, line loading % overlay (green/orange/red)
- [x] IEEE 14-bus test case (17 lines, 3 transformers, 5 generators); 63 new unit tests (347 total)
- [x] 5 tutorial lessons: per-unit system, 3-bus power flow, IEEE 14-bus, NR-vs-GS algorithm comparison, 3-phase fault analysis
- [x] Pyodide/JupyterLite embed for interactive Python notebooks (~30–80 MB, dedicated `playground` page)
- [ ] FastAPI + pandapower (BSD) backend for larger networks and IEC 60909 short circuit (optional, Docker)
- [ ] PyPSA (MIT) for OPF and capacity expansion (backend)
- [ ] Animated power flow direction arrows on single-line diagram
- [ ] 30-bus and larger IEEE test cases
- [ ] GIS map overlay with Leaflet/MapLibre — future

---

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [React](https://react.dev) — Interactive visualiser components (`@astrojs/react`, selective hydration)
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [TypeScript](https://typescriptlang.org) — Type safety
- [Supabase](https://supabase.com) — Auth & PostgreSQL database
- [Cytoscape.js](https://js.cytoscape.org) — Graph visualization
- [WaveDrom](https://wavedrom.com) — Digital timing diagrams (CDN)
- [KiCanvas](https://kicanvas.org) — KiCad file viewer (CDN web component)
- [CircuitVerse](https://circuitverse.org) — Digital logic simulation (iframe)
- [web-gerber](https://www.npmjs.com/package/web-gerber) — Gerber file SVG rendering

---

## Project Structure
```
eee-roadmap/
├── content/                       # YAML roadmap data (source of truth)
│   ├── concepts/                  # Shared concept library (427 concepts, 14 domains)
│   │   ├── circuit-analysis.yaml  # Domain: circuit analysis laws & theorems
│   │   ├── power-systems.yaml     # Domain: power systems (193 concepts)
│   │   ├── pcb-design.yaml        # Domain: PCB design (20 concepts)
│   │   ├── semiconductor-physics.yaml  # Domain: semiconductor physics (15 concepts)
│   │   ├── ...                    # electromagnetics, electronics, control-systems, etc.
│   │   ├── concept.schema.json    # JSON Schema for domain files
│   │   └── sample.yaml            # Template for new domain files
│   ├── tracks/                    # Track files (ref: concept library)
│   │   ├── fundamentals.yaml      # Track: Fundamentals
│   │   ├── core.yaml              # Track: Core
│   │   ├── advanced.yaml          # Track: Advanced
│   │   ├── distributed-generation.yaml
│   │   ├── power-system-fundamentals.yaml
│   │   └── advanced-power-system-analysis.yaml
│   ├── _glossary.yaml             # 100+ EEE terms and definitions
│   └── sample.yaml                # Template for contributors
├── supabase/
│   └── schema-verification.sql    # SQL to run in Supabase dashboard (user_roles, verifications, RLS)
├── public/                        # Static assets served directly
│   ├── data/                      # Static JSON for client-side fetching (concept-library.json)
│   └── ...                        # PDFs, PDF.js viewer, robots.txt, og-image
├── scripts/
│   ├── build-concept-index.mjs    # Concept library → _index.yaml + concept-library.json (src/data/ + public/data/)
│   ├── build-data.mjs             # YAML → JSON converter (resolves concept refs)
│   ├── build-glossary.mjs         # Glossary JSON + reverse index
│   ├── build-graph-data.mjs       # Graph nodes/edges from tracks
│   ├── build-search-index.mjs     # Fuse.js search index (glossary + library + tracks)
│   ├── bump-version.mjs           # Interactive version updater
│   ├── download-pdfs.mjs          # External PDF downloader
│   ├── migrate-to-library.mjs     # One-time migration: extracted concepts to library
│   ├── setup-pdfjs.mjs            # PDF.js viewer setup
│   └── validate.mjs               # Schema validation (tracks + concept library)
├── src/
│   ├── components/
│   │   ├── simulators/
│   │   │   ├── circuit/           # Phase 1 circuit simulator components
│   │   │   │   ├── FalstadEmbed.astro   # CircuitJS1 iframe wrapper
│   │   │   │   └── TutorialStepper.astro  # Step-by-step walkthrough (vanilla JS)
│   │   │   ├── pcb/               # Phase 2 PCB design components
│   │   │   │   ├── LayerStackupDiagram.astro  # SVG PCB cross-section (2/4/6/8 layers)
│   │   │   │   ├── ViaTypeVisualizer.astro    # 4 via types side-by-side SVG
│   │   │   │   ├── KiCanvasEmbed.astro        # KiCanvas CDN web component
│   │   │   │   ├── ImpedanceCalculator.tsx    # Microstrip/stripline Z₀ calculator (client:idle)
│   │   │   │   ├── TraceRoutingDemo.tsx       # Canvas routing tutorial (client:visible)
│   │   │   │   ├── DRCDemo.tsx                # DRC violations interactive demo (client:visible)
│   │   │   │   └── GerberViewer.tsx           # Drag-drop Gerber viewer (client:only="react")
│   │   │   ├── digital/           # Phase 2 digital electronics components
│   │   │   │   ├── WaveDromDiagram.astro      # WaveDrom timing diagram (CDN inline script)
│   │   │   │   ├── CircuitVerseEmbed.astro    # CircuitVerse iframe
│   │   │   │   ├── TruthTableGenerator.tsx    # Boolean expression evaluator (client:idle)
│   │   │   │   └── VerilogPlayground.tsx      # Yosys WASM → DigitalJS (client:visible)
│   │   │   ├── semiconductor/     # Phase 2 semiconductor physics components
│   │   │   │   ├── PNJunctionViz.tsx          # 4-panel PN junction SVG (client:visible)
│   │   │   │   ├── MOSFETCrossSectionViz.tsx  # SVG cross-section + I-V curves (client:visible)
│   │   │   │   ├── BandDiagramSim.tsx         # Poisson-based band diagram (client:visible)
│   │   │   │   └── CarrierAnimation.tsx       # Canvas carrier drift/diffusion (client:visible)
│   │   │   └── power/             # Phase 3 power systems components
│   │   │       ├── PowerFlowSimulator.tsx  # Orchestrator: NR/GS dispatch, fault mode (client:visible)
│   │   │       ├── SingleLineDiagram.tsx   # Pure React/SVG: bus bars, generators, loads, transformers; pan/zoom
│   │   │       ├── BusInspector.tsx        # Click-to-inspect V/θ/P/Q panel (client:idle)
│   │   │       ├── VoltageProfileChart.tsx # SVG bar chart with ±5% voltage bands
│   │   │       ├── LineLoadingOverlay.tsx  # Color overlay by thermal loading % (green/orange/red)
│   │   │       ├── ConvergenceChart.tsx    # Log-scale mismatch vs iteration (NR vs GS)
│   │   │       └── PerUnitConverter.tsx    # V/I/Z/S per-unit calculator (client:idle)
│   │   ├── ConceptWindows.astro       # Draggable note windows + editor
│   │   ├── DemoRoadmap.astro          # Homepage interactive demo
│   │   ├── GlossaryTooltips.astro     # Auto-linked term tooltips
│   │   ├── Header.astro               # Nav + auth + search
│   │   ├── PrintRoadmap.astro         # Print mode: checkbox tree, field toggles, 2-column, high contrast, booklet, progress filters, QR display options
│   │   ├── Roadmap.astro              # Main roadmap renderer
│   │   ├── RoadmapGraph.astro         # Homepage graph visualization
│   │   ├── RoadmapSettings.astro      # Settings panel (modes, focus)
│   │   ├── SearchBar.astro            # Global search (Ctrl+K)
│   │   ├── TrackGraph.astro           # Per-track mini graph
│   │   ├── VerificationBadges.astro   # Client-side verification badge + verifier panel injection
│   │   └── ...                        # Hero, Footer, Tracks, CTA, etc.
│   ├── data/                      # Generated JSON (auto-generated, do not edit)
│   │   ├── circuits/              # Circuit lesson data (Phase 1)
│   │   │   └── fundamentals/      # ohms-law.json, voltage-divider.json, kvl-kcl.json
│   │   ├── pcb/                   # PCB lesson data (Phase 2)
│   │   │   └── *.json             # stackup-basics, via-types, impedance-control, trace-routing
│   │   ├── digital/               # Digital lesson data (Phase 2)
│   │   │   └── *.json             # timing-diagrams, logic-gates, truth-tables, verilog-intro
│   │   ├── semiconductor/         # Semiconductor lesson data (Phase 2)
│   │   │   └── *.json             # pn-junction, mosfet-operation, band-diagrams, carrier-transport
│   │   ├── power-systems/         # Power systems lesson data (Phase 3)
│   │   │   └── *.json             # per-unit-system, power-flow-3bus, power-flow-ieee14, algorithm-comparison, fault-analysis
│   │   ├── power-networks/        # Power network definitions (Phase 3)
│   │   │   ├── tutorials/         # simple-3bus.json, ieee-14bus.json, dg-integration.json
│   │   │   ├── reference/         # ieee-test-cases.json (MATPOWER case14 expected values)
│   │   │   └── _schema/           # network.schema.json
│   │   ├── index.ts               # Data loader (getRoadmap, getAllTracks)
│   │   ├── concept-library.json   # All 427 library concepts with domain/tags
│   │   └── *.json                 # Track JSON files (refs resolved at build time)
│   ├── layouts/
│   │   ├── Layout.astro           # Main layout (SEO meta, fonts, conditional KaTeX, skip link)
│   │   └── PrintLayout.astro      # Minimal layout for print pages (noindex)
│   ├── lib/
│   │   ├── circuit/               # Phase 1 circuit utilities
│   │   │   ├── mna-solver.ts      # Modified Nodal Analysis engine (mathjs lusolve)
│   │   │   └── mna-solver.test.ts # 12 unit tests (Ohm's Law, Voltage Divider, KCL)
│   │   ├── impedance/             # Phase 2 PCB impedance formulas
│   │   │   ├── microstrip.ts      # Wheeler (1977) microstrip Z₀
│   │   │   ├── microstrip.test.ts # FR4 50 Ω / 75 Ω reference tests
│   │   │   └── stripline.ts       # Schneider stripline Z₀
│   │   ├── semiconductor/         # Phase 2 semiconductor physics
│   │   │   ├── carrier-stats.ts   # Intrinsic concentration, Fermi-Dirac, Caughey-Thomas mobility
│   │   │   ├── poisson-solver.ts  # 1D FD Poisson solver (Thomas algorithm)
│   │   │   └── poisson-solver.test.ts  # Uniform slab parabola + BC tests
│   │   ├── power/                 # Phase 3 power systems math
│   │   │   ├── types.ts           # PowerNetwork + result interfaces
│   │   │   ├── ybus.ts            # Y-bus builder (pi-model lines, off-nominal transformers)
│   │   │   ├── jacobian.ts        # NR Jacobian sub-matrices H/N/M/L (polar form)
│   │   │   ├── newton-raphson.ts  # NR solver (lusolve, |V|-scaled update, 1e-6 pu tolerance)
│   │   │   ├── gauss-seidel.ts    # GS solver (complex voltages, α=1.6 acceleration)
│   │   │   ├── fault-analysis.ts  # 3-phase fault via Z-bus inverse (mathjs inv)
│   │   │   └── __tests__/         # ybus.test.ts (17), newton-raphson.test.ts (40), gauss-seidel.test.ts (6)
│   │   ├── supabase.ts            # Supabase client
│   │   ├── sync.ts                # Cross-device sync utilities
│   │   └── sync.test.ts           # Sync/auth unit tests (63 tests)
│   ├── pages/
│   │   ├── learn/
│   │   │   ├── circuits/
│   │   │   │   ├── index.astro    # Circuit lesson browser
│   │   │   │   └── [category]/[lesson].astro  # Circuit lesson detail page
│   │   │   ├── pcb/               # Phase 2 PCB lessons
│   │   │   │   ├── index.astro    # PCB lesson browser (4 lessons)
│   │   │   │   └── [lesson].astro # PCB lesson detail page
│   │   │   ├── digital/           # Phase 2 digital lessons
│   │   │   │   ├── index.astro    # Digital lesson browser (4 lessons)
│   │   │   │   └── [lesson].astro # Digital lesson detail page
│   │   │   ├── semiconductor/     # Phase 2 semiconductor lessons
│   │   │   │   ├── index.astro    # Semiconductor lesson browser (4 lessons)
│   │   │   │   └── [lesson].astro # Semiconductor lesson detail page
│   │   │   └── power-systems/     # Phase 3 power systems lessons
│   │   │       ├── index.astro    # Power systems lesson browser (5 lessons + playground link)
│   │   │       ├── [lesson].astro # Lesson detail (double import.meta.glob: lesson + network JSON)
│   │   │       └── playground.astro  # JupyterLite + Pyodide iframe for browser-based pandapower
│   │   ├── roadmaps/
│   │   │   ├── [slug].astro       # Track detail page
│   │   │   ├── print/[slug].astro # Print mode page
│   │   │   ├── custom/index.astro # Custom track viewer/editor
│   │   │   ├── custom/print.astro # Custom track print mode (client-side)
│   │   │   └── index.astro        # Browse all tracks
│   │   ├── admin.astro            # Admin panel: role management + verification dashboard
│   │   ├── glossary.astro
│   │   ├── profile.astro
│   │   └── index.astro            # Homepage
│   ├── styles/
│   │   ├── global.css             # Design tokens, base styles, components, roadmap styles
│   │   └── print.css              # Shared print mode styles (official + custom)
│   ├── types/
│   │   ├── roadmap.ts             # Core data types (Concept, ConceptRef, LibraryConcept)
│   │   ├── custom-content.ts      # Custom track types (CustomConcept, OfficialConceptRef, ConceptEntry, …)
│   │   └── verification.ts        # Verification types (aspect, role, row, status summaries)
│   └── utils/
│       ├── parseNotes.ts          # Markdown + KaTeX + PDF parser (build-time)
│       ├── parseNotesClient.ts    # Client-side markdown parser
│       ├── printUtils.ts          # Shared print mode JS (checkboxes, toggles, booklet PDF, progress filters, QR codes, display options)
│       ├── progress.ts            # Progress tracking (localStorage)
│       ├── roadmapInteractions.ts # Expand/collapse, concept pills
│       ├── verification.ts        # Supabase fetch/mutate helpers + pure status computation
│       ├── verifierPanel.ts       # DOM injection of verifier panel into topic nodes
│       ├── wrapGlossaryTerms.ts   # Auto-link glossary terms
│       └── ...                    # url, tools, trail, trackColors, etc.
├── tests/
│   └── integration/               # Playwright tests
├── roadmap.schema.json            # JSON Schema for track YAML files
├── .stylelintrc.json              # Stylelint config (CSS linting)
├── CHANGELOG.md
├── CONTRIBUTING.md
└── README.md
```

## Run Locally

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node.js)

### Development Steps
```bash
# 1. Clone the repository
git clone https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap.git
cd eee-roadmap

### Setup
npm install        # Installs dependencies + downloads PDF.js viewer
npm run dev        # Downloads PDFs + starts dev server
```

### Environment Variables (for sync features)

Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```
```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from [Supabase Dashboard](https://supabase.com) → Project Settings → API.

> **Note:** Sync features require a Supabase project with Google OAuth configured. See [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) for setup.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Download PDFs and start dev server |
| `npm run build` | Build for production (auto-downloads PDFs) |
| `npm run build:data` | Convert YAML to JSON + glossary + search index |
| `npm run build:glossary` | Build glossary JSON with reverse index |
| `npm run validate` | Validate YAML against schema |
| `npm run lint` | Run ESLint + Stylelint |
| `npm run lint:fix` | Auto-fix ESLint + Stylelint issues |
| `npm run lint:css` | Run Stylelint only (CSS + Astro `<style>`) |
| `npm run test` | Run unit tests (Vitest) in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:e2e` | Run Playwright integration/E2E tests |
| `npm run test:all` | Run all tests (Vitest + Playwright) |
| `npm run download:pdfs` | Manually download external PDFs |
| `npm run knip` | Find unused files, exports, and dependencies |
| `npm run madge:circular` | Check for circular dependencies |
| `npm run madge` | Generate dependency graph image |

### Adding PDFs

External PDF URLs in data files are automatically downloaded at build time:

1. Add `pdf: "https://example.com/document.pdf"` to a concept in `src/data/`
2. Run `npm run download:pdfs` (or it runs automatically on build/dev)
3. PDFs are saved to `public/pdfs/` and a manifest maps URLs to local paths

### Adding/Editing Roadmap Content

Roadmap data lives in `content/*.yaml` files. These are human-readable and auto-convert to JSON on build.

1. Edit or create a YAML file in `content/` (see `content/sample.yaml` for template)
2. Run `npm run dev` — conversion happens automatically
3. Changes appear immediately in the browser

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full YAML format reference.

## Contributing

Contributions welcome! Make sure to read [CONTIRBUTING.MD](CONTRIBUTING.md). Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built by [Muhammad-Hazimi-Yusri](https://github.com/Muhammad-Hazimi-Yusri) with assistance from [Claude](https://claude.ai).