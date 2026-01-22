# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> **Versioning Convention:**  
> - `vX.Y.0` — Feature milestone  
> - `vX.Y.Z` — Bug fixes and patches within that milestone  
> - Detailed patch history lives in git commits, not this changelog

---

## [0.20.X] - 2025-01-22

**Custom Tracks & Editor (WIP)**

### Added
- Custom content storage in Supabase
  - `custom_content` JSONB column in `user_progress` table
  - 500KB per-user storage limit enforced via database constraint
- Custom concept notes on existing tracks
  - Users can add personal notes to any topic (requires sign-in)
  - Distinct styling: dashed border with pencil icon prefix
  - Full ConceptWindow support (markdown, LaTeX, images)
- Custom tracks display on `/roadmaps/` page
  - "My Custom Tracks" section at bottom (only visible when signed in)
  - Dashed border card style with "CUSTOM" badge
  - "Create New Track" card for quick access to editor
- Custom track detail page (`/roadmaps/custom/?track=slug`)
  - Client-side rendering from Supabase data
  - Full roadmap interactivity (expand/collapse, progress tracking, tools mode)
- Custom track editor (`/roadmaps/custom/?track=slug&edit=true` or `?new=true`)
  - Edit/Preview toggle with live preview
  - Meta fields: title, description, icon, category, order
  - Sections: add, remove, edit title (ID auto-generated from title)
  - Topics: add, remove, edit title and description (ID auto-generated from title)
  - Concepts: add (Enter key), remove (names only, notes edited separately)
  - Resources: add (label + URL), remove, clickable links
  - Prerequisites: cascading dropdown picker (track → section → topic)
  - Validation: required fields, duplicate track detection
  - Save to Supabase with redirect to view mode
- Prerequisite picker modal
  - Select from official tracks and custom tracks
  - Cascading dropdowns: track → section → topic
  - Optional custom display label
  - Live preview of prerequisite string
- TypeScript types for custom content (`src/types/custom-content.ts`)
- Custom content utilities (`src/utils/customContent.ts`)
  - `injectCustomConcepts()` - adds custom notes to existing tracks
  - `injectCustomTracks()` - renders custom tracks on browse page
- Concept Notes Editor inside ConceptWindow
  - Edit button (pencil icon) in window titlebar
  - Markdown editor with Cancel/Save buttons
  - Full markdown support: bold, italic, LaTeX equations, images, PDFs
  - Two editing modes:
    - Official concepts: User notes appear above original content with "YOUR NOTES" label
    - Custom concepts: Full content editing (replaces entire content)
  - Notes stored as markdown in `conceptNotes`, parsed on display
  - Dynamic tooltips: "Add notes" vs "Edit notes" based on state
- Add custom concepts to official tracks
  - "+" button at end of concept lists (visible when signed in)
  - Modal dialog for entering concept name
  - Duplicate name validation
  - Custom concepts styled with dashed border and pencil icon
- Client-side markdown parser (`src/utils/parseNotesClient.ts`)
  - Separate from build-time parser (no Node.js dependencies)
  - Supports KaTeX for LaTeX equations
  - Supports images and PDF embeds
- UX improvements for concept editing
  - Helpful placeholder for empty custom concepts with edit hint
  - Hint in track editor: "add notes via concept window after saving"

### Fixed
- Add Section button not working when sections list is empty
  - Caused by early return before binding event handlers

### Changed
- Refactored roadmap rendering for reuse
  - `src/utils/renderRoadmap.ts` - generates roadmap HTML from sections data
  - `src/utils/roadmapInteractions.ts` - extracted all interaction logic
- Moved roadmap component CSS to `global.css` for dynamic content support
- Prerequisite URLs now properly formatted
  - Official tracks: `/roadmaps/{track}/#{topic-id}`
  - Custom tracks: `/roadmaps/custom/?track={slug}#{topic-id}`

### Technical Notes
- Custom concepts parsed to HTML at save time (not runtime) for performance
- Reuses existing ConceptWindows and progress tracking infrastructure
- Client-side injection after auth state resolves
- Custom tracks skip glossary term wrapping (simpler, user knows their own terms)
- Editor state is mutable object passed through functions, re-renders on structural changes
- Official tracks data passed to client via Astro `define:vars` for prerequisite picker


## [0.19.X] - 2025-01-17

**Roadmap Graph View**

### Added
- Interactive graph visualization on homepage showing topic connections
  - Cytoscape.js with dagre hierarchical layout
  - Topics as nodes, prerequisites as edges
  - Tracks as colored compound parent nodes
  - Click topic to navigate to roadmap
  - Pan and zoom enabled
  - Fullscreen modal for mobile (tap to explore)
  - Fullscreen button for desktop
  - Dark mode support with adaptive colors
  - Text labels with background for readability
- Graph data build script (`scripts/build-graph-data.mjs`)
  - Extracts nodes from all tracks
  - Parses prerequisite links as edges
  - Generates `src/data/graph-data.json`
