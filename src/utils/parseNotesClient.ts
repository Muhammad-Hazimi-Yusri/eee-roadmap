// src/utils/parseNotesClient.ts
// Client-side markdown parser for user-created concept notes
// (Separate from parseNotes.ts which uses Node.js fs/path)

import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';

// Configure marked with KaTeX support
marked.use(markedKatex({ throwOnError: false }));

// Configure custom image renderer (same as build-time, minus PDF manifest)
marked.use({
  renderer: {
    image({ href, title, text }) {
      if (!href) return '';

      const altText = text || '';
      const titleAttr = title ? ` title="${title}"` : '';
      const isPdf = href.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        const encodedUrl = encodeURIComponent(href);
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

/**
 * Parse markdown to HTML (client-side).
 * Supports LaTeX via KaTeX, images, and PDF embeds.
 */
export function parseNotesClient(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}