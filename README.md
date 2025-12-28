# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

---

## Current Features (v0.11.8)
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
- [ ] Test resize handles on real mobile device
- [ ] Markdown notes per topic
- [ ] LaTeX support for equations

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
│   └── favicon.svg
├── src/
│   ├── components/
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
├── .github/
│   └── workflows/
│       └── deploy.yml
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── CONTRIBUTING.md
└── README.md
```

## Run Locally

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm (comes with Node.js)

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap.git
cd eee-roadmap

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

### Other Commands
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test

# Check for broken links (after build)
npm run check-links
```

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