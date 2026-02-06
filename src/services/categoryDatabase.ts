import { supabase } from './supabaseClient';

export interface CategoryData {
  name: string;
  color?: string;
  icon?: string;
  parent_id?: string | null;
  order?: number;
}

export async function createCategory(userId: string, data: CategoryData) {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: data.name,
        color: data.color || '#007bff',
        icon: data.icon || '📁',
        parent_id: data.parent_id || null,
        order: data.order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return category;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create category');
  }
}

export async function updateCategory(categoryId: string, userId: string, data: Partial<CategoryData>) {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return category;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update category');
  }
}

export async function deleteCategory(categoryId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete category');
  }
}

export async function getCategory(categoryId: string, userId: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch category');
  }
}

export async function getUserCategories(userId: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch categories');
  }
}

export async function getRootCategories(userId: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .is('parent_id', null)
      .order('order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch root categories');
  }
}

export async function getChildCategories(userId: string, parentId: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_id', parentId)
      .order('order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch child categories');
  }
}

export async function buildCategoryTree(userId: string) {
  try {
    const allCategories = await getUserCategories(userId);

    const buildTree = (parentId: string | null = null): any[] => {
      return allCategories
        .filter((cat) => (cat.parent_id === null ? parentId === null : cat.parent_id === parentId))
        .sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        })
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };

    return buildTree();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to build category tree');
  }
}

export async function reorderCategories(categoryId: string, userId: string, newOrder: number) {
  try {
    const { error } = await supabase
      .from('categories')
      .update({
        order: newOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to reorder category');
  }
}
