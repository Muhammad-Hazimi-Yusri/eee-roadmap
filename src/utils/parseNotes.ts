import { marked } from 'marked';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { preprocessMath } from './preprocessMath';

// Load PDF manifest at build time
function loadPdfManifest(): Record<string, string> {
  try {
    const manifestPath = join(process.cwd(), 'public/pdf-manifest.json');
    if (existsSync(manifestPath)) {
      return JSON.parse(readFileSync(manifestPath, 'utf-8'));
    }
  } catch {
    // Manifest doesn't exist yet
  }
  return {};
}

const pdfManifest = loadPdfManifest();

// Resolve external PDF URL to local path if available
function resolvePdfUrl(url: string): string {
  return pdfManifest[url] || url;
}

// Configure marked with custom image renderer
marked.use({
  renderer: {
    image({ href, title, text }) {
      if (!href) return '';

      const isPdf = href.toLowerCase().endsWith('.pdf');
      const altText = text || '';
      const titleAttr = title ? ` title="${title}"` : '';

      if (isPdf) {
        const resolvedUrl = resolvePdfUrl(href);
        const encodedUrl = encodeURIComponent(resolvedUrl);
        return `
          <div class="notes-pdf-embed" data-pdf-url="${href}">
            <iframe
              src="/pdfjs/web/viewer.html?file=${encodedUrl}"
              title="${altText || 'PDF document'}"
              class="notes-pdf-iframe"
              loading="lazy"
            ></iframe>
            <div class="notes-pdf-resizer" title="Drag to resize PDF"></div>
          </div>
        `.trim();
      }

      // Regular image
      return `<img src="${href}" alt="${altText}"${titleAttr} class="notes-image" loading="lazy" width="600" height="400" />`;
    }
  }
});

import { wrapTermsInHtml } from './wrapGlossaryTerms';

/**
 * Parses markdown notes with custom handling:
 * - ![alt](file.pdf) → full PDF.js viewer (with manifest resolution)
 * - ![alt](image.jpg) → lazy-loaded <img>
 */
export function parseNotes(markdown: string): string {
  // Pre-render LaTeX math to HTML before marked touches it. This avoids the
  // strict delimiter-boundary rules of marked-katex-extension which break
  // patterns like `($\phi$)` and `$$x=1$$ (note)` on a single line.
  const withMath = preprocessMath(markdown);
  const html = marked.parse(withMath, { async: false }) as string;
  return wrapTermsInHtml(html);
}