# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

---

## Features

### Current (v0.9)
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

---

---

## Roadmap

> See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

**v0.9 - Code Quality & Testing** ✓
- [x] Remove duplicate CustomCursor from RoadmapSettings (v0.9.1)
- [x] Fix duplicate forEach loop in DemoRoadmap (v0.9.1)
- [x] Delete unused CircuitLine.astro (v0.9.1)
- [x] Set up Vitest testing infrastructure (v0.9.2)
- [x] Extract progress utilities with tests (v0.9.2)
- [x] Extract URL helper with trailing slash fix (v0.9.4)
- [x] Extract trail utilities with tests (v0.9.6)
- [x] Extract tools utilities with tests (v0.9.7)
- [x] Refactor progress store for sessionStorage support (v0.9.8)
- [x] Consolidate duplicate CSS to global.css (v0.9.9)
- [x] Enable stricter tsconfig options (v0.9.10)
- [x] Add JSDoc comments to utility functions (v0.9.10)
- [x] Document types in roadmap.ts (v0.9.11)
- [x] Create CONTRIBUTING.md (v0.9.11)

### v0.10 - Testing Infrastructure

**Goal:** Comprehensive test coverage to catch regressions early.

#### Unit Tests (Vitest)
- [ ] Progress utilities (toggle, save, load)
- [ ] Tool action logic
- [ ] State calculations (isTopicCompleted, etc.)

#### Integration Tests (Playwright)
- [ ] Page navigation and routing
- [ ] Hash anchor navigation and auto-expand
- [ ] Prerequisite link behavior (same-tab, new-tab, smart)
- [ ] Dark mode toggle persistence

#### E2E Tests (Playwright)
- [ ] Simple mode interactions (click, dblclick, shift+click)
- [ ] Tools mode swipe gestures
- [ ] Progress persistence across page reloads
- [ ] Demo component full flow
- [ ] Cross-track prerequisite navigation

#### CI/CD Enhancements
- [ ] Add test step to deploy.yml (run before build)
- [ ] Add test coverage reporting
- [ ] Add visual regression tests for key components

### v0.11 - Cross-Device Sync
- [ ] Research sync options (GitHub Gist, Firebase, custom backend)
- [ ] User authentication strategy
- [ ] Import/export progress as JSON fallback

### v0.12 - Notes & Deep-dives
- [ ] Clickable concepts → modal/popup with explanations
- [ ] LaTeX or Markdown notes
- [ ] PDF compilation via GitHub Actions
- [ ] A4 paper aesthetic: draggable, pinnable note cards

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

Contributions welcome! Please:

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