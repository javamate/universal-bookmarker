import { getAlgoliaService } from './algolia';
import { getContentExtractor } from './contentExtractor';
import { getEncryptionService } from './encryptionService';
import type { Bookmark, ContentExtractionResult } from '../types';

export interface CreateBookmarkData {
  name: string;
  url: string;
  categories?: string[];
  tags?: string[];
  extractContent?: boolean;
  encryptionKey?: string;
  customContent?: Partial<ContentExtractionResult>;
}

export interface UpdateBookmarkData extends Partial<CreateBookmarkData> {
  id: string;
}

export class BookmarkService {
  private algoliaService = getAlgoliaService();
  private contentExtractor = getContentExtractor();
  private encryptionService = getEncryptionService();

  /**
   * Create a new bookmark
   */
  async createBookmark(
    data: CreateBookmarkData,
    userId: string
  ): Promise<Bookmark> {
    const now = Date.now();
    
    // Extract content if requested
    let content: ContentExtractionResult;
    if (data.customContent) {
      content = {
        title: data.customContent.title || data.name,
        description: data.customContent.description || '',
        summary: data.customContent.summary || '',
        fullText: data.customContent.fullText || '',
        keywords: data.customContent.keywords || [],
        favicon: data.customContent.favicon,
        wordCount: data.customContent.wordCount || 0,
        readingTime: data.customContent.readingTime || 0
      };
    } else if (data.extractContent !== false) {
      try {
        content = await this.contentExtractor.extractFromUrl(data.url);
      } catch (error) {
        console.warn('Failed to extract content, using basic data:', error);
        content = {
          title: data.name,
          description: '',
          summary: '',
          fullText: '',
          keywords: [],
          wordCount: 0,
          readingTime: 0
        };
      }
    } else {
      content = {
        title: data.name,
        description: '',
        summary: '',
        fullText: '',
        keywords: [],
        wordCount: 0,
        readingTime: 0
      };
    }

    const bookmark: Bookmark = {
      id: this.generateId(),
      name: data.name,
      url: data.url,
      categories: data.categories || [],
      tags: data.tags || [],
      content,
      metadata: {
        createdAt: now,
        updatedAt: now,
        favicon: content.favicon,
        lastVisited: now
      },
      privacy: {
        isEncrypted: !!data.encryptionKey
      },
      userId
    };

    // Prepare for storage with encryption if needed
    const { bookmark: preparedBookmark } = this.encryptionService.prepareBookmarkForStorage(
      bookmark,
      data.encryptionKey
    );

    // Save to Algolia
    await this.algoliaService.saveBookmark(preparedBookmark);

    return bookmark;
  }

  /**
   * Update an existing bookmark
   */
  async updateBookmark(
    data: UpdateBookmarkData,
    userId: string
  ): Promise<Bookmark> {
    const existingBookmark = await this.getBookmark(data.id, userId);
    if (!existingBookmark) {
      throw new Error('Bookmark not found');
    }

    const updatedBookmark: Bookmark = {
      ...existingBookmark,
      ...data,
      metadata: {
        ...existingBookmark.metadata,
        updatedAt: Date.now()
      }
    };

    // Save to Algolia
    await this.algoliaService.saveBookmark(updatedBookmark);

    return updatedBookmark;
  }

