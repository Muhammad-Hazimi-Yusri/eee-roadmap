# EEE Roadmap

An interactive roadmap for learning Electrical & Electronic Engineering.

**[Live Demo →](https://Muhammad-Hazimi-Yusri.github.io/eee-roadmap)**

---

## Features

### Current (v0.2)
- Mockup landing page
- Responsive design
- Clean, modern UI

### Planned Features
- [ ] Interactive roadmap visualization
- [ ] Hierarchical learning path structure
- [ ] WebAssembly-based circuit simulator (Rust)
- [ ] Individual learning modules with theory + practice
- [ ] Progress tracking with local storage
- [ ] Resource links (MIT OCW, Khan Academy, etc.)
- [ ] Community contributions
- [ ] Dark mode
- [ ] PWA support for offline access

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

### Custom Domain (Optional)

1. Add a `CNAME` file to the `public/` folder with your domain:
   ```
   eee-roadmap.dev
   ```

2. Update `astro.config.mjs`:
   ```js
   export default defineConfig({
     site: 'https://eee-roadmap.dev',
     base: '/',  // Change from '/eee-roadmap' to '/'
   });
   ```

3. Configure DNS with your domain provider.

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
