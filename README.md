# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

> ⚠️ **Content Notice:** Roadmap content (descriptions, concepts, resources) is AI-generated and has not been manually verified. Links may be outdated or broken. Use as a learning guide, not authoritative reference. Contributions and corrections welcome!

---

---

## Current Features (v0.12.3)
- Interactive roadmaps for Fundamentals, Core, and Advanced tracks
- Expand/collapse topic nodes with descriptions, concepts and resources
- Prerequisites (linkable + static) and learning outcomes for each topic
- Optional topics styled as side branches
- Responsive design with Lab Notebook + PCB aesthetic
- Dark mode with system preference detection
- Topic deep-links with hash anchors
- Clickable prerequisites with cross-track navigation
- Two-dimension progress tracking (complete + important states)
- Dual interaction modes:
  - **Simple mode:** click (notes), dblclick (complete), shift+click (important)
  - **Tools mode:** swipe gestures with pen/highlighter/eraser (tablet/stylus optimized)
- Custom cursor matching active tool
- Swipe trail effect for visual feedback
- Touch support (single finger draws, two fingers scroll)
- Comprehensive homepage demo with working ConceptWindows (LaTeX, images, PDFs)
- **Concept Windows:** Draggable, resizable windows for notes and PDFs
  - Multiple windows open simultaneously
  - Drag by titlebar, resize via corner/edge handles
  - Minimize to taskbar, maximize/restore
  - Window positions saved to localStorage
  - Mobile responsive positioning
  - z-index management (click to bring front)
  - PDF.js integration for cross-browser PDF viewing (including Android)
  - Automatic external PDF downloading at build time (CORS-free)
  - Markdown notes with inline PDF and image embedding
  - Resizable PDF viewers with drag handle (height persisted to localStorage)
  - LaTeX support for equations (KaTeX)
- **Dynamic Track System:**
  - Track metadata (title, description, icon, category, order)
  - Automatic route generation from YAML files
  - Lucide icons for track display
  - Featured tracks on homepage, all tracks browsable
- **Developer Tooling:**
  - `npm run validate` — CLI schema validator for YAML files
  - Human-readable YAML format with auto-defaults
- **Tracks:** Fundamentals, Core, Advanced, Distributed Generation
---

## Roadmap

> See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### v0.12 - Custom Roadmaps & Self-Hosting ✓

**Goal:** Let developers create and host their own roadmaps.

- [x] JSON schema for roadmap data
- [x] YAML → JSON build pipeline
- [x] Dynamic track auto-discovery
- [x] Docs: how to fork and customize
- [x] Example: blank template roadmap
- [x] Schema validator (CLI)
- [x] Example: alternative track (distributed-generation)
- [x] Dynamic track discovery with metadata
- [x] Lucide icons for tracks

### v0.13 - Search & Discovery

**Goal:** Find content quickly across all tracks.

- [ ] `/roadmaps/` index page (browse all tracks)
- [ ] Search bar in navigation
- [ ] Track filtering by category
- [ ] Build-time search index generation
- [ ] Full-text search (track > topic > concept priority)
- [ ] Deep links to exact location (concept of X topic of Y roadmap)
- [ ] Search results page

### v0.14 - Cross-Device Sync

**Goal:** Access progress from any device.

- [ ] Research sync options (GitHub Gist, Firebase, custom backend)
- [ ] User authentication strategy
- [ ] Import/export progress as JSON fallback
- [ ] Sync custom notes

### v0.15 - Roadmap Editor

**Goal:** Let non-devs create roadmaps without touching code.

- [ ] Form-based web editor with validation etc
- [ ] Live preview
- [ ] Export as JSON/ZIP (ready to deploy)
- [ ] Import existing roadmap to edit

### v0.16 - Test Coverage

**Goal:** Comprehensive test coverage for all features.

- [ ] Unit tests for all utilities
- [ ] Integration tests for all components
- [ ] E2E tests for all user flows
- [ ] Visual regression tests
- [ ] Accessibility tests (a11y)
- [ ] Pre-commit hooks for test/lint/build

### v0.17 - Content Verification

**Goal:** Manually vet all AI-generated content before 1.0 release.

- [ ] Review all topic descriptions for accuracy
- [ ] Verify all external resource links
- [ ] Fact-check concept explanations
- [ ] Add "Verified by" badges with contributor attribution
- [ ] Verification status indicators (section/track level)

### Before Release
- [ ] Hand-drawn aesthetic overhaul
- [ ] WebAssembly circuit simulator (Rust)
- [ ] PWA support for offline access
- [ ] Community contributions workflow
- [ ] Expand/collapse all controls
- [ ] Filter: show only important concepts
- [ ] Filter: show only incomplete nodes
- [ ] Concept windows: translucent/glass effect when unfocused (reduce clutter)
- [ ] iOS Safari: dark mode demo tools switch menu arrow visibility fix
- [ ] iOS Safari: in two-finger swipe, trail persistence in tools mode
- [ ] Mobile: fullscreen mode bottom bar overlap causing last line not visible
- [ ] PDF.js: option to open-in-new-tab and fullscreen viewer via icons feasibility

### v1.0.0 - Official Release

**Goal:** Production-ready, verified educational resource.

- [ ] All content manually verified
- [ ] Full test coverage
- [ ] Performance optimized
- [ ] Accessibility audit passed
- [ ] User feedback system (comments per section)
- [ ] Contributor recognition page

---

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [TypeScript](https://typescriptlang.org) — Type safety

---

## Project Structure
```
eee-roadmap/
├── content/
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
│   ├── setup-pdfjs.mjs         # Downloads PDF.js on npm install
│   └── download-pdfs.mjs       # Downloads external PDFs from data files
├── src/
│   ├── components/
│   │   ├── ConceptWindows.astro
│   │   ├── CTA.astro
│   │   ├── CustomCursor.astro
│   │   ├── DemoRoadmap.astro
│   │   ├── Features.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Placeholder.astro
│   │   ├── Roadmap.astro
│   │   ├── RoadmapSettings.astro
│   │   ├── ThemeToggle.astro
│   │   └── Tracks.astro
│   ├── data/
│   │   ├── index.ts            # Dynamic JSON loader
│   │   ├── sample.json         # Example structure for contributors
│   │   ├── *.json              # Generated from YAML (git-ignored)
│   │   └── pdf-manifest.json   # URL → local path mapping (auto-generated)
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── roadmaps/
│   │   │   └── [slug].astro
│   │   ├── about.astro
│   │   ├── contribute.astro
│   │   ├── guides.astro
│   │   ├── index.astro
│   │   ├── projects.astro
│   │   └── resources.astro
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   └── roadmap.ts
│   └── utils/
│       ├── progress.ts
│       ├── progress.test.ts
│       ├── tools.ts
│       ├── tools.test.ts
│       ├── trail.ts
│       ├── trail.test.ts
│       ├── url.ts
│       └── url.test.ts
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

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Download PDFs and start dev server |
| `npm run build` | Build for production (auto-downloads PDFs) |
| `npm run build:data` | Convert YAML to JSON |
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