  /**
   * Get a single bookmark by ID
   */
  async getBookmark(
    id: string, 
    userId: string, 
    encryptionKey?: string
  ): Promise<Bookmark | null> {
    const bookmark = await this.algoliaService.getBookmark(id, userId);
    
    if (!bookmark) {
      return null;
    }

    // Decrypt if necessary
    if (bookmark.privacy?.isEncrypted && encryptionKey) {
      try {
        return await this.encryptionService.retrieveBookmarkWithDecryption(
          bookmark,
          encryptionKey
        );
      } catch (error) {
        console.error('Failed to decrypt bookmark:', error);
        throw new Error('Invalid encryption key');
      }
    }

    return bookmark;
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(id: string, userId: string): Promise<void> {
    await this.algoliaService.deleteBookmark(id, userId);
  }

  /**
   * Get all bookmarks for a user
   */
  async getUserBookmarks(
    userId: string, 
    encryptionKey?: string,
    limit = 1000
  ): Promise<Bookmark[]> {
    const bookmarks = await this.algoliaService.getUserBookmarks(userId, limit);

    if (!encryptionKey) {
      return bookmarks;
    }

    // Decrypt encrypted bookmarks
    const decryptedBookmarks = await Promise.allSettled(
      bookmarks.map(bookmark => {
        if (bookmark.privacy?.isEncrypted) {
          return this.encryptionService.retrieveBookmarkWithDecryption(bookmark, encryptionKey);
        }
        return bookmark;
      })
    );

    return decryptedBookmarks
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<Bookmark>).value);
  }

  /**
   * Search bookmarks
   */
  async searchBookmarks(
    query: string,
    userId: string,
    options: {
      categories?: string[];
      tags?: string[];
      page?: number;
      hitsPerPage?: number;
    } = {},
    encryptionKey?: string
  ) {
    const searchQuery = {
      query,
      filters: {
        categories: options.categories,
        tags: options.tags
      },
      page: options.page || 0,
      hitsPerPage: options.hitsPerPage || 20
    };

    const results = await this.algoliaService.searchBookmarks(searchQuery, userId);

    // Decrypt encrypted bookmarks if key provided
    let processedHits = results.hits;
    if (encryptionKey) {
      const decryptedHits = await Promise.allSettled(
        results.hits.map(bookmark => {
          if (bookmark.privacy?.isEncrypted) {
            return this.encryptionService.retrieveBookmarkWithDecryption(bookmark, encryptionKey);
          }
          return bookmark;
        })
      );

      processedHits = decryptedHits
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<Bookmark>).value);
    }

    return {
      ...results,
      hits: processedHits
    };
  }

  /**
   * Create a bookmark from current page (Chrome extension context)
   */
  async createBookmarkFromCurrentPage(
    categories: string[] = [],
    tags: string[] = [],
    encryptionKey?: string
  ): Promise<Bookmark> {
    if (typeof window === 'undefined') {
      throw new Error('This method can only be called in a browser context');
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const url = window.location.href;
    const title = document.title;
    
    const content = await this.contentExtractor.extractFromCurrentPage();

    return this.createBookmark({
      name: title,
      url,
      categories,
      tags,
      extractContent: false, // Already extracted
      customContent: content,
      encryptionKey
    }, userId);
  }

  /**
   * Import bookmarks from browser bookmarks
   */
  async importBrowserBookmarks(
    bookmarks: any[], // Generic browser bookmark type
    userId: string,
    encryptionKey?: string
  ): Promise<Bookmark[]> {
    const importedBookmarks: Bookmark[] = [];

    for (const bookmark of bookmarks) {
      if (bookmark.url) {
        try {
          const categories = this.getBookmarkPath(bookmark);
          const newBookmark = await this.createBookmark({
            name: bookmark.title || bookmark.url,
            url: bookmark.url,
            categories,
            encryptionKey
          }, userId);
          
          importedBookmarks.push(newBookmark);
        } catch (error) {
          console.error('Failed to import bookmark:', bookmark.url, error);
        }
      }

      // Recursively import children
      if (bookmark.children) {
        const childBookmarks = await this.importBrowserBookmarks(
          bookmark.children,
          userId,
          encryptionKey
        );
        importedBookmarks.push(...childBookmarks);
      }
    }

    return importedBookmarks;
  }

  /**
   * Export bookmarks to browser format
   */
  exportBookmarks(bookmarks: Bookmark[]): any[] {
    const tree: any[] = [];
    const categoryMap = new Map<string, any>();

    // Create category structure first
    bookmarks.forEach(bookmark => {
      bookmark.categories.forEach((category, index) => {
        const path = bookmark.categories.slice(0, index + 1);
        const pathKey = path.join('/');
        
        if (!categoryMap.has(pathKey)) {
          const categoryNode: any = {
            id: `category_${pathKey}`,
            title: category,
            children: []
          };
          categoryMap.set(pathKey, categoryNode);

          // Add to parent or root
          if (index === 0) {
            tree.push(categoryNode);
          } else {
            const parentPath = bookmark.categories.slice(0, index).join('/');
            const parent = categoryMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(categoryNode);
            }
          }
        }
      });
    });

    // Add bookmarks to categories
    bookmarks.forEach(bookmark => {
      const bookmarkNode: any = {
        id: bookmark.id,
        title: bookmark.name,
        url: bookmark.url
      };

      if (bookmark.categories.length > 0) {
        const lastCategoryPath = bookmark.categories.join('/');
        const category = categoryMap.get(lastCategoryPath);
        if (category && category.children) {
          category.children.push(bookmarkNode);
        } else {
          tree.push(bookmarkNode);
        }
      } else {
        tree.push(bookmarkNode);
      }
    });

    return tree;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get current user ID from storage (extension context)
   */
  private async getCurrentUserId(): Promise<string | null> {
    if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
      // Chrome extension context
      return new Promise((resolve) => {
        (window as any).chrome.storage.local.get(['userAuth'], (result: any) => {
          resolve(result.userAuth?.userId || null);
        });
      });
    } else if (typeof localStorage !== 'undefined') {
      // Web app context
      const authData = localStorage.getItem('userAuth');
      return authData ? JSON.parse(authData).userId : null;
    }
    
    return null;
  }

  /**
   * Extract category path from bookmark tree node
   */
  private getBookmarkPath(_bookmark: any): string[] {
    const path: string[] = [];
    
    // This would need to be implemented based on how we track the path
    // For now, return empty array
    return path;
  }

  /**
   * Batch delete bookmarks
   */
  async batchDeleteBookmarks(bookmarkIds: string[], userId: string): Promise<void> {
    await this.algoliaService.batchDeleteBookmarks(bookmarkIds, userId);
  }

  /**
   * Get bookmark statistics
   */
  async getBookmarkStats(userId: string): Promise<{
    total: number;
    encrypted: number;
    withContent: number;
    categories: number;
    topCategories: Array<{ name: string; count: number }>;
  }> {
    const bookmarks = await this.getUserBookmarks(userId);
    
    const encrypted = bookmarks.filter(b => b.privacy?.isEncrypted).length;
    const withContent = bookmarks.filter(b => 
      b.content.summary.length > 0 || (b.content.fullText && b.content.fullText.length > 0)
    ).length;
    
    const categoryCounts = new Map<string, number>();
    bookmarks.forEach(bookmark => {
      bookmark.categories.forEach(category => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    });

    const topCategories = Array.from(categoryCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      total: bookmarks.length,
      encrypted,
      withContent,
      categories: categoryCounts.size,
      topCategories
    };
  }
}

// Singleton instance
let bookmarkService: BookmarkService | null = null;

export function getBookmarkService(): BookmarkService {
  if (!bookmarkService) {
    bookmarkService = new BookmarkService();
  }
  return bookmarkService;
}