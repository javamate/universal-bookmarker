import { useState, useEffect } from 'preact/hooks';
import { BookmarkForm } from './components/BookmarkForm';
import { BookmarkList } from './components/BookmarkList';
import type { Bookmark } from './types';
import './styles/app.css';

export function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');

  // Load initial data
  useEffect(() => {
    // Mock loading bookmarks - in real app this would call the service
    const mockBookmarks: Bookmark[] = [
      {
        id: '1',
        name: 'Preact Documentation',
        url: 'https://preactjs.com/guide/v10/getting-started',
        categories: ['Development', 'JavaScript', 'Preact'],
        tags: ['documentation', 'react', 'frontend'],
        content: {
          title: 'Getting Started - Preact',
          description: 'Learn how to get started with Preact',
          summary: 'Comprehensive guide to setting up and using Preact',
          keywords: ['preact', 'javascript', 'react', 'frontend']
        },
        metadata: {
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 86400000,
          favicon: 'https://preactjs.com/favicon.ico'
        },
        privacy: {
          isEncrypted: false
        },
        userId: 'demo-user'
      },
      {
        id: '2',
        name: 'Algolia Search Documentation',
        url: 'https://www.algolia.com/doc/',
        categories: ['Development', 'Search', 'API'],
        tags: ['search', 'algolia', 'api', 'documentation'],
        content: {
          title: 'Algolia Documentation',
          description: 'Build amazing search experiences with Algolia',
          summary: 'Complete documentation for Algolia search API and implementation',
          keywords: ['algolia', 'search', 'api', 'documentation']
        },
        metadata: {
          createdAt: Date.now() - 172800000,
          updatedAt: Date.now() - 172800000,
          favicon: 'https://www.algolia.com/favicon.ico'
        },
        privacy: {
          isEncrypted: false
        },
        userId: 'demo-user'
      }
    ];

    setBookmarks(mockBookmarks);
  }, []);

  const handleBookmarkCreated = (bookmark: Bookmark) => {
    setBookmarks(prev => [bookmark, ...prev]);
    setCurrentView('list');
  };

  const handleBookmarkEdit = (bookmark: Bookmark) => {
    // In a real app, this would open an edit form
    console.log('Edit bookmark:', bookmark);
  };

  const handleBookmarkDelete = async (bookmarkId: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    }
  };

  const handleBookmarkSelect = (bookmark: Bookmark) => {
    // Open bookmark in new tab
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔖 Universal Bookmarker</h1>
        <p>Organize and search your bookmarks across platforms</p>
      </header>

      <nav className="app-nav">
        <button
          onClick={() => setCurrentView('list')}
          className={`nav-btn ${currentView === 'list' ? 'active' : ''}`}
        >
          📚 My Bookmarks
        </button>
        <button
          onClick={() => setCurrentView('form')}
          className={`nav-btn ${currentView === 'form' ? 'active' : ''}`}
        >
          ➕ Add Bookmark
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'form' ? (
          <div className="form-section">
            <h2>Add New Bookmark</h2>
            <BookmarkForm
              onBookmarkCreated={handleBookmarkCreated}
            />
          </div>
        ) : (
          <div className="list-section">
            <div className="section-header">
              <h2>My Bookmarks</h2>
              <button
                onClick={() => setCurrentView('form')}
                className="btn-primary"
              >
                ➕ Add Bookmark
              </button>
            </div>
            <BookmarkList
              bookmarks={bookmarks}
              onBookmarkSelect={handleBookmarkSelect}
              onBookmarkEdit={handleBookmarkEdit}
              onBookmarkDelete={handleBookmarkDelete}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Universal Bookmarker © 2025 | Built with Preact & Algolia</p>
      </footer>
    </div>
  );
}
