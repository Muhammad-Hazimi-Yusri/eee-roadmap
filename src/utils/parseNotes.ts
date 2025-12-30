import { marked } from 'marked';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
          <div class="notes-pdf-embed">
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
      return `<img src="${href}" alt="${altText}"${titleAttr} class="notes-image" loading="lazy" />`;
    }
  }
});

/**
 * Parses markdown notes with custom handling:
 * - ![alt](file.pdf) → full PDF.js viewer (with manifest resolution)
 * - ![alt](image.jpg) → lazy-loaded <img>
 */
export function parseNotes(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}