export interface Bookmark {
  id: string;
  name: string;
  url: string;
  categories: string[]; // Nested: ["tech", "javascript", "react"]
  tags: string[];
  content: {
    title: string;
    description: string;
    summary: string;
    fullText?: string; // User-configurable
    keywords: string[];
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    favicon?: string;
    screenshot?: string;
    lastVisited?: number;
  };
  privacy: {
    isEncrypted: boolean;
    encryptionKey?: string;
  };
  userId: string;
}

export interface UserSettings {
  contentExtraction: 'summary' | 'full' | 'custom';
  offlineStorage: {
    nameAndUrl: boolean;
    categories: boolean;
    tags: boolean;
    metadata: boolean;
  };
  defaultEncryption: boolean;
  searchOptions: {
    enableFuzzySearch: boolean;
    enableTypoTolerance: boolean;
    minQueryLength: number;
  };
}

export interface ContentExtractionResult {
  title: string;
  description: string;
  summary: string;
  fullText: string;
  keywords: string[];
  favicon?: string;
  language?: string;
  wordCount: number;
  readingTime: number;
}

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  isEncrypted?: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
  contentLength?: {
    min: number;
    max: number;
  };
}

export interface SearchResult {
  bookmark: Bookmark;
  highlights: {
    name?: string;
    content?: string;
    categories?: string;
    tags?: string;
  };
  relevanceScore: number;
}