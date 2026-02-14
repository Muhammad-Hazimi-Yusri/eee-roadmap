# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

> ⚠️ **Content Notice:** Roadmap content (descriptions, concepts, resources) is AI-generated and has not been manually verified. Links may be outdated or broken. Use as a learning guide, not authoritative reference. Contributions and corrections welcome! 

---

[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Version](https://img.shields.io/badge/version-0.21.9-blue.svg)]()
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
Current version is v0.21.9

### For Learners
- **Interactive Roadmaps** — Expand/collapse topic nodes with descriptions, prerequisites, and curated resources
- **Progress Tracking** — Mark concepts complete (✓) or important (★), persists across sessions
- **Cross-Device Sync** — Sign in with Google to sync progress across devices; works offline with automatic merge on reconnect
- **Focus View** — Quickly expand only incomplete or highlighted topics with visual glow feedback
- **Expand/Collapse All** — Manage topic visibility in one click
- **Two Interaction Modes:**
  - *Simple* — Click (notes), double-click (complete), shift+click (important)
  - *Tools* — Swipe gestures with pen/highlighter/eraser (optimized for tablet/stylus)
- **Concept Windows** — Draggable, resizable note windows with markdown, LaTeX equations, and embedded PDFs; open windows persist across page refreshes; taskbar for window management; built-in markdown editor for adding personal notes
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
- **Print Mode** — Select individual concepts, topics, or entire sections to export as a clean PDF; cascading checkbox tree with live preview; field-level toggles (description, prerequisites, outcomes, concept notes, resources); optional 2-column layout; works for both official and custom tracks

### For Explorers
- **Four Tracks** — Fundamentals, Core, Advanced, Distributed Generation
- **Browse All Tracks** — `/roadmaps/` page with category + progress filters and boxed/unboxed view
- **Custom Tracks** — Create your own learning roadmaps with the built-in editor (requires sign-in)
  - Full track editor: sections, topics, concepts, resources, prerequisites
  - Inline concept notes editor: click a concept pill to edit its markdown content directly in the editor
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
  - `npm run version:bump` — Interactive version updater
  - Pre-commit hooks for build/validate/test

### Technical Highlights
- **Stack:** Astro, TypeScript, Tailwind CSS
- **Search:** Fuse.js fuzzy matching with highlighted snippets
- **PDFs:** PDF.js for cross-browser viewing, auto-downloaded at build time
- **Math:** KaTeX for LaTeX equation rendering
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

### In Progress

#### v0.21 - Test Coverage & Code Quality (Refactor)

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
- [ ] Accessibility tests (a11y)
- [ ] Increase unit test coverage for utilities
- [ ] Add CSS duplicate checks
- [ ] Refactor as needed
- [ ] Lighthouse score and performance optimisation

---

### Planned

#### v0.22 - Content Verification

**Goal:** Manually vet all AI-generated content before 1.0.

- [ ] Review all topic descriptions for accuracy
- [ ] Verify all external resource links
- [ ] Add "Verified by" badges with contributor attribution
- [ ] Verification status indicators (section/track level)

---

### Known Issues & Polish

- [ ] Broken Wikimedia embedded images: ~10 return 404 (moved/renamed), ~175 return 429 (rate-limited by link checker). Need to fix 404s with updated URLs and add concurrency/retry to `check-links` so Wikimedia 429s don't fail the build. Verify all embedded images and PDFs are accessible on the live site.
- [ ] iOS Safari: dark mode demo tools switch menu arrow visibility
- [ ] iOS Safari: trail persistence in two-finger swipe (tools mode)
- [ ] Mobile: fullscreen mode bottom bar overlap
- [ ] PDF.js: open-in-new-tab and fullscreen viewer icons
- [ ] Concept windows: translucent effect when unfocused
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
- WebAssembly circuit simulator
- Freemium tiers (if user growth warrants)
- Community contributions workflow
- User feedback system (comments per section)
- WYSIWYG concept notes editor (Notion-like toolbar with bold, linking, embedding support) to replace the current raw markdown textarea in ConceptWindows

---

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [TypeScript](https://typescriptlang.org) — Type safety
- [Supabase](https://supabase.com) — Auth & PostgreSQL database
- [Cytoscape.js](https://js.cytoscape.org) — Graph visualization

---

## Project Structure
```
eee-roadmap/
├── content/                       # YAML roadmap data (source of truth)
│   ├── _glossary.yaml             # 100+ EEE terms and definitions
│   ├── fundamentals.yaml          # Track: Fundamentals
│   ├── core.yaml                  # Track: Core
│   ├── advanced.yaml              # Track: Advanced
│   ├── distributed-generation.yaml
│   ├── power-system-fundamentals.yaml
│   ├── advanced-power-system-analysis.yaml
│   └── sample.yaml                # Template for contributors
├── public/                        # Static assets (PDFs, PDF.js viewer)
├── scripts/
│   ├── build-data.mjs             # YAML → JSON converter
│   ├── build-glossary.mjs         # Glossary JSON + reverse index
│   ├── build-graph-data.mjs       # Graph nodes/edges from tracks
│   ├── build-search-index.mjs     # Fuse.js search index
│   ├── bump-version.mjs           # Interactive version updater
│   ├── download-pdfs.mjs          # External PDF downloader
│   ├── setup-pdfjs.mjs            # PDF.js viewer setup
│   └── validate.mjs               # Schema validation
├── src/
│   ├── components/
│   │   ├── ConceptWindows.astro   # Draggable note windows + editor
│   │   ├── DemoRoadmap.astro      # Homepage interactive demo
│   │   ├── GlossaryTooltips.astro # Auto-linked term tooltips
│   │   ├── Header.astro           # Nav + auth + search
│   │   ├── PrintRoadmap.astro     # Print mode: checkbox tree, field toggles, 2-column
│   │   ├── Roadmap.astro          # Main roadmap renderer
│   │   ├── RoadmapGraph.astro     # Homepage graph visualization
│   │   ├── RoadmapSettings.astro  # Settings panel (modes, focus)
│   │   ├── SearchBar.astro        # Global search (Ctrl+K)
│   │   ├── TrackGraph.astro       # Per-track mini graph
│   │   └── ...                    # Hero, Footer, Tracks, CTA, etc.
│   ├── data/                      # Generated JSON (from content/*.yaml)
│   │   ├── index.ts               # Data loader (getRoadmap, getAllTracks)
│   │   └── *.json                 # Auto-generated, do not edit
│   ├── layouts/
│   │   ├── Layout.astro           # Main layout (cursor, canvas, meta)
│   │   └── PrintLayout.astro      # Minimal layout for print pages
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client
│   │   ├── sync.ts                # Cross-device sync utilities
│   │   └── sync.test.ts           # Sync/auth unit tests (63 tests)
│   ├── pages/
│   │   ├── roadmaps/
│   │   │   ├── [slug].astro       # Track detail page
│   │   │   ├── print/[slug].astro # Print mode page
│   │   │   ├── custom/index.astro # Custom track viewer/editor
│   │   │   ├── custom/print.astro # Custom track print mode (client-side)
│   │   │   └── index.astro        # Browse all tracks
│   │   ├── glossary.astro
│   │   ├── profile.astro
│   │   └── index.astro            # Homepage
│   ├── styles/
│   │   ├── global.css             # CSS variables, components, roadmap styles
│   │   └── print.css              # Shared print mode styles (official + custom)
│   ├── types/
│   │   ├── roadmap.ts             # Core data types
│   │   └── custom-content.ts      # Custom track types
│   └── utils/
│       ├── parseNotes.ts          # Markdown + KaTeX + PDF parser (build-time)
│       ├── parseNotesClient.ts    # Client-side markdown parser
│       ├── printUtils.ts          # Shared print mode JS (checkboxes, toggles)
│       ├── progress.ts            # Progress tracking (localStorage)
│       ├── roadmapInteractions.ts # Expand/collapse, concept pills
│       ├── wrapGlossaryTerms.ts   # Auto-link glossary terms
│       └── ...                    # url, tools, trail, trackColors, etc.
├── tests/
│   └── integration/               # Playwright tests
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
| `npm run test` | Run unit tests (Vitest) in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:e2e` | Run Playwright integration/E2E tests |
| `npm run test:all` | Run all tests (Vitest + Playwright) |
| `npm run download:pdfs` | Manually download external PDFs |
| `npm run knip` | Find unused files, exports, and dependencies |
| `npm run madge:circular` | Check for circular dependencies |
| `npm run madge:graph` | Generate dependency graph image (WSL/Linux only) |

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