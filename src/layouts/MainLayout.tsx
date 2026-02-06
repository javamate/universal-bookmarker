import { useContext, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { AuthContext } from '../contexts/authContext';
import '../styles/layout.css';

interface MainLayoutProps {
  children?: any;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    route('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Search', path: '/search', icon: '🔍' },
    { label: 'Categories', path: '/categories', icon: '📁' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="main-layout">
      <div className="layout-sidebar">
        <div className="sidebar-header">
          <h2>🔖 Bookmarker</h2>
          <button
            className="close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="nav-link"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.fullName || user?.email}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="layout-content">
        <div className="content-header">
          <button
            className="menu-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <a href="/dashboard" className="brand">
            🔖 Universal Bookmarker
          </a>
        </div>

        <div className="content-main">
          {children}
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
