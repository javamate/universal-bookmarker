// @ts-ignore
import algoliasearch from 'algoliasearch/lite';
import type { 
  AlgoliaConfig, 
  SearchQuery, 
  SearchResponse, 
  Bookmark, 
  Category, 
  User 
} from '../types';

export class AlgoliaService {
  private client: any;
  private config: AlgoliaConfig;

  constructor(config: AlgoliaConfig) {
    this.config = config;
    this.client = algoliasearch(config.appId, config.apiKey);
  }

  // Index management
  private getBookmarksIndex(userId: string): any {
    const indexName = `${this.config.bookmarksIndexName}_${userId}`;
    return this.client.initIndex(indexName);
  }

  private getCategoriesIndex(userId: string): any {
    const indexName = `${this.config.categoriesIndexName}_${userId}`;
    return this.client.initIndex(indexName);
  }

  private getUsersIndex(): any {
    return this.client.initIndex(this.config.usersIndexName);
  }

  // Bookmark operations
  async saveBookmark(bookmark: Bookmark): Promise<void> {
    const index = this.getBookmarksIndex(bookmark.userId);
    await index.saveObject(bookmark);
  }

  async getBookmark(id: string, userId: string): Promise<Bookmark | null> {
    const index = this.getBookmarksIndex(userId);
    try {
      return await index.getObject(id) as Bookmark;
    } catch (error) {
      return null;
    }
  }

  async deleteBookmark(id: string, userId: string): Promise<void> {
    const index = this.getBookmarksIndex(userId);
    await index.deleteObject(id);
  }

  async searchBookmarks(query: SearchQuery, userId: string): Promise<SearchResponse<Bookmark>> {
    const index = this.getBookmarksIndex(userId);
    
    const searchParams = {
      query: query.query || '',
      page: query.page || 0,
      hitsPerPage: query.hitsPerPage || 20,
      facets: query.facets || ['categories', 'tags'],
      ...(query.filters && {
        filters: this.buildFilters(query.filters)
      }),
      ...(query.sorting && {
        ranking: this.getSortingRanking(query.sorting)
      })
    };

    return await index.search(searchParams.query, searchParams);
  }

  async getUserBookmarks(userId: string, limit = 1000): Promise<Bookmark[]> {
    const index = this.getBookmarksIndex(userId);
    const result = await index.search('', {
      hitsPerPage: limit,
      attributesToRetrieve: ['id', 'name', 'url', 'categories', 'tags', 'metadata.updatedAt']
    });
    return result.hits as Bookmark[];
  }

  // Category operations
  async saveCategory(category: Category): Promise<void> {
    const index = this.getCategoriesIndex(category.userId);
    await index.saveObject(category);
  }

  async getCategories(userId: string): Promise<Category[]> {
    const index = this.getCategoriesIndex(userId);
    const result = await index.search('', {
      hitsPerPage: 1000
    });
    return result.hits as Category[];
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    const index = this.getCategoriesIndex(userId);
    await index.deleteObject(id);
  }

  // User operations
  async saveUser(user: User): Promise<void> {
    const index = this.getUsersIndex();
    await index.saveObject(user);
  }

  async getUser(userId: string): Promise<User | null> {
    const index = this.getUsersIndex();
    try {
      return await index.getObject(userId) as User;
    } catch (error) {
      return null;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const index = this.getUsersIndex();
    const result = await index.search(email, {
      restrictSearchableAttributes: ['email'],
      hitsPerPage: 1
    });
    
    return result.hits.length > 0 ? result.hits[0] as User : null;
  }

  // Index setup
  async setupUserIndices(userId: string): Promise<void> {
    const adminClient = algoliasearch(this.config.appId, this.config.adminApiKey);
    
    const bookmarksIndex = adminClient.initIndex(`${this.config.bookmarksIndexName}_${userId}`);
    const categoriesIndex = adminClient.initIndex(`${this.config.categoriesIndexName}_${userId}`);

    // Configure bookmarks index
    // @ts-ignore
    await bookmarksIndex.setSettings({
      searchableAttributes: ['name', 'url', 'content.title', 'content.description', 'content.summary', 'content.fullText', 'tags', 'categories'],
      attributesForFaceting: ['categories', 'tags', 'privacy.isEncrypted'],
      ranking: ['typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'],
      customRanking: ['desc(metadata.updatedAt)', 'desc(metadata.createdAt)'],
      attributesToHighlight: ['name', 'content.title', 'content.description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      snippetEllipsisText: '…',
      typoTolerance: 'min',
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 6
    });

    // Configure categories index
    // @ts-ignore
    await categoriesIndex.setSettings({
      searchableAttributes: ['name', 'path'],
      attributesForFaceting: ['parentId'],
      ranking: ['typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'],
      customRanking: ['asc(name)', 'asc(createdAt)']
    });
  }

  // Helper methods
  private buildFilters(filters: any): string {
    const filterConditions: string[] = [];

    if (filters.categories && filters.categories.length > 0) {
      const categoryFilters = filters.categories.map((cat: string) => `categories:"${cat}"`);
      filterConditions.push(`(${categoryFilters.join(' OR ')})`);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagFilters = filters.tags.map((tag: string) => `tags:"${tag}"`);
      filterConditions.push(`(${tagFilters.join(' OR ')})`);
    }

    if (typeof filters.isEncrypted === 'boolean') {
      filterConditions.push(`privacy.isEncrypted:${filters.isEncrypted}`);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filterConditions.push(`metadata.createdAt >= ${start} AND metadata.createdAt <= ${end}`);
    }

    return filterConditions.join(' AND ');
  }

  private getSortingRanking(sorting: string): string[] {
    switch (sorting) {
      case 'date_asc':
        return ['asc(metadata.createdAt)'];
      case 'date_desc':
        return ['desc(metadata.createdAt)'];
      case 'name_asc':
        return ['asc(name)'];
      case 'name_desc':
        return ['desc(name)'];
      default:
        return ['typo', 'geo', 'words', 'filters', 'proximity', 'attribute', 'exact', 'custom'];
    }
  }

  // Batch operations
  async batchSaveBookmarks(bookmarks: Bookmark[]): Promise<void> {
    if (bookmarks.length === 0) return;

    const userId = bookmarks[0].userId;
    const index = this.getBookmarksIndex(userId);
    
    await index.saveObjects(bookmarks);
  }

  async batchDeleteBookmarks(bookmarkIds: string[], userId: string): Promise<void> {
    if (bookmarkIds.length === 0) return;

    const index = this.getBookmarksIndex(userId);
    await index.deleteObjects(bookmarkIds);
  }
}

// Singleton instance
let algoliaService: AlgoliaService | null = null;

export function getAlgoliaService(): AlgoliaService {
  if (!algoliaService) {
    const config: AlgoliaConfig = {
      appId: import.meta.env.VITE_ALGOLIA_APP_ID,
      apiKey: import.meta.env.VITE_ALGOLIA_API_KEY,
      adminApiKey: import.meta.env.VITE_ALGOLIA_ADMIN_API_KEY,
      bookmarksIndexName: 'bookmarks',
      categoriesIndexName: 'categories',
      usersIndexName: 'users'
    };

    if (!config.appId || !config.apiKey) {
      throw new Error('Algolia configuration missing. Please check your environment variables.');
    }

    algoliaService = new AlgoliaService(config);
  }
  return algoliaService;
}