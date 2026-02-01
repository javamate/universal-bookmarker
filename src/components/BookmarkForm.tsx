import { useState } from 'preact/hooks';
import type { Bookmark } from '../types';

interface CreateBookmarkData {
  name: string;
  url: string;
  categories: string[];
  tags: string[];
  extractContent: boolean;
  encryptionKey: string;
}

interface BookmarkFormProps {
  onBookmarkCreated: (bookmark: Bookmark) => void;
  initialData?: Partial<CreateBookmarkData>;
  isLoading?: boolean;
}

export function BookmarkForm({ onBookmarkCreated, initialData, isLoading = false }: BookmarkFormProps) {
  const [formData, setFormData] = useState<CreateBookmarkData>({
    name: '',
    url: '',
    categories: [],
    tags: [],
    extractContent: true,
    encryptionKey: '',
    ...initialData
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showEncryption, setShowEncryption] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Bookmark name is required';
    }

    if (!formData.url.trim()) {
      errors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        errors.url = 'Please enter a valid URL';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // This would normally call the bookmark service
      // For now, create a mock bookmark
      const bookmark: Bookmark = {
        id: Date.now().toString(),
        name: formData.name,
        url: formData.url,
        categories: formData.categories,
        tags: formData.tags,
        content: {
          title: formData.name,
          description: '',
          summary: '',
          keywords: []
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        privacy: {
          isEncrypted: showEncryption && !!formData.encryptionKey
        },
        userId: 'demo-user' // This would come from auth context
      };

      onBookmarkCreated(bookmark);
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        categories: [],
        tags: [],
        extractContent: true,
        encryptionKey: ''
      });
      setShowEncryption(false);
      
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      setFormErrors({ general: 'Failed to create bookmark' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addCategory = () => {
    if (currentCategory.trim() && !formData.categories.includes(currentCategory.trim())) {
      setFormData({
        ...formData,
        categories: [...formData.categories, currentCategory.trim()]
      });
      setCurrentCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter(cat => cat !== categoryToRemove)
    });
  };

  const extractCurrentPageInfo = () => {
    if (typeof window !== 'undefined') {
      setFormData({
        ...formData,
        name: document.title,
        url: window.location.href
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bookmark-form">
      <div className="form-group">
        <label htmlFor="name">Bookmark Name *</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
          placeholder="Enter bookmark name"
          className={formErrors.name ? 'error' : ''}
          required
        />
        {formErrors.name && (
          <span className="error-message">{formErrors.name}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="url">URL *</label>
        <div className="input-group">
          <input
            type="url"
            id="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: (e.target as HTMLInputElement).value })}
            placeholder="https://example.com"
            className={formErrors.url ? 'error' : ''}
            required
          />
          {typeof window !== 'undefined' && (
            <button
              type="button"
              onClick={extractCurrentPageInfo}
              className="extract-btn"
              title="Use current page"
            >
              Use Current Page
            </button>
          )}
        </div>
        {formErrors.url && (
          <span className="error-message">{formErrors.url}</span>
        )}
      </div>

      <div className="form-group">
        <label>Categories</label>
        <div className="tag-input-group">
          <input
            type="text"
            value={currentCategory}
            onChange={(e) => setCurrentCategory((e.target as HTMLInputElement).value)}
            placeholder="Add category"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
          />
          <button type="button" onClick={addCategory}>Add</button>
        </div>
        <div className="tags">
          {formData.categories.map(category => (
            <span key={category} className="tag category-tag">
              {category}
              <button 
                type="button" 
                onClick={() => removeCategory(category)}
                className="remove-tag"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Tags</label>
        <div className="tag-input-group">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag((e.target as HTMLInputElement).value)}
            placeholder="Add tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button type="button" onClick={addTag}>Add</button>
        </div>
        <div className="tags">
          {formData.tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button 
                type="button" 
                onClick={() => removeTag(tag)}
                className="remove-tag"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.extractContent}
            onChange={(e) => setFormData({ ...formData, extractContent: (e.target as HTMLInputElement).checked })}
          />
          Extract page content for enhanced search
        </label>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showEncryption}
            onChange={(e) => {
              setShowEncryption((e.target as HTMLInputElement).checked);
              if (!(e.target as HTMLInputElement).checked) {
                setFormData({ ...formData, encryptionKey: '' });
              }
            }}
          />
          Encrypt this bookmark (private content)
        </label>
      </div>

      {showEncryption && (
        <div className="form-group encryption-input">
          <label htmlFor="encryptionKey">Encryption Key</label>
          <input
            type="password"
            id="encryptionKey"
            value={formData.encryptionKey}
            onChange={(e) => setFormData({ ...formData, encryptionKey: (e.target as HTMLInputElement).value })}
            placeholder="Enter encryption key"
            className="password-input"
          />
          <small className="help-text">
            ⚠️ Keep this key safe. Without it, you won't be able to decrypt this bookmark.
          </small>
        </div>
      )}

      {formErrors.general && (
        <div className="error-message general">{formErrors.general}</div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? 'Creating...' : 'Create Bookmark'}
        </button>
        <button
          type="button"
          onClick={() => {
            setFormData({ name: '', url: '', categories: [], tags: [], extractContent: true, encryptionKey: '' });
            setShowEncryption(false);
          }}
          className="btn-secondary"
        >
          Clear
        </button>
      </div>
    </form>
  );
}