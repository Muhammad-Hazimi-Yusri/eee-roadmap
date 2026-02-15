/**
 * Wraps glossary terms in text/HTML content at build time.
 * Returns HTML string with glossary terms wrapped in spans.
 */

import glossaryData from '../data/_glossary.json';

const { terms, lookup } = glossaryData as {
  terms: Array<{ id: string; term: string; acronyms: string[] }>;
  lookup: Record<string, string>;
};

// Elements to skip (don't wrap terms inside these)
const SKIP_TAGS = /^(code|pre|a|script|style|kbd|samp)$/i;

/**
 * Escapes special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes HTML entities
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Build regex pattern from all lookup keys, sorted by length (longest first)
const sortedKeys = Object.keys(lookup).sort((a, b) => b.length - a.length);
const termPattern = sortedKeys.length > 0
  ? new RegExp(`\\b(${sortedKeys.map(escapeRegex).join('|')})\\b`, 'gi')
  : null;

/**
 * Wraps glossary terms in plain text (escapes HTML first)
 */
export function wrapTermsInText(text: string): string {
  if (!text || !termPattern) return escapeHtml(text);
  
  const escaped = escapeHtml(text);
  const wrappedIds = new Set<string>();
  
  return escaped.replace(termPattern, (match) => {
    const termId = lookup[match.toLowerCase()];
    if (!termId || wrappedIds.has(termId)) {
      return match; // Already wrapped or not found
    }
    wrappedIds.add(termId);
    return `<span class="glossary-link" data-term-id="${termId}" role="button" tabindex="0">${match}</span>`;
  });
}

/**
 * Wraps glossary terms in HTML content (only in text nodes, skips code/pre/a)
 * Uses simple regex-based approach suitable for build time.
 */
export function wrapTermsInHtml(html: string): string {
  if (!html || !termPattern) return html;
  
  const wrappedIds = new Set<string>();
  
  // Track tag depth to skip content inside code/pre/a
  let skipDepth = 0;
  let result = '';
  let i = 0;
  
  while (i < html.length) {
    // Check for HTML tag
    if (html[i] === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) {
        result += html.slice(i);
        break;
      }
      
      const tagContent = html.slice(i + 1, tagEnd);
      const isClosing = tagContent.startsWith('/');
      const tagName = (isClosing ? tagContent.slice(1) : tagContent).split(/[\s/]/)[0];
      
      if (SKIP_TAGS.test(tagName)) {
        if (isClosing) {
          skipDepth = Math.max(0, skipDepth - 1);
        } else if (!tagContent.endsWith('/')) {
          // Not self-closing
          skipDepth++;
        }
      }
      
      result += html.slice(i, tagEnd + 1);
      i = tagEnd + 1;
      continue;
    }
    
    // Find next tag or end
    const nextTag = html.indexOf('<', i);
    const textEnd = nextTag === -1 ? html.length : nextTag;
    const text = html.slice(i, textEnd);
    
    if (skipDepth > 0 || !text.trim()) {
      // Inside skip tag or whitespace only
      result += text;
    } else {
      // Wrap terms in this text segment
      result += text.replace(termPattern, (match) => {
        const termId = lookup[match.toLowerCase()];
        if (!termId || wrappedIds.has(termId)) {
          return match;
        }
        wrappedIds.add(termId);
        return `<span class="glossary-link" data-term-id="${termId}" role="button" tabindex="0">${match}</span>`;
      });
    }
    
    i = textEnd;
  }
  
  return result;
}

/**
 * Get term data by ID (for tooltips)
 */
export function getTermById(id: string) {
  return terms.find(t => t.id === id);
}

/**
 * Get all terms (for client-side tooltip init)
 */
export function getAllTerms() {
  return terms;
}