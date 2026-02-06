import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../services/supabaseClient';
import { getUserSettings, updateUserSettings } from '../services/authService';
import '../styles/settings.css';

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({
    algolia_app_id: '',
    algolia_search_key: '',
    default_extraction_mode: 'summary',
    auto_sync: true,
    notifications_enabled: true,
    theme: 'light',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserEmail(user.email || '');

        const userSettings = await getUserSettings();
        if (userSettings) {
          setSettings({
            algolia_app_id: userSettings.algolia_app_id || '',
            algolia_search_key: userSettings.algolia_search_key || '',
            default_extraction_mode: userSettings.default_extraction_mode || 'summary',
            auto_sync: userSettings.auto_sync ?? true,
            notifications_enabled: userSettings.notifications_enabled ?? true,
            theme: userSettings.theme || 'light',
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await updateUserSettings(settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="settings-page loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-section">
          <h2>Account</h2>
          <div className="setting-item">
            <label>Email Address</label>
            <p className="read-only">{userEmail}</p>
            <a href="#" className="link">Change email (coming soon)</a>
          </div>
        </div>

        <div className="settings-section">
          <h2>Algolia Search Configuration</h2>
          <p className="section-description">
            Configure your Algolia credentials to enable full-text search capabilities.
          </p>

          <div className="setting-item">
            <label htmlFor="algolia-app-id">Algolia App ID</label>
            <input
              id="algolia-app-id"
              type="text"
              placeholder="Your Algolia App ID"
              value={settings.algolia_app_id}
              onChange={(e) => handleChange('algolia_app_id', (e.target as HTMLInputElement).value)}
            />
            <small>Found in your Algolia dashboard</small>
          </div>

          <div className="setting-item">
            <label htmlFor="algolia-key">Algolia Search Key</label>
            <input
              id="algolia-key"
              type="password"
              placeholder="Your Algolia Search Key"
              value={settings.algolia_search_key}
              onChange={(e) => handleChange('algolia_search_key', (e.target as HTMLInputElement).value)}
            />
            <small>Your search-only API key (not the admin key)</small>
          </div>
        </div>

        <div className="settings-section">
          <h2>Preferences</h2>

          <div className="setting-item">
            <label htmlFor="extraction-mode">Default Content Extraction</label>
            <select
              id="extraction-mode"
              value={settings.default_extraction_mode}
              onChange={(e) => handleChange('default_extraction_mode', (e.target as HTMLSelectElement).value)}
            >
              <option value="summary">Summary only</option>
              <option value="full">Full content</option>
              <option value="none">No extraction</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => handleChange('theme', (e.target as HTMLSelectElement).value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">System (coming soon)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>Sync & Notifications</h2>

          <div className="setting-item checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.auto_sync}
                onChange={(e) => handleChange('auto_sync', (e.target as HTMLInputElement).checked)}
              />
              <span>Auto-sync bookmarks</span>
            </label>
            <small>Automatically sync bookmarks across devices</small>
          </div>

          <div className="setting-item checkbox">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => handleChange('notifications_enabled', (e.target as HTMLInputElement).checked)}
              />
              <span>Enable notifications</span>
            </label>
            <small>Receive notifications when bookmarks are saved</small>
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
