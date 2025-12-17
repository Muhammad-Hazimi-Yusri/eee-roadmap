# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **Versioning Convention (v0.9+):**  
> - `vX.Y.0` — Feature milestone  
> - `vX.Y.Z` — Bug fixes and patches within that milestone

---

## [0.8.13] - 2025-12-17

### Added
- Touch support for tools mode in roadmap (mobile/tablet swipe gestures)
- Two-finger scroll in tools mode (single finger draws, two fingers scroll)
- Mobile/tablet hint shown on touch devices in tools mode

### Fixed
- Prereq links now use baseUrl instead of localhost origin (`7829e51`)

**Commits:** `7ac04ef`, `7829e51`

---

## [0.8.12] - 2025-12-17

### Added
- Touch support for tools mode in demo component

**Commits:** `662f5c7`

---

## [0.8.11] - 2025-12-17

### Added
- Demo link in header navigation

### Fixed
- Linked prereqs now show strikethrough when target topic is completed

**Commits:** `59692ed`

---

## [0.8.10] - 2025-12-17

### Added
- Enhanced demo with mini-roadmap showing track/section/topic/concept hierarchy
- Prereq links panel with behavior selector in demo
- Static prereqs in demo (clickable to mark done)
- Tools mode works on mini-roadmap pills and static prereqs

### Changed
- Hero section updated with demo-first CTA and clearer messaging

**Commits:** `6526d80`, `7b8d8e4`

---

## [0.8.9] - 2025-12-16

### Added
- Tools (pen/eraser) work on static prerequisites

**Commits:** `5195763`

---

## [0.8.8] - 2025-12-16

### Added
- Demo roadmap component on homepage

### Changed
- Refactored CustomCursor and trail canvas to shared components
- Renamed tools: Cursor → Open, Pen, Highlighter → Highlight, Eraser → Erase

### Fixed
- Simple mode interactions no longer fire in tools mode
- Trail no longer draws outside demo area

**Commits:** `cbc804a`, `2f7a660`, `a9680b0`

---

## [0.8.7] - 2025-12-16

### Added
- Swipe trail effect (pen/highlighter/eraser leaves visual trail)

**Commits:** `caafaea`

---

## [0.8.6] - 2025-12-16

### Added
- Swipe gestures for tools mode

**Commits:** `e97e2fa`

---

## [0.8.5] - 2025-12-16

### Added
- Custom cursor that matches active tool

**Commits:** `5b41042`

---

## [0.8.4] - 2025-12-16

### Added
- Mode selector (Simple/Tools) in settings panel
- Toolbar UI for tools mode

### Changed
- Extracted RoadmapSettings into separate component

**Commits:** `7556299`

---

## [0.8.3] - 2025-12-16

### Added
- Two-dimension concept state (complete + important as independent flags)
- Simple mode interactions: click (notes), dblclick (complete), shift+click (important)

**Commits:** `e47f363`

---

## [0.8.2] - 2025-12-16

### Added
- Static prerequisites can be manually toggled (click to mark done)

**Commits:** `36a6c21`

---

## [0.8.1] - 2025-12-16

### Added
- Prerequisites show completion status (strikethrough if target topic done)

**Commits:** `5e4b215`

---

## [0.8.0] - 2025-12-13

### Added
- Progress tracking with localStorage persistence
- Concepts can be marked as complete (stored per topic)

### Changed
- Reorganized Roadmap.astro script structure

**Commits:** `f1be5e6`, `890fe07`

---

## [0.7.0] - 2025-12-11

Navigation & Linking milestone.

### Added
- Topic deep-links with hash anchors
- Auto-expand nodes on hash navigation
- Clickable prerequisites with cross-track linking
- Visual distinction: solid+glow (linkable) vs dashed (static) prereqs
- Custom display names for prerequisites
- Prereq link behavior preference (smart/same-tab/new-tab)
- Improved section title styling

### Fixed
- Re-clicking same prereq now re-expands collapsed node
- Page no longer reloads when clicking same-page prereq links
- Prereq links use relative paths instead of Astro.url.origin

**Commits:** `3f7e10d`, `e3376bd`, `cb1c6d6`, `4660a26`, `652fa6b`, `e807c48`

---

## [0.6.0] - 2025-12-09

Content & Polish milestone.

### Added
- Core and Advanced tracks with full content
- Prerequisites, outcomes, and descriptions for all topics
- Dark mode toggle with localStorage persistence
- Claude attribution in footer

### Changed
- Renamed "topics" to "concepts" in data structure
- Improved dark mode text readability

**Commits:** `c657ad7`, `9034053`, `eef0e97`, `caeddc1`, `d37e588`

---

## [0.5.0] - 2025-12-08

### Added
- Fundamentals track populated with full content
- Broken link checker in CI/CD pipeline

### Fixed
- Link checker status code handling

**Commits:** `541c5bd`, `d8e67fc`, `2df9111`, `4aa4c76`

---

## [0.4.0] - 2025-12-07

### Added
- Interactive Roadmap component for fundamentals track
- Resource links on topic nodes
- Placeholder pages (About, Guides, Projects, Resources, Contribute)
- WIP disclaimer in header

**Commits:** `0eeef1c`, `9dac816`, `229fa0c`, `bc86aa2`

---

## [0.3.0] - 2025-12-02

Initial public release.

### Added
- Landing page with Lab Notebook + PCB aesthetic
- Grid paper background design
- Track cards (Fundamentals, Core, Advanced)
- Hero section with stats
- Footer with navigation
- GitHub Actions deployment to GitHub Pages
- Tailwind CSS integration
- TypeScript support

**Commits:** `ce4df09`, `daf9698`, `40550a9`