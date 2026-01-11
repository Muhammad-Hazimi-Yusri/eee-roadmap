# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **Versioning Convention:**  
> - `vX.Y.0` — Feature milestone  
> - `vX.Y.Z` — Bug fixes and patches within that milestone  
> - Detailed patch history lives in git commits, not this changelog

---

## [0.15.0] - 2025-01-10

**Glossary & Acronyms**

### Added
- Glossary data source (`content/_glossary.yaml`)
- 100+ EEE terms and acronyms with definitions
- `/glossary/` page with:
  - A-Z alphabet navigation (disabled letters grayed out)
  - Real-time search/filter with count
  - 2-column responsive layout
  - Category tags per term
  - "See also" cross-references (clickable links)
  - "Appears in" reverse index (expandable, "Show all" button)
  - Hash navigation with highlight animation
- Build script (`scripts/build-glossary.mjs`):
  - Parses YAML to JSON with slugified IDs
  - Scans all roadmap JSON for term occurrences
  - Generates reverse index (`appears_in`) automatically
- Glossary integrated into global search:
  - New "Glossary Terms" group (appears first in results)
  - Searches term names, acronyms, and definitions
  - Links to `/glossary/#term-id`
- Auto-linking glossary terms in roadmap content:
  - Build-time term wrapping (`wrapGlossaryTerms.ts`)
  - Descriptions, outcomes, and concept notes
  - Dotted underline styling (`.glossary-link`)
  - Tippy.js tooltips on hover with:
    - Term name and acronyms
    - Definition preview (truncated)
    - Client-side KaTeX rendering for LaTeX
    - "View in glossary" link (opens new tab)
  - ConceptWindows dispatch `concept-window-opened` event for re-init
- Glossary link added to Footer
- LaTeX/KaTeX support in definitions (glossary page + tooltips)

### Changed
- `build:data` now chains: YAML → JSON → Glossary → Search Index
- `build-data.mjs` excludes `_glossary` from roadmap processing
- `validate.mjs` excludes `_glossary` from validation
- `src/data/index.ts` excludes `_glossary.json` from track loader
- Search index includes glossary entries
- Fuse.js config updated with `acronyms` and `definition` keys

### Technical Notes
- Build-time term wrapping via `src/utils/wrapGlossaryTerms.ts`
- `parseNotes.ts` imports `wrapTermsInHtml` for concept notes
- Tippy.js + KaTeX loaded as ES modules in `GlossaryTooltips.astro`
- Client-side LaTeX rendering in tooltips (not build-time)
- Astro's `define:vars` passes terms to inline script, module script imports libs


## [0.14.X] - 2025-01-09

**Personal Progress Filters**

### Added
- Progress filter component (`ProgressFilter.astro`)
- `/roadmaps/` page: filter tracks by has-incomplete/has-highlighted
- Build-time concept key injection for instant runtime filtering
- Combined category + progress filtering
- Roadmap page: Expand All / Collapse All buttons
- Roadmap page: Focus buttons (incomplete/highlighted) with glow effect
- Auto-scroll to first matching topic on focus
- Smart settings panel persistence (remembers state, auto-opens after 24h)
- "Keep this panel closed" option to override auto-open
- Per-topic expand/collapse state persistence (per-track localStorage)

## [0.13.X] - 2025-01-08

**Search & Discovery**

### Added
- `/roadmaps/` index page with browse all tracks
- Box card design with lid opening animation on hover
- "UNVERIFIED" label badge on track cards
- PCB-themed modal for track preview
  - Green solder mask background with copper traces
  - 45° angle trace routing (corners, edges, vias)
  - Mounting holes and decorative elements
- Section headers styled as IC chips with pins
- Topics as SMD components with solder pads
- RGB LED animation on title chip hover
- Electric flow sweep effect on chip hover
- Section LED lights up on hover (color varies by index)
- Clickable sections/topics linking directly to anchors
- Mobile: double-tap to open with hint popup
- Notebook-themed track cards on homepage
  - Subtle paper lines effect
  - Color-coded left border (copper/pcb-green/dark)
  - Border thickens on hover
- Global search modal (`Ctrl+K` or click)
  - Fuse.js fuzzy matching
  - Results grouped by type: tracks → topics → concepts
  - Breadcrumb context showing track/topic hierarchy
  - Responsive trigger (full hint desktop, short mobile)
- Search index build script (`npm run build:search`)
- Dynamic Hero stats (concepts, topics, tracks from data)
- Full-text search in concept notes (Phase 2)
- Highlighted snippets showing match context in search results
- "In notes" badge for matches found in concept content
- Exact match boosting (name matches rank higher than note matches)
- Version bump script (`npm run version:bump`)
- Pre-commit hooks via Husky (build:data, validate, check-links, test:all)
- JSON schema updated with `order` property for track meta
- Track filtering by category on `/roadmaps/` page
- Filter buttons derived dynamically from track metadata
- Deep links to concepts from search (auto-opens concept window)
- URL format: `/roadmaps/track/?concept=Name#topic-id`
- Boxed/Unboxed view toggle on `/roadmaps/` page
- Unboxed view shows inline PCB layout with all sections and topics
- View hint text updates based on current mode
- Shipping label styled category filters with stamp checkmark

