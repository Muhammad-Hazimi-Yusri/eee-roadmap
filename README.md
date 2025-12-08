# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://Muhammad-Hazimi-Yusri.github.io/eee-roadmap)**

---

## Features

### Current (v0.6)
- Interactive roadmaps for Fundamentals, Core, and Advanced tracks
- Expand/collapse topic nodes with descriptions, concepts and resources
- Prerequisites and learning outcomes for each topic
- Optional topics styled as side branches (roadmap.sh pattern)
- Responsive design with Lab Notebook + PCB aesthetic
- Toggleable dark mode

### Planned Features

**v0.7 - Navigation & Linking**
- [ ] Clickable prerequisites → navigate to related topic (cross-track linking)
- [ ] Topic deep-links with hash anchors
- [ ] Progress tracking with localStorage

**v0.8 - Concept Deep-dives**
- [ ] Clickable concepts → modal/popup with detailed explanations
- [ ] Markdown-based content system for community contributions

**v0.9 - Notes System**
- [ ] LaTeX notes compiled via GitHub Actions → PDF
- [ ] Client-side PDF viewer (PDF.js)
- [ ] A4 paper aesthetic: draggable, pinnable, dismissable note cards
- [ ] Image/diagram support in notes

**Future**
- [ ] WebAssembly-based circuit simulator (Rust)
- [ ] PWA support for offline access
- [ ] Community contributions workflow

### Known Issues / Future Improvements
- [ ] Fix 3 broken links (all in advanced roadmap, commented)
- [ ] Verify all resource links point to correct content (not just 200 OK)
- [ ] Consider non-linear roadmap paths where topics have multiple valid orderings
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
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── CircuitLine.astro
│   │   ├── Tracks.astro
│   │   ├── Features.astro
│   │   ├── CTA.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
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

Built by [Muhammad-Hazimi-Yusri](https://github.com/Muhammad-Hazimi-Yusri)
