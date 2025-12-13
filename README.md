# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://Muhammad-Hazimi-Yusri.github.io/eee-roadmap)**

---

## Features

### Current (v0.8.0)
- Interactive roadmaps for Fundamentals, Core, and Advanced tracks
- Expand/collapse topic nodes with descriptions, concepts and resources
- Prerequisites and learning outcomes for each topic
- Optional topics styled as side branches (roadmap.sh pattern)
- Responsive design with Lab Notebook + PCB aesthetic
- Toggleable dark mode with improved text color readability
- Topic deep-links with hash anchors
- Clickable prerequisites with cross-track navigation
- Progress tracking with localStorage

### Planned Features

#### Versioning Notes

- **v0.X.0** marks feature milestone start, **v0.X.Y** for incremental progress
- Completed versions are kept in README until 3+ exist, then oldest moves to CHANGELOG.md

**v0.7 - Navigation & Linking** ✓
- [x] Topic deep-links with hash anchors (v0.6.3)
- [x] Auto-expand nodes on hash navigation (v0.6.3)
- [x] Clickable prerequisites → cross-track linking (v0.6.3)
- [x] Visual distinction: solid+glow (linkable) vs dashed (static) prereqs (v0.6.4)
- [x] Custom display names for prereqs (v0.6.4)
- [x] Prereq link behavior preference (v0.6.5)
- [x] Improved section title styling (v0.6.5)
- [x] Fix: re-clicking same prereq re-expands collapsed node (v0.6.6)

**v0.8 - Progress Tracking**
- [x] Basic progress tracking with localStorage (v0.8.0)
- [ ] Prereqs show completed status (strikethrough if topic done)
- [ ] Static prereqs can be manually toggled
- [ ] Demo roadmap on homepage (showcase navigation, progress, interactions)
- [ ] Interaction mode preference: simple click toggle vs highlighter/pen swipe
- [ ] Visual flair: highlighter for in-progress, pen strikethrough for complete
- [ ] Swipe interaction for marking concepts (when interactive mode enabled)

**v0.9 - Cross-Device Sync**
- [ ] Research sync options (GitHub Gist, Firebase, custom backend)
- [ ] User authentication strategy
- [ ] Import/export progress as JSON fallback

**v1.0 - Notes & Deep-dives**
- [ ] Clickable concepts → modal/popup with explanations
- [ ] LaTeX or Markdown notes (decide on format)
- [ ] PDF compilation via GitHub Actions
- [ ] A4 paper aesthetic: draggable, pinnable note cards

**Future**
- [ ] WebAssembly-based circuit simulator (Rust)
- [ ] PWA support for offline access
- [ ] Community contributions workflow

**Known Issues & Limitations**
- [ ] Verify all resource links point to correct content
- Prerequisites assume unique topic IDs across all tracks
- Progress stored in localStorage (browser-specific, clears with site data)
- [ ] Consider non-linear roadmap paths (and specialisations paths)
- [ ] Add estimated time/difficulty per topic

---

## Tech Stack

- [Astro](https://astro.build) — Static site generator
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [TypeScript](https://typescriptlang.org) — Type safety

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
```

---

## Deploy to GitHub Pages

This project includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `main`.

### First-time Setup GitHub Pages

1. **Enable GitHub Pages**
   - Go to your repo → **Settings** → **Pages**
   - Under "Build and deployment", set **Source** to **GitHub Actions**

2. **Wait for deployment**
   - Go to **Actions** tab to see the workflow running
   - Once complete, your site will be live at:  
     `https://Muhammad-Hazimi-Yusri.github.io/eee-roadmap`

### Custom Domain (CloudFlare e.g)

1. Add your domain to github pages settings, make sure to also add verified domain on profile setting -> Pages to get https certs to avoid mixed content issue

2. Update `astro.config.mjs`:
   ```js
   export default defineConfig({
     // site: 'https://eee-roadmap.dev', // either comment this out or change to your single domain
     base: '/',  // Change from '/eee-roadmap' to '/'
   });
   ```

3. Configure DNS with your domain provider for CNAME and TXT

---

## Project Structure

```
eee-roadmap/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CircuitLine.astro
│   │   ├── CTA.astro
│   │   ├── Features.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Placeholder.astro
│   │   ├── Roadmap.astro
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
│   └── types/
│       └── roadmap.ts
├── .github/
│   └── workflows/
│       └── deploy.yml
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
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

## Disclaimer

This project was built with assistance from [Claude](https://claude.ai), an AI assistant by Anthropic.

---

Built by [Muhammad-Hazimi-Yusri](https://github.com/Muhammad-Hazimi-Yusri)
