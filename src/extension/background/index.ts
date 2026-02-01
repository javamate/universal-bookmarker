// Background service worker for Chrome extension

// @ts-ignore
import { getBookmarkService } from '../../services/bookmarkService';
// @ts-ignore  
import type { ChromeExtensionMessage, ExtensionStorage } from '../../types';

// Extend Chrome types
declare const chrome: any;

// Initialize storage with defaults
async function initializeStorage() {
  const defaultStorage: Partial<ExtensionStorage> = {
    settings: {
      algoliaAppId: '',
      algoliaApiKey: '',
      defaultExtractionMode: 'summary',
      defaultEncryption: false,
      autoSync: true,
      notificationEnabled: true
    },
    offlineBookmarks: [],
    categories: [],
    userAuth: null
  };

  const current = await chrome.storage.local.get();
  const merged = { ...defaultStorage, ...current };
  
  if (JSON.stringify(current) !== JSON.stringify(merged)) {
    await chrome.storage.local.set(merged);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  await initializeStorage();
  
  if (details.reason === 'install') {
    // Show welcome page or options
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  async (message: ChromeExtensionMessage, sender, sendResponse) => {
    try {
      switch (message.type) {
        case 'EXTRACT_CONTENT':
          await handleExtractContent(sender.tab?.id);
          break;
          
        case 'SAVE_BOOKMARK':
          await handleSaveBookmark(message.payload);
          sendResponse({ success: true });
          break;
          
        case 'GET_CATEGORIES':
          const categories = await handleGetCategories();
          sendResponse({ success: true, data: categories });
          break;
          
        case 'SEARCH_BOOKMARKS':
          const searchResults = await handleSearchBookmarks(message.payload);
          sendResponse({ success: true, data: searchResults });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    return true; // Keep message channel open for async response
  }
);

// Extract content from the active tab
async function handleExtractContent(tabId?: number) {
  if (!tabId) {
    throw new Error('No active tab found');
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
  } catch (error) {
    console.error('Failed to extract content:', error);
    throw new Error('Failed to extract page content');
  }
}

// Save bookmark to storage and sync
async function handleSaveBookmark(payload: any) {
  const bookmarkService = getBookmarkService();
  const storage = await chrome.storage.local.get(['userAuth']);
  
  if (!storage.userAuth) {
    throw new Error('User not authenticated');
  }

  const bookmark = await bookmarkService.createBookmark({
    ...payload,
    userId: storage.userAuth.userId
  });

  // Store locally for offline access
  const offlineBookmark = {
    id: bookmark.id,
    name: bookmark.name,
    url: bookmark.url,
    categories: bookmark.categories,
    tags: bookmark.tags,
    isEncrypted: bookmark.privacy?.isEncrypted || false,
    cachedAt: Date.now()
  };

  const currentOffline = await chrome.storage.local.get(['offlineBookmarks']);
  const updatedOffline = [...(currentOffline.offlineBookmarks || []), offlineBookmark];
  await chrome.storage.local.set({ offlineBookmarks: updatedOffline });

  // Show notification if enabled
  const settings = await chrome.storage.local.get(['settings']);
  if (settings.settings?.notificationEnabled) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Bookmark Saved',
      message: `"${bookmark.name}" has been saved to your bookmarks`
    });
  }

  return bookmark;
}

// Get categories for user
async function handleGetCategories() {
  const storage = await chrome.storage.local.get(['categories', 'userAuth']);
  
  if (!storage.userAuth) {
    throw new Error('User not authenticated');
  }

  // Return cached categories for now
  return storage.categories || [];
}

// Search bookmarks
async function handleSearchBookmarks(payload: { query: string }) {
  const storage = await chrome.storage.local.get(['offlineBookmarks', 'userAuth']);
  
  if (!storage.userAuth) {
    throw new Error('User not authenticated');
  }

  // Simple local search for offline bookmarks
  const bookmarks = storage.offlineBookmarks || [];
  const query = payload.query.toLowerCase();
  
  const results = bookmarks.filter((bookmark: any) => 
    bookmark.name.toLowerCase().includes(query) ||
    bookmark.url.toLowerCase().includes(query) ||
    (bookmark.tags && bookmark.tags.some((tag: string) => tag.toLowerCase().includes(query)))
  );

  return results;
}

// Content extraction function to be injected into pages
function extractPageContent() {
  const title = document.title;
  const url = window.location.href;
  
  // Extract description
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const description = descriptionMeta?.getAttribute('content') || '';
  
  // Extract keywords
  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  const keywords = keywordsMeta?.getAttribute('content')?.split(',') || [];
  
  // Extract main content
  const contentSelectors = [
    'main',
    '[role="main"]',
    'article',
    '.content',
    '.main-content',
    '#content'
  ];
  
  let contentElement = null;
  for (const selector of contentSelectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) break;
  }
  
  if (!contentElement) {
    contentElement = document.body;
  }
  
  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside'
  ];
  
  const clone = contentElement.cloneNode(true) as Element;
  unwantedSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  const textContent = clone.textContent || '';
  const wordCount = textContent.split(/\s+/).length;
  
  // Generate summary (first 200 characters)
  const summary = textContent.trim().substring(0, 200) + '...';
  
  return {
    title,
    url,
    description,
    keywords: keywords.map((k: string) => k.trim()),
    content: textContent.trim(),
    wordCount,
    summary
  };
}

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // React to storage changes if needed
    console.log('Storage changed:', changes);
  }
});

// Context menu for quick bookmarking
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-bookmark',
    title: 'Save to Universal Bookmarker',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-bookmark') {
    try {
      const content = await handleExtractContent(tab?.id);
      
      // Send to popup or show notification
      chrome.runtime.sendMessage({
        type: 'BOOKMARK_CONTENT_READY',
        payload: content
      });
    } catch (error) {
      console.error('Failed to save bookmark from context menu:', error);
    }
  }
});

// Auto-sync when online
chrome.runtime.onStartup.addListener(async () => {
  const storage = await chrome.storage.local.get(['settings', 'offlineBookmarks']);
  
  if (storage.settings?.autoSync && storage.offlineBookmarks?.length > 0) {
    // Sync offline bookmarks with Algolia when service starts
    console.log('Auto-syncing offline bookmarks...');
  }
});