import { useState } from 'preact/hooks';
import type { Bookmark } from '../types';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onBookmarkSelect?: (bookmark: Bookmark) => void;
  onBookmarkEdit?: (bookmark: Bookmark) => void;
  onBookmarkDelete?: (bookmarkId: string) => void;
  isLoading?: boolean;
}

export function BookmarkList({ 
  bookmarks, 
  onBookmarkSelect, 
  onBookmarkEdit, 
  onBookmarkDelete, 
  isLoading = false 
}: BookmarkListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category'>('date');

  // Filter and sort bookmarks
  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          bookmark.name.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query) ||
          bookmark.tags.some(tag => tag.toLowerCase().includes(query)) ||
          bookmark.categories.some(cat => cat.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory) {
        return bookmark.categories.includes(selectedCategory);
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.metadata.updatedAt - a.metadata.updatedAt;
        case 'category':
          return (a.categories[0] || '').localeCompare(b.categories[0] || '');
        default:
          return 0;
      }
    });

  // Get unique categories from bookmarks
  const categories = Array.from(
    new Set(bookmarks.flatMap(bookmark => bookmark.categories))
  ).sort();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="bookmark-list loading">
        <div className="loading-spinner"></div>
        <p>Loading bookmarks...</p>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bookmark-list empty">
        <div className="empty-state">
          <h3>No bookmarks yet</h3>
          <p>Start by adding your first bookmark to organize your web content.</p>
        </div>
      </div>
    );
  }

  if (filteredBookmarks.length === 0) {
    return (
      <div className="bookmark-list no-results">
        <div className="no-results-state">
          <h3>No bookmarks found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookmark-list">
      {/* Filters and search */}
      <div className="list-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory((e.target as HTMLSelectElement).value)}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy((e.target as HTMLSelectElement).value as any)}
            className="sort-select"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        {filteredBookmarks.length} of {bookmarks.length} bookmarks
      </div>

      {/* Bookmark items */}
      <div className="bookmark-items">
        {filteredBookmarks.map(bookmark => (
          <div key={bookmark.id} className="bookmark-item">
            <div className="bookmark-header">
              <h3 className="bookmark-title">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onBookmarkSelect?.(bookmark)}
                  className="bookmark-link"
                >
                  {bookmark.name}
                </a>
              </h3>
              
              <div className="bookmark-actions">
                <button
                  onClick={() => onBookmarkEdit?.(bookmark)}
                  className="btn-icon edit-btn"
                  title="Edit bookmark"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onBookmarkDelete?.(bookmark.id)}
                  className="btn-icon delete-btn"
                  title="Delete bookmark"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="bookmark-url">
              <span className="domain">{getDomainFromUrl(bookmark.url)}</span>
              <span className="url">{bookmark.url}</span>
            </div>

            {bookmark.content.description && (
              <p className="bookmark-description">
                {bookmark.content.description}
              </p>
            )}

            {bookmark.content.summary && (
              <p className="bookmark-summary">
                {bookmark.content.summary}
              </p>
            )}

            <div className="bookmark-meta">
              <div className="categories">
                {bookmark.categories.map(category => (
                  <span key={category} className="category-tag">
                    {category}
                  </span>
                ))}
              </div>

              <div className="tags">
                {bookmark.tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>

              {bookmark.privacy?.isEncrypted && (
                <span className="encrypted-badge" title="Encrypted bookmark">
                  🔒
                </span>
              )}

              <span className="date">
                {formatDate(bookmark.metadata.updatedAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}