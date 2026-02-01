export interface User {
  id: string;
  email: string;
  settings: UserSettings;
  algoliaConfig: UserAlgoliaConfig;
  createdAt: number;
  updatedAt: number;
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
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    itemsPerPage: number;
  };
}

export interface UserAlgoliaConfig {
  appId: string;
  apiKey: string;
  indexPrefix: string;
  permissions: string[];
}

export interface UserRegistration {
  email: string;
  password: string;
  algoliaConfig?: {
    existingAppId?: string;
    existingApiKey?: string;
  };
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserSession {
  user: User;
  token: string;
  expiresAt: number;
}