import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { signIn } from '../services/authService';
import '../styles/auth.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { user, error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError);
      setIsLoading(false);
      return;
    }

    if (user) {
      route('/dashboard');
    }
  };

  return (
    <div className="auth-page login-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Universal Bookmarker</h1>
          <p>Sign in to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <a href="/register">Create one</a>
          </p>
          <p>
            <a href="/forgot-password">Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  );
}
