# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://eee-roadmap.muhammadhazimiyusri.uk)**

---

## Features

### Current (v0.8.13)
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

### v0.9 - Refactoring & Code Quality

**Goal:** Reduce technical debt, improve maintainability, prepare for testing.

#### Critical Fixes
- [ ] Remove duplicate CustomCursor from RoadmapSettings.astro
- [ ] Fix duplicate forEach loop in DemoRoadmap.astro (double event registration)
- [ ] Remove unused CircuitLine.astro

#### Code Deduplication
- [ ] Extract shared utilities to `src/utils/`:
  - [ ] `progress.ts` - localStorage operations, state management
  - [ ] `swipe.ts` - Swipe gesture detection and coordination
  - [ ] `trail.ts` - Canvas trail drawing logic
  - [ ] `tools.ts` - Tool action application (pen/highlighter/eraser)
- [ ] Consolidate duplicate CSS into shared classes in global.css
- [ ] Refactor DemoRoadmap to import shared utilities

#### TypeScript Improvements
- [ ] Add strict types for tool names, modes, progress state
- [ ] Create interfaces for shared function signatures
- [ ] Enable stricter tsconfig options

#### Documentation
- [ ] Add JSDoc comments to utility functions
- [ ] Document component props with TypeScript interfaces
- [ ] Create CONTRIBUTING.md with code style guidelines

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
│   └── favicon.svg              # Site favicon (circuit wave icon)
├── src/
│   ├── components/
│   │   ├── CTA.astro            # Call-to-action section with "Get Started" buttons
│   │   ├── CustomCursor.astro   # Tool-shaped cursor for tools mode (shared)
│   │   ├── DemoRoadmap.astro    # Interactive demo on homepage (mini-roadmap + interactions)
│   │   ├── Features.astro       # "What This Is" feature grid section
│   │   ├── Footer.astro         # Site footer with links and copyright
│   │   ├── Header.astro         # Navigation header with logo and theme toggle
│   │   ├── Hero.astro           # Landing hero with stats and CTAs
│   │   ├── Placeholder.astro    # "Under construction" template for stub pages
│   │   ├── Roadmap.astro        # Main roadmap component with progress tracking
│   │   ├── RoadmapSettings.astro # Floating settings panel (mode, tools, preferences)
│   │   ├── ThemeToggle.astro    # Dark/light mode toggle button
│   │   └── Tracks.astro         # Track cards grid (Fundamentals/Core/Advanced)
│   ├── data/
│   │   ├── advanced.ts          # Advanced track content (power, control, RF, comms)
│   │   ├── core.ts              # Core track content (analog, digital, signals, MCU, PCB)
│   │   └── fundamentals.ts      # Fundamentals track content (math, circuits, EM, components)
│   ├── layouts/
│   │   └── Layout.astro         # Base HTML layout with head, fonts, theme init
│   ├── pages/
│   │   ├── roadmaps/
│   │   │   └── [slug].astro     # Dynamic route for track pages (/roadmaps/fundamentals, etc.)
│   │   ├── about.astro          # About page (placeholder)
│   │   ├── contribute.astro     # Contribute page (placeholder)
│   │   ├── guides.astro         # Guides page (placeholder)
│   │   ├── index.astro          # Homepage (Hero, Demo, Tracks, Features, CTA)
│   │   ├── projects.astro       # Projects page (placeholder)
│   │   └── resources.astro      # Resources page (placeholder)
│   ├── styles/
│   │   └── global.css           # Global styles, CSS variables, Tailwind layers
│   ├── types/
│   │   └── roadmap.ts           # TypeScript interfaces (Topic, RoadmapSection, Resource)
│   └── utils/                   # [Planned v0.9] Shared utilities
│       ├── progress.ts          # [Planned] localStorage operations, state management
│       ├── swipe.ts             # [Planned] Swipe gesture detection
│       ├── trail.ts             # [Planned] Canvas trail drawing
│       └── tools.ts             # [Planned] Tool action logic
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions: build, link-check, deploy to Pages
├── astro.config.mjs             # Astro configuration (Tailwind integration, base URL)
├── tailwind.config.mjs          # Tailwind configuration (fonts, content paths)
├── tsconfig.json                # TypeScript configuration (paths, strict mode)
├── package.json                 # Dependencies and npm scripts
├── CHANGELOG.md                 # Version history with dates and commits
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

---

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

# Check for broken links (requires build first)
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