export interface ChromeExtensionMessage {
  type: 'EXTRACT_CONTENT' | 'SAVE_BOOKMARK' | 'GET_CATEGORIES' | 'SEARCH_BOOKMARKS';
  payload?: any;
}

export interface ExtensionStorage {
  settings: ExtensionSettings;
  offlineBookmarks: OfflineBookmark[];
  categories: StoredCategory[];
  userAuth: UserAuth;
}

export interface ExtensionSettings {
  algoliaAppId: string;
  algoliaApiKey: string;
  defaultExtractionMode: 'summary' | 'full';
  defaultEncryption: boolean;
  autoSync: boolean;
  notificationEnabled: boolean;
}

export interface OfflineBookmark {
  id: string;
  name: string;
  url: string;
  categories?: string[];
  tags?: string[];
  isEncrypted: boolean;
  cachedAt: number;
}

export interface StoredCategory {
  id: string;
  name: string;
  path: string[];
  parentId?: string;
}

export interface UserAuth {
  userId: string;
  email: string;
  token: string;
  expiresAt: number;
}