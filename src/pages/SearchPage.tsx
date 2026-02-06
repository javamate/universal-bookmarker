import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../services/supabaseClient';
import { searchBookmarks } from '../services/bookmarkDatabase';
import '../styles/search.css';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('categories')
          .eq('user_id', user.id);

        if (!bookmarks) return;

        const cats = new Set<string>();
        bookmarks.forEach((b) => {
          b.categories.forEach((c: string) => cats.add(c));
        });

        setAvailableCategories(Array.from(cats).sort());
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  const handleSearch = async (e?: Event) => {
    if (e) {
      e.preventDefault();
    }

    if (!query.trim() && selectedCategories.length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const bookmarks = await searchBookmarks(user.id, query, {
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      });

      setResults(bookmarks);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClear = () => {
    setQuery('');
    setSelectedCategories([]);
    setResults([]);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Bookmarks</h1>
      </div>

      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by name, URL, or tags..."
              value={query}
              onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
              className="search-input"
            />
            <button
              type="submit"
              className="btn-search"
              disabled={isLoading}
            >
              {isLoading ? '🔍 Searching...' : '🔍 Search'}
            </button>
          </div>

          {availableCategories.length > 0 && (
            <div className="filter-categories">
              <label>Filter by Category:</label>
              <div className="category-filters">
                {availableCategories.map((category) => (
                  <label key={category} className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {(query || selectedCategories.length > 0) && (
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
            >
              Clear Search
            </button>
          )}
        </form>

        {results.length > 0 && (
          <div className="search-results">
            <div className="results-count">
              Found {results.length} bookmark{results.length !== 1 ? 's' : ''}
            </div>

            <div className="results-list">
              {results.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-item"
                >
                  <div className="result-title">{bookmark.name}</div>
                  <div className="result-url">{bookmark.url}</div>
                  {bookmark.content?.description && (
                    <div className="result-description">
                      {bookmark.content.description}
                    </div>
                  )}
                  <div className="result-meta">
                    {bookmark.categories.map((cat: string) => (
                      <span key={cat} className="meta-category">{cat}</span>
                    ))}
                    {bookmark.tags.map((tag: string) => (
                      <span key={tag} className="meta-tag">#{tag}</span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && !isLoading && (
          <div className="no-results">
            <p>No bookmarks found matching your search.</p>
            <p>Try using different keywords or adjusting your filters.</p>
          </div>
        )}

        {!query && selectedCategories.length === 0 && results.length === 0 && (
          <div className="empty-search">
            <p>Enter a search query to find your bookmarks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