- Dynamic track colors utility (`src/utils/trackColors.ts`)
  - Curated 8-color palette for first 8 tracks
  - HSL rotation for overflow tracks
  - Consistent colors across graph and track cards
- Progress status visualization on graph nodes
  - Completed topics: hollow ring style (white/dark center with colored border)
  - Important topics: yellow glow effect (underlay)
  - Combined state supported
  - Legend below graph explaining node states
- Per-track mini graph on each roadmap page
  - Shows current track topics with cross-track prerequisites
  - Current track nodes prominent, other tracks dimmed
  - Click topic to scroll (same track) or navigate (cross-track)
  - Fullscreen modal support
  - Dynamic legend with track-specific colors
  - Conic gradient for "Other tracks" legend icon
- Track filter pills on homepage graph
  - Toggle visibility per track
  - "All" button to show all tracks
  - Horizontal scroll for many tracks
  - Filter state persisted to localStorage
  - Animated layout transition when filtering

### Changed
- Track cards now use dynamic colors via CSS custom property `--track-color`
- Removed hardcoded `data-level` color system from Tracks.astro and global.css
- Build chain: `build:data` now includes graph data generation
- Graph node styling: larger nodes (22px), text backgrounds, track titles positioned above boxes

### Technical Notes
- Cytoscape.js + cytoscape-dagre for graph layout
- Custom type declaration for cytoscape-dagre (`src/types/cytoscape-dagre.d.ts`)
- Graph data excluded from roadmap loader, search index, and glossary scripts


## [0.18.X] - 2025-01-17

**Profile & Progress Visualization**

### Added
- Profile page (`/profile/`) with progress visualization
  - Works for guests (localStorage) and signed-in users (cloud sync)
  - Overall progress with copper-styled progress bar
  - Per-track progress cards linking to each track
  - User info section (avatar, name, email when signed in)
  - Sign-in prompt for guests
- Import/export progress as JSON
  - Export downloads `eee-progress.json` with version and timestamp
  - Import shows dialog with Merge (add to existing) or Replace (overwrite) options
  - Syncs to cloud automatically after import if signed in
- Privacy Policy page (`/privacy/`)
- Auth dropdown for guests (split button: Sign in + View Profile)
- "View Profile" link in signed-in user dropdown

### Changed
- Auth button now shows "Sign in" with dropdown toggle for guests
- Footer includes Privacy link

### Fixed
- Mobile: sign-in button text now visible (was hidden)
- Mobile: auth button positioned at top-right of header
- Mobile: search bar expands to fill width
- Sync on page refresh (pulls cloud changes without logout/login)
- Tools mode: drawing constrained to interactive areas only (normal scroll works outside)


## [0.17.X] - 2025-01-12

**Cross-Device Sync**

### Added
- Google OAuth authentication via Supabase
- Cross-device progress synchronization
  - Progress stored in PostgreSQL database
  - Real-time sync on every change (debounced)
  - Union merge on login (combines local + cloud, nothing lost)
- Login/logout button in header with dropdown menu
  - Loading spinner during auth
  - Avatar with user initial when logged in
  - Email display in dropdown
  - Responsive design (icon-only on mobile)
- Supabase client library (`src/lib/supabase.ts`)
- Sync utilities (`src/lib/sync.ts`)
- Environment variables for Supabase configuration
- Duplicate topic ID validation in build script

### Changed
- `npm run validate` now checks for duplicate topic IDs across tracks
- Renamed `power-quality` to `dg-power-quality` in distributed-generation track

### Fixed
- Supabase client gracefully handles missing env vars (no blocking requests)
- Auth button hidden when Supabase not configured
- Playwright tests no longer timeout due to Supabase background requests

### Technical Notes
- Auth uses Supabase's built-in Google OAuth provider
- Progress stored as JSONB in `user_progress` table
- Row Level Security ensures users only access own data
- Sync debounced to 1 second to reduce API calls
- Requires `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` env vars
- Auth button uses `data-state` attribute for CSS-based state management


## [0.16.X] - 2025-01-11

**ConceptWindows Persistence**

### Added
- Open windows now persist across page refreshes
  - Saves window IDs, minimized/maximized state to localStorage
  - Restores windows automatically on page load
  - Per-track storage (each track remembers its own windows)
- Taskbar enhancements
  - Now visible when any window is open (not just minimized)
  - "Minimize all" button to quickly minimize all open windows
  - "Close all" button to close all windows at once
  - Labels auto-hide when taskbar is compact (3+ minimized windows)
  - Pulsing glow on first appearance to draw attention
  - Preferences panel shifts up when taskbar is visible
- Settings panel UX improvements
  - Mobile: panel defaults to closed with pulsing glow on button
  - Desktop: panel defaults to open with pulsing glow to indicate it can be closed
  - Glow disabled for returning users who have interacted before

### Technical Notes
- Window state saved on open, close, minimize, restore, and maximize
- Storage key includes track slug: `eee-open-windows-{trackSlug}`
- Position/size persistence was already implemented in v0.11; this adds session continuity
- Body class `has-taskbar` used to shift Preferences panel position


## [0.15.X] - 2025-01-10

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