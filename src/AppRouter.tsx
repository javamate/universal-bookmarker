import { useContext } from 'preact/hooks';
import Router from 'preact-router';
import { AuthProvider, AuthContext } from './contexts/authContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { MainLayout } from './layouts/MainLayout';

function AppContent() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        {/* @ts-ignore */}
        <LoginPage path="/login" />
        {/* @ts-ignore */}
        <RegisterPage path="/register" />
        {/* @ts-ignore */}
        <LoginPage default />
      </Router>
    );
  }

  return (
    <MainLayout>
      <Router>
        {/* @ts-ignore */}
        <DashboardPage path="/dashboard" />
        {/* @ts-ignore */}
        <SearchPage path="/search" />
        {/* @ts-ignore */}
        <CategoriesPage path="/categories" />
        {/* @ts-ignore */}
        <SettingsPage path="/settings" />
        {/* @ts-ignore */}
        <DashboardPage default />
      </Router>
    </MainLayout>
  );
}

export function AppRouter() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
