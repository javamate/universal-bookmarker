import type { SearchFilters } from './bookmark';

export interface AlgoliaConfig {
  appId: string;
  apiKey: string;
  adminApiKey: string;
  bookmarksIndexName: string;
  categoriesIndexName: string;
  usersIndexName: string;
}

export interface SearchQuery {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  hitsPerPage?: number;
  facets?: string[];
  sorting?: 'relevance' | 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc';
}

export interface SearchResponse<T> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
  facets?: Record<string, Record<string, number>>;
}

export interface IndexOperation {
  taskID: number;
  objectID?: string;
}

export interface IndexStats {
  entries: number;
  lastUpdate: number;
  dataSize: number;
}