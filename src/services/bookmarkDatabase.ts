import { supabase } from './supabaseClient';

export interface BookmarkData {
  name: string;
  url: string;
  content?: Record<string, any>;
  categories?: string[];
  tags?: string[];
  privacy?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function createBookmark(userId: string, data: BookmarkData) {
  try {
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        name: data.name,
        url: data.url,
        content: data.content || {},
        categories: data.categories || [],
        tags: data.tags || [],
        privacy: data.privacy || {},
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return bookmark;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create bookmark');
  }
}

export async function updateBookmark(bookmarkId: string, userId: string, data: Partial<BookmarkData>) {
  try {
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return bookmark;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update bookmark');
  }
}

export async function deleteBookmark(bookmarkId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete bookmark');
  }
}

export async function getBookmark(bookmarkId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch bookmark');
  }
}

export async function getUserBookmarks(userId: string, limit = 100, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch bookmarks');
  }
}

export async function searchBookmarks(userId: string, query: string, filters?: {
  categories?: string[];
  tags?: string[];
}) {
  try {
    let queryBuilder = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId);

    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,url.ilike.%${query}%`
      );
    }

    if (filters?.categories?.length) {
      queryBuilder = queryBuilder.contains('categories', filters.categories);
    }

    if (filters?.tags?.length) {
      queryBuilder = queryBuilder.contains('tags', filters.tags);
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to search bookmarks');
  }
}

export async function getBookmarksByCategory(userId: string, category: string) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .contains('categories', [category])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch bookmarks');
  }
}

export async function getBookmarksByTag(userId: string, tag: string) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch bookmarks');
  }
}

export async function deleteMultipleBookmarks(bookmarkIds: string[], userId: string) {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .in('id', bookmarkIds);

    if (error) throw error;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete bookmarks');
  }
}
