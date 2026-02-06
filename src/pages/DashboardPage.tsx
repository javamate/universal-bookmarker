import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../services/supabaseClient';
import '../styles/dashboard.css';

interface BookmarkStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface TopCategory {
  name: string;
  count: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<BookmarkStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('id, name, created_at, categories')
          .eq('user_id', user.id);

        if (!bookmarks) {
          setIsLoading(false);
          return;
        }

        const todayCount = bookmarks.filter(
          (b) => new Date(b.created_at) >= today
        ).length;

        const weekCount = bookmarks.filter(
          (b) => new Date(b.created_at) >= weekAgo
        ).length;

        const monthCount = bookmarks.filter(
          (b) => new Date(b.created_at) >= monthAgo
        ).length;

        setStats({
          total: bookmarks.length,
          today: todayCount,
          thisWeek: weekCount,
          thisMonth: monthCount,
        });

        const categoryCounts = new Map<string, number>();
        bookmarks.forEach((b) => {
          b.categories.forEach((cat: string) => {
            categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
          });
        });

        const topCats = Array.from(categoryCounts.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setTopCategories(topCats);

        const recent = bookmarks
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          .slice(0, 5);

        setRecentBookmarks(recent);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-page loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back to your bookmarks</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Bookmarks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">Added Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.thisWeek}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.thisMonth}</div>
          <div className="stat-label">This Month</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Top Categories</h2>
          {topCategories.length > 0 ? (
            <div className="category-list">
              {topCategories.map((cat) => (
                <div key={cat.name} className="category-item">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-count">{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No categories yet</p>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Recent Bookmarks</h2>
          {recentBookmarks.length > 0 ? (
            <div className="recent-list">
              {recentBookmarks.map((bookmark) => (
                <div key={bookmark.id} className="recent-item">
                  <div className="recent-name">{bookmark.name}</div>
                  <div className="recent-date">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No bookmarks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
