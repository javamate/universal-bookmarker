import type { ContentExtractionResult } from '../types';

export class ContentExtractor {
  /**
   * Extracts content from a web page URL
   */
  async extractFromUrl(url: string): Promise<ContentExtractionResult> {
    try {
      // For Chrome extension context, we'll need to use a different approach
      // This is a basic implementation that can be enhanced
      const response = await fetch(url);
      const html = await response.text();
      
      return this.extractFromHtml(html, url);
    } catch (error) {
      console.error('Failed to extract content from URL:', error);
      throw new Error(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts content from HTML string
   */
  extractFromHtml(html: string, url: string): ContentExtractionResult {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract basic metadata
    const title = this.extractTitle(doc);
    const description = this.extractDescription(doc);
    const keywords = this.extractKeywords(doc);
    
    // Extract main content
    const { content, wordCount } = this.extractMainContent(doc);
    
    // Generate summary
    const summary = this.generateSummary(content);
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);

    // Extract favicon
    const favicon = this.extractFavicon(doc, url);

    return {
      title,
      description,
      summary,
      fullText: content,
      keywords,
      favicon,
      wordCount,
      readingTime
    };
  }

  /**
   * Extract page title
   */
  private extractTitle(doc: Document): string {
    // Try multiple title sources in order of preference
    const selectors = [
      'title',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'h1',
      '[class*="title"]',
      '[class*="heading"]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim().length > 0) {
          return content.trim();
        }
      }
    }

    return 'Untitled';
  }

  /**
   * Extract page description
   */
  private extractDescription(doc: Document): string {
    const selectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="DC.description"]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content');
        if (content && content.trim().length > 0) {
          return content.trim();
        }
      }
    }

    // Fallback: try to get first paragraph after title
    const firstParagraph = doc.querySelector('p');
    if (firstParagraph) {
      const text = firstParagraph.textContent?.trim();
      if (text && text.length > 50) {
        return text.substring(0, 200) + (text.length > 200 ? '...' : '');
      }
    }

    return '';
  }

  /**
   * Extract keywords
   */
  private extractKeywords(doc: Document): string[] {
    const keywords = new Set<string>();

    // From meta keywords
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      const content = metaKeywords.getAttribute('content');
      if (content) {
        content.split(',').forEach(keyword => {
          const trimmed = keyword.trim().toLowerCase();
          if (trimmed.length > 1) {
            keywords.add(trimmed);
          }
        });
      }
    }

    // From tags and headings
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      if (heading.textContent) {
        const words = heading.textContent.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3);
        words.forEach(word => keywords.add(word));
      }
    });

    // From strong/em tags
    const emphasized = doc.querySelectorAll('strong, em, b, i');
    emphasized.forEach(element => {
      if (element.textContent) {
        const words = element.textContent.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3);
        words.forEach(word => keywords.add(word));
      }
    });

    return Array.from(keywords).slice(0, 20); // Limit to top 20 keywords
  }

  /**
   * Extract main content from the page
   */
  private extractMainContent(doc: Document): { content: string; wordCount: number } {
    // Try to find main content area
    const contentSelectors = [
      'main',
      '[role="main"]',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];

    let contentElement: Element | null = null;

    for (const selector of contentSelectors) {
      contentElement = doc.querySelector(selector);
      if (contentElement) break;
    }

    // Fallback to body if no main content found
    if (!contentElement) {
      contentElement = doc.body;
    }

    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.sidebar',
      '.menu',
      '.navigation',
      '.ads',
      '.advertisement'
    ];

    const clone = contentElement.cloneNode(true) as Element;
    unwantedSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Extract text content
    const textContent = clone.textContent || '';
    const cleanedText = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();

    const wordCount = cleanedText.split(/\s+/).length;

    return {
      content: cleanedText,
      wordCount
    };
  }

  /**
   * Generate a summary of the content
   */
  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Take first 3 sentences or first 300 characters
    if (sentences.length === 0) {
      return content.substring(0, 300) + (content.length > 300 ? '...' : '');
    }

    const summary = sentences.slice(0, 3).join('. ') + '.';
    
    // Ensure summary doesn't exceed 500 characters
    if (summary.length <= 500) {
      return summary;
    }

    return summary.substring(0, 500) + '...';
  }

  /**
   * Extract favicon URL
   */
  private extractFavicon(doc: Document, baseUrl: string): string | undefined {
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]'
    ];

    for (const selector of selectors) {
      const link = doc.querySelector(selector);
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          // Convert relative URL to absolute
          try {
            return new URL(href, baseUrl).href;
          } catch {
            return href;
          }
        }
      }
    }

    // Default favicon location
    try {
      return new URL('/favicon.ico', baseUrl).href;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract content from the current page (Chrome extension context)
   */
  async extractFromCurrentPage(): Promise<ContentExtractionResult> {
    if (typeof window === 'undefined') {
      throw new Error('This method can only be called in a browser context');
    }

    const url = window.location.href;
    const title = document.title;
    const description = this.extractDescription(document);
    const keywords = this.extractKeywords(document);
    
    const { content, wordCount } = this.extractMainContent(document);
    const summary = this.generateSummary(content);
    const readingTime = Math.ceil(wordCount / 200);
    const favicon = this.extractFavicon(document, url);

    return {
      title,
      description,
      summary,
      fullText: content,
      keywords,
      favicon,
      wordCount,
      readingTime
    };
  }

  /**
   * Validate that a URL can be accessed for content extraction
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Try a HEAD request first
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      
      return contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
    } catch {
      return false;
    }
  }
}

// Singleton instance
let contentExtractor: ContentExtractor | null = null;

export function getContentExtractor(): ContentExtractor {
  if (!contentExtractor) {
    contentExtractor = new ContentExtractor();
  }
  return contentExtractor;
}