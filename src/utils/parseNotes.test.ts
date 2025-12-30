import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs before importing parseNotes
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { readFileSync, existsSync } from 'fs';
import { parseNotes } from './parseNotes';

describe('parseNotes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: no manifest
    vi.mocked(existsSync).mockReturnValue(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('basic markdown', () => {
    it('should parse bold text', () => {
      const result = parseNotes('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should parse italic text', () => {
      const result = parseNotes('*italic*');
      expect(result).toContain('<em>italic</em>');
    });

    it('should parse headings', () => {
      const result = parseNotes('# Heading 1');
      expect(result).toContain('<h1>Heading 1</h1>');
    });

    it('should parse links', () => {
      const result = parseNotes('[link](https://example.com)');
      expect(result).toContain('<a href="https://example.com">link</a>');
    });

    it('should parse lists', () => {
      const result = parseNotes('- item 1\n- item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
      expect(result).toContain('<li>item 2</li>');
    });
  });

  describe('image rendering', () => {
    it('should render images with notes-image class', () => {
      const result = parseNotes('![alt text](https://example.com/image.png)');
      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.png"');
      expect(result).toContain('alt="alt text"');
      expect(result).toContain('class="notes-image"');
      expect(result).toContain('loading="lazy"');
    });

    it('should render images with title attribute when provided', () => {
      const result = parseNotes('![alt](https://example.com/img.jpg "my title")');
      expect(result).toContain('title="my title"');
    });

    it('should handle various image extensions', () => {
      const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
      extensions.forEach((ext) => {
        const result = parseNotes(`![img](https://example.com/image${ext})`);
        expect(result).toContain('<img');
        expect(result).not.toContain('iframe');
      });
    });
  });

  describe('PDF rendering', () => {
    it('should render PDFs as iframe with PDF.js viewer', () => {
      const result = parseNotes('![PDF doc](/pdfs/test.pdf)');
      expect(result).toContain('<iframe');
      expect(result).toContain('src="/pdfjs/web/viewer.html?file=');
      expect(result).toContain('class="notes-pdf-iframe"');
      expect(result).toContain('loading="lazy"');
    });

    it('should encode PDF URL', () => {
      // Note: Spaces in markdown URLs must be pre-encoded or markdown won't parse them
      const result = parseNotes('![PDF](/pdfs/my%20file.pdf)');
      expect(result).toContain(encodeURIComponent('/pdfs/my%20file.pdf'));
    });

    it('should use alt text as iframe title', () => {
      const result = parseNotes('![My PDF Title](/pdfs/test.pdf)');
      expect(result).toContain('title="My PDF Title"');
    });

    it('should use default title when alt is empty', () => {
      const result = parseNotes('![](/pdfs/test.pdf)');
      expect(result).toContain('title="PDF document"');
    });

    it('should handle uppercase .PDF extension', () => {
      const result = parseNotes('![doc](/files/TEST.PDF)');
      expect(result).toContain('<iframe');
      expect(result).toContain('notes-pdf-iframe');
    });

    it('should wrap PDF in notes-pdf-embed div', () => {
      const result = parseNotes('![PDF](/test.pdf)');
      expect(result).toContain('<div class="notes-pdf-embed">');
    });
  });

  describe('mixed content', () => {
    it('should handle text before and after image', () => {
      const result = parseNotes('Before\n\n![img](/img.png)\n\nAfter');
      expect(result).toContain('Before');
      expect(result).toContain('<img');
      expect(result).toContain('After');
    });

    it('should handle text before and after PDF', () => {
      const result = parseNotes('Before\n\n![pdf](/doc.pdf)\n\nAfter');
      expect(result).toContain('Before');
      expect(result).toContain('<iframe');
      expect(result).toContain('After');
    });

    it('should handle multiple images', () => {
      const result = parseNotes('![a](/a.png)\n\n![b](/b.jpg)');
      const imgCount = (result.match(/<img/g) || []).length;
      expect(imgCount).toBe(2);
    });

    it('should handle multiple PDFs', () => {
      const result = parseNotes('![a](/a.pdf)\n\n![b](/b.pdf)');
      const iframeCount = (result.match(/<iframe/g) || []).length;
      expect(iframeCount).toBe(2);
    });

    it('should handle mixed PDFs and images', () => {
      const result = parseNotes('![img](/pic.png)\n\n![pdf](/doc.pdf)\n\n![img2](/pic2.jpg)');
      expect(result).toContain('<img');
      expect(result).toContain('<iframe');
      const imgCount = (result.match(/<img/g) || []).length;
      const iframeCount = (result.match(/<iframe/g) || []).length;
      expect(imgCount).toBe(2);
      expect(iframeCount).toBe(1);
    });
  });

  describe('PDF manifest resolution', () => {
    it('should resolve external PDF URL to local path when manifest exists', async () => {
      const manifest = {
        'https://example.com/external.pdf': '/pdfs/downloaded-abc123.pdf',
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(manifest));

      // Need to re-import to pick up mocked manifest
      vi.resetModules();
      const { parseNotes: parseNotesWithManifest } = await import('./parseNotes');

      const result = parseNotesWithManifest('![PDF](https://example.com/external.pdf)');
      expect(result).toContain(encodeURIComponent('/pdfs/downloaded-abc123.pdf'));
      expect(result).not.toContain(encodeURIComponent('https://example.com/external.pdf'));
    });

    it('should use original URL when not in manifest', async () => {
      const manifest = {
        'https://other.com/other.pdf': '/pdfs/other.pdf',
      };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(manifest));

      vi.resetModules();
      const { parseNotes: parseNotesWithManifest } = await import('./parseNotes');

      const result = parseNotesWithManifest('![PDF](https://example.com/notinmanifest.pdf)');
      expect(result).toContain(encodeURIComponent('https://example.com/notinmanifest.pdf'));
    });

    it('should handle missing manifest gracefully', async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      vi.resetModules();
      const { parseNotes: parseNotesWithManifest } = await import('./parseNotes');

      const result = parseNotesWithManifest('![PDF](/local.pdf)');
      expect(result).toContain('<iframe');
      expect(result).toContain(encodeURIComponent('/local.pdf'));
    });

    it('should handle malformed manifest JSON gracefully', async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue('not valid json');

      vi.resetModules();
      const { parseNotes: parseNotesWithManifest } = await import('./parseNotes');

      // Should not throw, should fall back to original URL
      const result = parseNotesWithManifest('![PDF](/test.pdf)');
      expect(result).toContain('<iframe');
    });
  });

  describe('whitespace handling', () => {
    it('should NOT parse indented content as code blocks', () => {
      // This tests the documented limitation - indented text becomes code
      const indented = `Text

    ![PDF](/test.pdf)`;
      const result = parseNotes(indented);
      // With 4+ spaces, markdown treats it as code block
      expect(result).toContain('<code>');
    });

    it('should correctly parse non-indented embeds', () => {
      const correct = `Text

![PDF](/test.pdf)`;
      const result = parseNotes(correct);
      expect(result).toContain('<iframe');
      expect(result).not.toContain('<code>');
    });
  });
});