import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email, password);

    setIsSubmitting(false);
    if (res.ok) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow-label">OFFICIAL ACCESS PORTAL</span>
          <h2>Institutional Sign In</h2>
          <p>Access your collegiate profile, manage gigs, and monitor deliverables</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Presentation Demo Fill Buttons */}
        <div className="demo-creds-box">
          <span className="demo-creds-title">⚡ Evaluator Quick-Fill:</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => { setEmail('club@college.edu'); setPassword('password123'); setError(''); }}
            >
              🏢 Tech Council (Club)
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => { setEmail('student@college.edu'); setPassword('password123'); setError(''); }}
            >
              🎓 Alex Morgan (Student)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Institutional Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. alex@college.edu or club@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Security Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-gold-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '12px' }}
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an institutional profile?{' '}
          <Link to="/register">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
