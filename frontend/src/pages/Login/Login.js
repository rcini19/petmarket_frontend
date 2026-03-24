import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, PawPrint, Shield, UserRound } from 'lucide-react';
import { loginWithRole } from '../../services/api';
import { saveAuthSession } from '../../utils/auth';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginAs, setLoginAs] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginWithRole(email, password, loginAs);
      saveAuthSession({
        token: response?.data?.token,
        user: {
          email: response?.data?.email,
          fullName: response?.data?.fullName,
          role: response?.data?.role,
          profileImageUrl: response?.data?.profileImageUrl || null,
        },
      });
      if (response?.data?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      setError(message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <PawPrint size={22} />
          </div>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Securely access your PetMarket account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="role-group">
            <p>Log in as</p>
            <div className="role-options" role="radiogroup" aria-label="Select account role">
              <button
                type="button"
                className={`role-option ${loginAs === 'USER' ? 'active' : ''}`}
                onClick={() => setLoginAs('USER')}
                aria-pressed={loginAs === 'USER'}
              >
                <UserRound size={16} />
                <span>User</span>
              </button>
              <button
                type="button"
                className={`role-option ${loginAs === 'ADMIN' ? 'active' : ''}`}
                onClick={() => setLoginAs('ADMIN')}
                aria-pressed={loginAs === 'ADMIN'}
              >
                <Shield size={16} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="you@petmarket.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockKeyhole size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
