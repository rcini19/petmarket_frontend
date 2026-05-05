import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, PawPrint, UserRound, Shield } from 'lucide-react';
import { register } from '../../services/api';
import { saveAuthSession } from '../../utils/auth';
import './Register.css';

function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [registerAs, setRegisterAs] = useState('USER');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await register(fullName, email, password, confirmPassword, registerAs);
      saveAuthSession({
        token: response?.data?.token,
        user: {
          id: response?.data?.id,
          email: response?.data?.email,
          fullName: response?.data?.fullName,
          role: response?.data?.role,
          profileImageUrl: response?.data?.profileImageUrl || null,
        },
      });
      navigate('/dashboard', { replace: true });
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
          <h1>Create account</h1>
          <p className="auth-subtitle">Start your PetMarket membership</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="role-group">
            <p>Register as</p>
            <div className="role-options" role="radiogroup" aria-label="Select account role">
              <button
                type="button"
                className={`role-option ${registerAs === 'USER' ? 'active' : ''}`}
                onClick={() => setRegisterAs('USER')}
                aria-pressed={registerAs === 'USER'}
              >
                <UserRound size={16} />
                <span>User</span>
              </button>
              <button
                type="button"
                className={`role-option ${registerAs === 'ADMIN' ? 'active' : ''}`}
                onClick={() => setRegisterAs('ADMIN')}
                aria-pressed={registerAs === 'ADMIN'}
              >
                <Shield size={16} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <UserRound size={16} />
              </span>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
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
                placeholder="you@example.com"
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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockKeyhole size={16} />
              </span>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
