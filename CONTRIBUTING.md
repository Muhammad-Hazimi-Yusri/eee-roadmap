# Contributing to EEE Roadmap

Thanks for your interest in contributing! This project is open source under the MIT license.

## Getting Started
```bash
# Clone the repo
git clone https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap.git
cd eee-roadmap

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Project Structure
```
src/
├── components/     # Astro components
├── data/           # Roadmap content (fundamentals.ts, core.ts, advanced.ts)
├── layouts/        # Page layouts
├── pages/          # Route pages
├── styles/         # Global CSS
├── types/          # TypeScript interfaces
└── utils/          # Shared utilities (progress, tools, trail, url)
```

## Ways to Contribute

### 1. Content Improvements
- Fix typos or unclear descriptions in `src/data/*.ts`
- Add or improve learning resources (ensure links are valid)
- Suggest new topics or reorganize existing ones

### 2. Bug Fixes
- Check [Issues](https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap/issues) for known bugs
- Test on different browsers/devices
- Report new bugs with steps to reproduce

### 3. Features
- Check README.md for planned features
- Discuss major changes in an issue first

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing patterns in the codebase
- Keep components focused and single-purpose

### CSS
- Shared styles go in `src/styles/global.css`
- Component-specific styles stay in component `<style>` blocks
- Use CSS variables from `:root` for theming

### CSS Scoping & Dynamic DOM

Astro scopes component CSS by default, adding `data-astro-cid-*` attributes to both selectors and HTML elements at build time.

**This breaks when elements are created dynamically at runtime** via:
- `template.content.cloneNode()`
- `document.createElement()`
- `element.innerHTML = '...'`

Dynamically created elements don't receive the scoping attribute, so scoped CSS won't match them.

**Solutions:**
1. **`<style is:global>`** — Disables scoping for that style block (used in ConceptWindows.astro)
2. **Inline styles in JS** — Apply styles when creating elements
3. **Global CSS file** — Add to `src/styles/global.css`

**Tradeoff:** Global styles can leak to other components. Use prefixed class names (e.g., `.concept-window-*`) to avoid collisions.

### Testing
```bash
# Run tests
npm test

# Build and check for errors
npm run build

# Check for broken links
npm run check-links
```

### Commits
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `style:` formatting (not CSS)
- `refactor:` code restructure
- `test:` adding tests

## Adding Learning Resources

When adding resources to `src/data/*.ts`:

1. **Prefer primary sources** - Official docs, university courses (MIT OCW), established tutorials
2. **Verify links work** - Run `npm run check-links` after changes
3. **Keep descriptions concise** - One sentence explaining why this resource is useful

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run build` and `npm test` to ensure nothing breaks
4. Submit a PR with a clear description of changes

## Questions?

Open an issue or reach out via GitHub discussions.