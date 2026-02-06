import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../services/supabaseClient';
import { getUserCategories, createCategory, deleteCategory } from '../services/categoryDatabase';
import '../styles/categories.css';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#007bff');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📁');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const cats = await getUserCategories(user.id);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCreateCategory = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newCat = await createCategory(user.id, {
        name: newCategoryName,
        color: newCategoryColor,
        icon: newCategoryIcon,
      });

      setCategories([...categories, newCat]);
      setNewCategoryName('');
      setNewCategoryColor('#007bff');
      setNewCategoryIcon('📁');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };


  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Bookmarks in this category will not be affected.')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await deleteCategory(id, user.id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  if (isLoading) {
    return (
      <div className="categories-page loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const colors = [
    '#007bff', '#0066cc', '#6c757d', '#28a745',
    '#dc3545', '#fd7e14', '#ffc107', '#17a2b8',
  ];

  const icons = ['📁', '📚', '💼', '🎨', '🔧', '⚙️', '📊', '🎯'];

  return (
    <div className="categories-page">
      <div className="categories-header">
        <h1>Categories</h1>
        <p>Organize your bookmarks into categories</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="categories-grid">
        <div className="category-section create-section">
          <h2>Create New Category</h2>
          <form onSubmit={handleCreateCategory} className="create-form">
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName((e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-btn ${newCategoryIcon === icon ? 'active' : ''}`}
                      onClick={() => setNewCategoryIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-btn ${newCategoryColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategoryColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Create Category
            </button>
          </form>
        </div>

        <div className="category-section list-section">
          <h2>Your Categories ({categories.length})</h2>
          {categories.length > 0 ? (
            <div className="categories-list">
              {categories.map((category) => (
                <div key={category.id} className="category-card">
                  <div className="category-display">
                    <span className="category-icon" style={{ fontSize: '24px' }}>
                      {category.icon}
                    </span>
                    <div className="category-info">
                      <div className="category-name">{category.name}</div>
                      <div
                        className="category-color"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                  </div>

                  <div className="category-actions">
                    <button
                      className="btn-icon delete-btn"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No categories yet. Create one to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
}
