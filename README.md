# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

> ⚠️ **Content Notice:** Roadmap content (descriptions, concepts, resources) is AI-generated and has not been manually verified. Links may be outdated or broken. Use as a learning guide, not authoritative reference. Contributions and corrections welcome!

---

[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Version](https://img.shields.io/badge/version-0.17.3-blue.svg)]()
[![Status](https://img.shields.io/badge/status-In%20Development-yellow.svg)]()

<details>
<summary><strong>Table of Contents</strong></summary>

- [Current Features](#current-features-v013x)
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

## Current Features (v0.17.3)

### For Learners
- **Interactive Roadmaps** — Expand/collapse topic nodes with descriptions, prerequisites, and curated resources
- **Progress Tracking** — Mark concepts complete (✓) or important (★), persists across sessions
- **Cross-Device Sync** — Sign in with Google to sync progress across devices; works offline with automatic merge on reconnect
- **Focus View** — Quickly expand only incomplete or highlighted topics with visual glow feedback
- **Expand/Collapse All** — Manage topic visibility in one click
- **Two Interaction Modes:**
  - *Simple* — Click (notes), double-click (complete), shift+click (important)
  - *Tools* — Swipe gestures with pen/highlighter/eraser (optimized for tablet/stylus)
- **Concept Windows** — Draggable, resizable note windows with markdown, LaTeX equations, and embedded PDFs; open windows persist across page refreshes; taskbar for window management
- **Global Search** — Fuzzy search across all tracks, topics, and concept notes (`Ctrl+K`)
- **Deep Links** — Share links directly to specific concepts
- **State Persistence** — Topic expand/collapse state saved per track, settings panel remembers preferences
- **Glossary** — 100+ EEE terms with definitions, LaTeX equations, and cross-references
- **Auto-linked Terms** — Glossary terms in roadmap content show tooltips on hover

### For Explorers
- **Four Tracks** — Fundamentals, Core, Advanced, Distributed Generation
- **Browse All Tracks** — `/roadmaps/` page with category + progress filters and boxed/unboxed view
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

### v0.16 - ConceptWindows Persistence ✓

**Goal:** Save and restore window state across page refreshes.

- [x] Persist open windows to localStorage (position, size, minimized/maximized state)
- [x] Restore windows on page load
- [x] Per-track state storage
- [x] Taskbar with "Minimize all" and "Close all" buttons
- [x] Taskbar visible when any window is open

### v0.17 - Cross-Device Sync ✓

**Goal:** Access progress from any device.

- [x] Research sync options (GitHub Gist, Firebase, custom backend) → Chose Supabase
- [x] User authentication (Google OAuth via Supabase)
- [x] Real-time sync on every progress change
- [x] Union merge on login (local + cloud combined)
- [x] Duplicate topic ID validation
- [x] Auth UI with dropdown menu
- [ ] Progress visualisation with progress bar or X/XX concept completed etc, gamified in future/streaks learning?
- [ ] Import/export progress as JSON fallback
- [ ] Sync custom notes (create new personal roadmap? how to store notes tho, storage issue, require github/gist connection?, or supabase storage or cloudflare? free only)
- [ ] Cloudflare Pages deployment (currently GitHub Pages)

### v0.18 - Roadmap Editor

**Goal:** Let non-devs create roadmaps without touching code.

- [ ] Form-based web editor with validation etc
- [ ] Live preview
- [ ] Export as JSON/ZIP (ready to deploy)
- [ ] Import existing roadmap to edit

### v0.19 - Roadmap Graph View

**Goal:** Visualize relationships between tracks and topics.

- [ ] Node-based visualization showing prereq connections
- [ ] Interactive graph (click to navigate)
- [ ] Filter by track/section

### v0.20 - Test Coverage

**Goal:** Comprehensive test coverage for all features.

- [ ] Unit tests for all utilities
- [ ] Integration tests for all components
- [ ] E2E tests for all user flows
- [ ] Visual regression tests
- [ ] Accessibility tests (a11y)
- [ ] Pre-commit hooks for test/lint/build

### v0.21 - Content Verification

**Goal:** Manually vet all AI-generated content before 1.0 release.

- [ ] Review all topic descriptions for accuracy
- [ ] Verify all external resource links
- [ ] Fact-check concept explanations
- [ ] Add "Verified by" badges with contributor attribution
- [ ] Verification status indicators (section/track level)

### Before Release
- [ ] Hand-drawn aesthetic overhaul
- [ ] Explore alternative color palette (current copper/green fits notebook aesthetic but resembles Claude.ai)
- [ ] WebAssembly circuit simulator (Rust)
- [ ] PWA support for offline access
- [ ] Community contributions workflow
- [ ] Concept windows: translucent/glass effect when unfocused (reduce clutter)
- [ ] iOS Safari: dark mode demo tools switch menu arrow visibility fix
- [ ] iOS Safari: in two-finger swipe, trail persistence in tools mode
- [ ] Mobile: fullscreen mode bottom bar overlap causing last line not visible
- [ ] PDF.js: option to open-in-new-tab and fullscreen viewer via icons feasibility
- [ ] Unboxed view: overlapping card layout for overflow

### v1.0.0 - Official Release

**Goal:** Production-ready, verified educational resource.

- [ ] All content manually verified
- [ ] Full test coverage
- [ ] Performance optimized
- [ ] Accessibility audit passed
- [ ] User feedback system (comments per section)
- [ ] Contributor recognition page

### Future
- [ ] Notes parser, any format to a certain degree (example: upload .md notes, parse to roadmap compatible notes for concepts etc)
- [ ] Ofc, AI generated roadmaps contents remix etc
- [ ] Note taking capabilities so maybe even useful for students in class taking notes.
---

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [TypeScript](https://typescriptlang.org) — Type safety
- [Supabase](https://supabase.com) — Auth & PostgreSQL database

---

## Project Structure
```
eee-roadmap/
├── content/
│   ├── _glossary.yaml          # Glossary terms and acronyms
│   ├── fundamentals.yaml       # Fundamentals track (human-editable)
│   ├── core.yaml               # Core track
│   ├── advanced.yaml           # Advanced track
│   ├── distributed-generation.yaml  # Specialization track
│   └── sample.yaml             # Template for new tracks (excluded from build)
├── public/
│   ├── favicon.svg
│   ├── pdfjs/                  # PDF.js viewer (auto-downloaded via postinstall)
│   ├── pdfs/                   # Downloaded PDFs (auto-generated)
│   └── pdf-manifest.json       # URL → local path mapping (auto-generated)
├── scripts/
│   ├── build-data.mjs          # Converts YAML roadmap files to JSON for the app to consume
│   ├── build-search-index.mjs  # Generates search index from 
JSON files
│   ├── download-pdfs.mjs       # Downloads external PDFs from data files
│   ├── setup-pdfjs.mjs         # Downloads PDF.js on npm install
│   └── validae.mjs             # Validates YAML roadmap files against the JSON schema
├── src/
│   ├── components/
│   │   ├── ConceptWindows.astro
│   │   ├── CTA.astro
│   │   ├── CustomCursor.astro
│   │   ├── DemoRoadmap.astro
│   │   ├── Features.astro
│   │   ├── Footer.astro
│   │   ├── GlossaryTooltips.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── SearchBar.astro
│   │   ├── Placeholder.astro
│   │   ├── Roadmap.astro
│   │   ├── RoadmapSettings.astro
│   │   ├── ThemeToggle.astro
│   │   └── Tracks.astro
│   ├── data/
│   │   ├── index.ts            # Dynamic JSON loader
│   │   ├── sample.json         # Example structure for contributors
│   │   ├── *.json              # Generated from YAML (git-ignored)
│   │   ├── _glossary.json      # Glossary with reverse index (auto-generated)
│   │   ├── search-index.json   # Search index (auto-generated)
│   │   └── pdf-manifest.json   # URL → local path mapping (auto-generated)
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── sync.ts             # Progress sync utilities
│   ├── pages/
│   │   ├── roadmaps/
│   │   │   └── [slug].astro
│   │   ├── about.astro
│   │   ├── contribute.astro
│   │   ├── glossary.astro
│   │   ├── guides.astro
│   │   ├── index.astro
│   │   ├── projects.astro
│   │   └── resources.astro
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   └── roadmap.ts
│   └── utils/
│       ├── parseNotes.test.ts
│       ├── parseNotes.ts
│       ├── progress.ts
│       ├── progress.test.ts
│       ├── tools.ts
│       ├── tools.test.ts
│       ├── trail.ts
│       ├── trail.test.ts
│       ├── url.ts
│       ├── url.test.ts
│       └── wrapGlossaryTerms.ts
├── tests/
│   ├── integration/            # Playwright integration tests
│   └── e2e/                    # Playwright E2E tests
├── .github/
│   └── workflows/
│       └── deploy.yml
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── CONTRIBUTING.md
├── CHANGELOG.md
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