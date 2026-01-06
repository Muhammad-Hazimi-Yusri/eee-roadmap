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

## Project Structure (Full dir tree in README.md)
```
content/                # Roadmap YAML source files (edit these!)
├── fundamentals.yaml
├── core.yaml
└── advanced.yaml
src/
├── components/     # Astro components
├── data/           # Generated JSON + loader (don't edit JSONs directly)
│   ├── index.ts    # Dynamic loader
│   └── sample.json # Example structure
├── layouts/        # Page layouts
├── pages/          # Route pages
├── styles/         # Global CSS
├── types/          # TypeScript interfaces
└── utils/          # Shared utilities (progress, tools, trail, url)
```

## Ways to Contribute

### 1. Content Improvements

Edit roadmap content in `content/*.yaml` files:
- Fix typos or unclear descriptions
- Add or improve learning resources (ensure links are valid)
- Suggest new topics or reorganize existing ones

**YAML format example:**
```yaml
- id: section-id
  title: Section Title
  items:
    - id: topic-id
      title: Topic Title
      description: >-
        A clear description of what this covers.
      prerequisites:
        - other-track/topic-id/Linked Prereq
        - Plain text prerequisite
      outcomes:
        - What learners will achieve
      concepts:
        - name: Concept Name
          notes: |
            Optional markdown with $LaTeX$ support.
            
            $$E = mc^2$$
      resources:
        - label: Resource Name
          url: https://example.com
      optional: false
```

See `src/data/sample.json` for the complete structure reference.

### Adding a New Topic

Add a new item under the appropriate section in `content/*.yaml`:
```yaml
    - id: your-topic-id
      title: Your Topic Title
      description: >-
        A clear, concise description of what this topic covers
        and why it matters.
      prerequisites:
        - track/topic-id/Prerequisite Name
      outcomes:
        - What the learner will be able to do
      concepts:
        - name: Key Concept
      resources:
        - label: Resource Name
          url: https://example.com
```

### Adding a New Track

1. Create `content/your-track.yaml`
2. Follow structure in existing YAML files
3. Run `npm run dev` — auto-discovered!
4. Add route in `src/pages/roadmaps/[slug].astro` `getStaticPaths()`

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

### Content Notes

- **Markdown in YAML**: Use `|` for multiline notes (preserves newlines). Keep lines flush-left to avoid code block interpretation.
- **LaTeX equations**: Use `$...$` for inline and `$$...$$` for block math. Block equations need blank lines before and after. Use single backslashes in YAML (e.g., `\frac{1}{2}`).

## Testing
```bash
npm run test:run    # Unit tests
npm run test:e2e    # E2E tests  
npm run test:all    # Both
```

Roadmap structure is automatically validated — any YAML file in `content/` will be tested.

## Validation

- JSON Schema available at `roadmap.schema.json` for editor support
- Run `npm run build:data` to manually rebuild JSON from YAML

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:all`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Questions?

Open an issue or start a discussion. We're happy to help!