import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react';
import apiClient from '../api/client';
import axios from 'axios';

function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function Signup() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/signup', {
        email, password, display_name: displayName || undefined,
      });
      const { access_token, display_name } = res.data;
      login(access_token, { id: '', email, display_name: display_name ?? displayName });
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.detail ?? 'Signup failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div className="auth-logo-mark">G</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Gisul</div>
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Find patterns in what you learn.</div>
      </div>

      <div className="auth-card">
        <h1 style={{ margin: '0 0 28px', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          Create account
        </h1>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="label" htmlFor="email">Email address</label>
            <div className="input-group">
              <div className="input-icon-wrapper"><Mail size={18} /></div>
              <input id="email" type="email" className="input input-with-icon" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="displayName">Display name <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
            <div className="input-group">
              <div className="input-icon-wrapper"><User size={18} /></div>
              <input id="displayName" type="text" className="input input-with-icon" placeholder="Your name"
                value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="input-group">
              <div className="input-icon-wrapper"><Lock size={18} /></div>
              <input id="password" type="password" className="input input-with-icon" placeholder="Min 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Spinner /> : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
