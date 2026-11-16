import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login({ emailOrUsername, password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setEmailOrUsername('alex');
    setPassword('alex1234');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back!</h1>
        <p className="auth-subtitle">We're so excited to see you again!</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input
              type="text"
              className="form-input"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="name@example.com or username"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
            onClick={handleDemoFill}
          >
            Fill Demo Credentials
          </button>
        </form>

        <p className="auth-footer-text">
          Need an account?{' '}
          <span className="auth-link" onClick={onSwitchToRegister}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
};
