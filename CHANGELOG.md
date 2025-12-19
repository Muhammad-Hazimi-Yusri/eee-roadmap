# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **Versioning Convention:**  
> - `vX.Y.0` — Feature milestone  
> - `vX.Y.Z` — Bug fixes and patches within that milestone  
> - Detailed patch history lives in git commits, not this changelog

---

## [0.9.0] - 2025-12-19

**Code Quality & Testing**

### Added
- Vitest testing infrastructure (43+ tests)
- Shared utilities: `progress.ts`, `url.ts`, `trail.ts`, `tools.ts`
- JSDoc comments for all utility functions
- CONTRIBUTING.md with contributor guidelines
- Stricter TypeScript compiler options

### Changed
- Consolidated duplicate CSS to `src/styles/global.css`
- Unified class names across components
- DemoRoadmap uses sessionStorage (clears on tab close)
- Progress tracking uses factory store pattern

### Fixed
- Page reload on prereq navigation (trailing slash mismatch)
- Dropdown desync on page refresh

### Removed
- Duplicate code and unused components

---

## [0.8.0] - 2025-12-17

**Progress Tracking & Tools Mode**

### Added
- Progress tracking with localStorage persistence
- Two-dimension concept state (complete + important)
- Simple mode: click (notes), dblclick (complete), shift+click (important)
- Tools mode: swipe gestures with pen/highlighter/eraser
- Custom cursor matching active tool
- Swipe trail visual effect
- Interactive demo on homepage
- Touch support for mobile/tablet
- Static prerequisites can be manually toggled

### Fixed
- Prereq links show completion status correctly

---

## [0.7.0] - 2025-12-11

**Navigation & Linking**

### Added
- Topic deep-links with hash anchors
- Auto-expand nodes on hash navigation
- Clickable prerequisites with cross-track linking
- Visual distinction: linkable vs static prerequisites
- Prereq link behavior preference (smart/same-tab/new-tab)

### Fixed
- Re-clicking same prereq re-expands collapsed node
- Same-page prereq links no longer reload page

---

## [0.6.0] - 2025-12-09

**Content & Polish**

### Added
- Core and Advanced tracks with full content
- Prerequisites, outcomes, and descriptions for all topics
- Dark mode toggle with localStorage persistence

### Changed
- Renamed "topics" to "concepts" in data structure
- Improved dark mode text readability

---

## [0.5.0] - 2025-12-08

**Content Population**

### Added
- Fundamentals track with full content
- Broken link checker in CI/CD pipeline

---

## [0.4.0] - 2025-12-07

**Interactive Roadmap**

### Added
- Roadmap component with expand/collapse nodes
- Resource links on topic nodes
- Placeholder pages (About, Guides, Projects, Resources, Contribute)

---

## [0.3.0] - 2025-12-02

**Initial Release**

### Added
- Landing page with Lab Notebook + PCB aesthetic
- Track cards (Fundamentals, Core, Advanced)
- GitHub Actions deployment to GitHub Pages
- Tailwind CSS and TypeScript integration