import { useState, useEffect } from 'preact/hooks';
import { getBookmarkService } from '../services/bookmarkService';
import type { Bookmark } from '../types';

export function useBookmarks(userId?: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookmarkService = getBookmarkService();

  const loadBookmarks = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userBookmarks = await bookmarkService.getUserBookmarks(userId);
      setBookmarks(userBookmarks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  };

  const createBookmark = async (bookmarkData: any) => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newBookmark = await bookmarkService.createBookmark(bookmarkData, userId);
      setBookmarks(prev => [newBookmark, ...prev]);
      return newBookmark;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bookmark');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookmark = async (bookmarkData: any) => {
    if (!userId) return;
    
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmarkData, userId);
      setBookmarks(prev => 
        prev.map(b => b.id === updatedBookmark.id ? updatedBookmark : b)
      );
      return updatedBookmark;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
      throw err;
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    if (!userId) return;
    
    try {
      await bookmarkService.deleteBookmark(bookmarkId, userId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
      throw err;
    }
  };

  const searchBookmarks = async (query: string, filters?: any) => {
    if (!userId) return { hits: [], nbHits: 0 };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await bookmarkService.searchBookmarks(query, userId, filters);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search bookmarks');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadBookmarks();
    }
  }, [userId]);

  return {
    bookmarks,
    isLoading,
    error,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    searchBookmarks,
    loadBookmarks
  };
}