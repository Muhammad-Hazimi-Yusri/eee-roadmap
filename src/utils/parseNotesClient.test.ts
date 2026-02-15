import { describe, it, expect } from 'vitest';
import { parseNotesClient } from './parseNotesClient';

describe('parseNotesClient', () => {
  describe('basic markdown', () => {
    it('parses bold text', () => {
      const result = parseNotesClient('**bold**');
      expect(result).toContain('<strong>bold</strong>');
    });

    it('parses italic text', () => {
      const result = parseNotesClient('*italic*');
      expect(result).toContain('<em>italic</em>');
    });

    it('parses headings', () => {
      const result = parseNotesClient('# Heading 1');
      expect(result).toContain('<h1>Heading 1</h1>');
    });

    it('parses links', () => {
      const result = parseNotesClient('[link](https://example.com)');
      expect(result).toContain('<a href="https://example.com">link</a>');
    });

    it('parses lists', () => {
      const result = parseNotesClient('- item 1\n- item 2');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>item 1</li>');
      expect(result).toContain('<li>item 2</li>');
    });
  });

  describe('image rendering', () => {
    it('renders images with notes-image class', () => {
      const result = parseNotesClient('![alt text](https://example.com/image.png)');
      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.png"');
      expect(result).toContain('alt="alt text"');
      expect(result).toContain('class="notes-image"');
      expect(result).toContain('loading="lazy"');
    });

    it('renders images with title attribute when provided', () => {
      const result = parseNotesClient('![alt](https://example.com/img.jpg "my title")');
      expect(result).toContain('title="my title"');
    });

    it('handles various image extensions', () => {
      const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
      extensions.forEach((ext) => {
        const result = parseNotesClient(`![img](https://example.com/image${ext})`);
        expect(result).toContain('<img');
        expect(result).not.toContain('iframe');
      });
    });
  });

  describe('PDF rendering', () => {
    it('renders PDFs as iframe with PDF.js viewer', () => {
      const result = parseNotesClient('![PDF doc](/pdfs/test.pdf)');
      expect(result).toContain('<iframe');
      expect(result).toContain('src="/pdfjs/web/viewer.html?file=');
      expect(result).toContain('class="notes-pdf-iframe"');
      expect(result).toContain('loading="lazy"');
    });

    it('encodes PDF URL', () => {
      const result = parseNotesClient('![PDF](/pdfs/my%20file.pdf)');
      expect(result).toContain(encodeURIComponent('/pdfs/my%20file.pdf'));
    });

    it('uses alt text as iframe title', () => {
      const result = parseNotesClient('![My PDF Title](/pdfs/test.pdf)');
      expect(result).toContain('title="My PDF Title"');
    });

    it('uses default title when alt is empty', () => {
      const result = parseNotesClient('![](/pdfs/test.pdf)');
      expect(result).toContain('title="PDF document"');
    });

    it('handles uppercase .PDF extension', () => {
      const result = parseNotesClient('![doc](/files/TEST.PDF)');
      expect(result).toContain('<iframe');
      expect(result).toContain('notes-pdf-iframe');
    });

    it('wraps PDF in notes-pdf-embed div', () => {
      const result = parseNotesClient('![PDF](/test.pdf)');
      expect(result).toContain('<div class="notes-pdf-embed">');
    });

    it('includes pdf-resizer for drag-to-resize', () => {
      const result = parseNotesClient('![PDF](/test.pdf)');
      expect(result).toContain('notes-pdf-resizer');
    });
  });

  describe('mixed content', () => {
    it('handles text before and after image', () => {
      const result = parseNotesClient('Before\n\n![img](/img.png)\n\nAfter');
      expect(result).toContain('Before');
      expect(result).toContain('<img');
      expect(result).toContain('After');
    });

    it('handles multiple PDFs', () => {
      const result = parseNotesClient('![a](/a.pdf)\n\n![b](/b.pdf)');
      const iframeCount = (result.match(/<iframe/g) || []).length;
      expect(iframeCount).toBe(2);
    });

    it('handles mixed PDFs and images', () => {
      const result = parseNotesClient('![img](/pic.png)\n\n![pdf](/doc.pdf)');
      expect(result).toContain('<img');
      expect(result).toContain('<iframe');
    });
  });

  describe('LaTeX rendering', () => {
    it('renders inline math with single $', () => {
      const result = parseNotesClient("Ohm\\'s Law: $V = IR$");
      expect(result).toContain('<span class="katex">');
    });

    it('renders block math with $$', () => {
      const result = parseNotesClient('Formula:\n\n$$Z = \\\\sqrt{R^2}$$');
      expect(result).toContain('<span class="katex-display">');
    });

    it('handles fractions', () => {
      const result = parseNotesClient('$\\\\frac{1}{2}$');
      expect(result).toContain('katex');
    });

    it('handles Greek letters', () => {
      const result = parseNotesClient('$\\\\omega = 2\\\\pi f$');
      expect(result).toContain('katex');
    });

    it('does not crash on invalid LaTeX', () => {
      const result = parseNotesClient('$\\\\invalidcommand$');
      expect(result).toBeDefined();
    });
  });

  describe('client-side specific behavior', () => {
    it('does NOT wrap glossary terms', () => {
      // parseNotesClient should NOT produce glossary-link spans
      // (unlike server-side parseNotes which calls wrapTermsInHtml)
      const result = parseNotesClient('Resistor and capacitor are components');
      expect(result).not.toContain('glossary-link');
      expect(result).not.toContain('data-term-id');
    });

    it('uses original PDF URL without manifest resolution', () => {
      const result = parseNotesClient('![PDF](https://example.com/external.pdf)');
      expect(result).toContain(encodeURIComponent('https://example.com/external.pdf'));
    });
  });
});