### Changed
- Hero section stats computed at build time from YAML
- Header: removed "(WORK IN PROGRESS)" text
- `npm run build:data` chains search index generation
- Data loader excludes `search-index.json` from roadmap glob

### Fixed
- Section title color visibility in PCB modal
- Added `id` to roadmap sections for anchor links
- Use `is:global` for dynamically generated modal content


## [0.12.X] - 2025-01-06

**Custom Roadmaps & Self-Hosting**

### Added
- YAML-based roadmap content (`content/*.yaml`)
- Automatic YAML → JSON build pipeline
- JSON Schema for roadmap validation (`roadmap.schema.json`)
- `content/sample.yaml` — human-readable template for contributors
- `src/data/sample.json` — example JSON output for reference
- `npm run validate` — CLI schema validator for YAML files
- New track: `distributed-generation` (domestic microgeneration & grid integration)
- Track metadata system (`meta:` block in YAML)
  - `title`, `description`, `icon`, `featured`, `category`, `order`
  - Defaults applied automatically if not specified
- Lucide icons for track display (`@lucide/astro`)
- Fully dynamic track discovery — no manual route config needed

### Changed
- Migrated roadmap data from TypeScript to YAML
- YAML structure now uses `meta:` + `sections:` format
- `[slug].astro` generates routes dynamically from data
- `Tracks.astro` reads from data instead of hardcoded array
- Updated schema, types, and data loader for new structure
- README.md: consolidated YAML docs, links to CONTRIBUTING.md
- CONTRIBUTING.md: updated format examples, marked as authoritative

### Removed
- `src/data/fundamentals.ts`, `core.ts`, `advanced.ts` (replaced by YAML)
- Hardcoded track definitions in components

### Developer Experience
- Contributors edit human-readable YAML instead of TypeScript
- New tracks auto-discovered without code changes
- Build script runs automatically on `npm run dev`
- Single source of truth for YAML documentation


## [0.11.X] - 2025-12-28

**Notes & Deep-dives**

### Added
- Concept Windows system for displaying notes and PDFs
  - Draggable windows (titlebar drag)
  - Resizable via corner and edge handles (mouse + touch)
  - Minimize to taskbar at bottom
  - Maximize/restore with icon toggle
  - Window positions persisted to localStorage
  - Mobile responsive initial positioning
  - Viewport resize/orientation revalidation
  - z-index management (click to bring front)
  - Taskbar z-index (10000) above windows
  - Settings panel z-index (10001) topmost
  - PDF.js v5.4.449 integration for cross-browser PDF rendering
  - PDFs now display on Android browsers (Samsung Internet, Chrome) that lack native support
- Demo page ConceptWindows integration
  - Interactive demo pills open real ConceptWindows
  - Showcases LaTeX, images, PDF viewer with resizer
  - Build-time markdown parsing for full feature parity
- Updated Features section to highlight Rich Notes
  

### Fixed
- CSS scoping issue with dynamically cloned template elements
  - Changed `<style>` to `<style is:global>` in ConceptWindows.astro

### Technical Notes
- Astro's scoped CSS doesn't work with runtime-cloned DOM; use `is:global` for components that create elements dynamically

## [0.10.X] - 2025-12-20

**Testing Infrastructure**

### Added
- Playwright integration tests (navigation, hash anchors, prereq links, dark mode)
- Playwright E2E tests (interactions, persistence, demo component, cross-track nav)
- Test job in CI/CD pipeline (runs before build)
- Vitest coverage reporting with v8 provider
- Coverage report uploaded as CI artifact on failure

### Changed
- BEM class name consistency: `concept--important` → `concept-pill--important`

### Deferred
- Visual regression tests (not useful during active solo development; revisit when UI stabilizes or contributors join)


## [0.9.X] - 2025-12-19

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

## [0.8.X] - 2025-12-17

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

## [0.7.X] - 2025-12-11

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

## [0.6.X] - 2025-12-09

**Content & Polish**

### Added
- Core and Advanced tracks with full content
- Prerequisites, outcomes, and descriptions for all topics
- Dark mode toggle with localStorage persistence

### Changed
- Renamed "topics" to "concepts" in data structure
- Improved dark mode text readability

---

## [0.5.X] - 2025-12-08

**Content Population**

### Added
- Fundamentals track with full content
- Broken link checker in CI/CD pipeline

---

## [0.4.X] - 2025-12-07

**Interactive Roadmap**

### Added
- Roadmap component with expand/collapse nodes
- Resource links on topic nodes
- Placeholder pages (About, Guides, Projects, Resources, Contribute)

---

## [0.3.X] - 2025-12-02

**Initial Release**

### Added
- Landing page with Lab Notebook + PCB aesthetic
- Track cards (Fundamentals, Core, Advanced)
- GitHub Actions deployment to GitHub Pages
- Tailwind CSS and TypeScript integration