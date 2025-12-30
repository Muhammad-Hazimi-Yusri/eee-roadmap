# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

---

## Current Features (v0.11.11)
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
- Comprehensive homepage demo
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

---

## Roadmap

> See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### v0.11 - Notes & Deep-dives (In Progress)

**Goal:** Add depth to learning with explanatory content and personal notes.

- [x] Draggable, resizable concept windows
- [x] Multiple windows with z-index management
- [x] Minimize to taskbar / maximize toggle
- [x] localStorage persistence for window positions
- [x] PDF viewer in windows
- [x] Fix window swipe scrolling page (#9)
- [x] Test resize handles on real mobile device
- [x] PDF.js support for Android, added to .gitignore with setup script
- [x] Build-time PDF downloading (CORS-free external PDFs)
- [x] Markdown notes with inline embeds (PDFs, images)
- [x] Resizable PDF viewers with drag-to-resize handle
- [ ] LaTeX support for equations

#### Technical Notes
- **Markdown in template literals**: Avoid leading whitespace in `notes` fields. Markdown interprets 4+ leading spaces as code blocks, which prevents image/PDF embeds from rendering. Keep lines flush-left within the template literal.

### v0.12 - Custom Roadmaps & Self-Hosting

**Goal:** Let developers create and host their own roadmaps.

- [ ] JSON schema for roadmap data
- [ ] Schema validator (CLI or web)
- [ ] Docs: how to fork and customize
- [ ] Example: blank template roadmap
- [ ] Example: alternative track (e.g., Computer Engineering focus)

### v0.13 - Cross-Device Sync

**Goal:** Access progress from any device.

- [ ] Research sync options (GitHub Gist, Firebase, custom backend)
- [ ] User authentication strategy
- [ ] Import/export progress as JSON fallback
- [ ] Sync custom notes

### v0.14 - Roadmap Editor

**Goal:** Let non-devs create roadmaps without touching code.

- [ ] Form-based web editor
- [ ] Live preview
- [ ] Export as JSON/ZIP (ready to deploy)
- [ ] Import existing roadmap to edit

### Future
- [ ] Hand-drawn aesthetic overhaul
- [ ] WebAssembly circuit simulator (Rust)
- [ ] PWA support for offline access
- [ ] Community contributions workflow
- [ ] Expand/collapse all controls
- [ ] Filter: show only important concepts
- [ ] Filter: show only incomplete nodes

---

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [TypeScript](https://typescriptlang.org) — Type safety

---

## Project Structure
```
eee-roadmap/
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
│   │   ├── advanced.ts
│   │   ├── core.ts
│   │   └── fundamentals.ts
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

---

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