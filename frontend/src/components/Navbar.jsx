import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Matches pathname, and optionally the hash (e.g. '/dashboard', '#opportunities')
  const isActive = (path, hash = '') =>
    location.pathname === path && location.hash === hash;

  return (
    <header className="navbar-wrapper">
      {/* Main Navbar */}
      <div className="main-navbar">
        <div className="navbar-container">
          <Link to={user ? "/dashboard" : "/login"} className="navbar-brand">
            <div className="brand-crest">
              <span className="crest-symbol">CG</span>
            </div>
            <div className="brand-text">
              <span className="brand-eyebrow">CAMPUS TALENT PORTAL</span>
              <span className="brand-name">Campus Gig</span>
            </div>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>

          {/* Centered Navigation Links & Right Action Area */}
          <nav className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {user ? (
              <>
                <div className="nav-center-links">
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/opportunities"
                    className={`nav-link ${isActive('/opportunities') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Opportunities
                  </Link>
                  <Link
                    to="/clubs"
                    className={`nav-link ${isActive('/clubs') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Clubs & Societies
                  </Link>
                </div>

                <div className="nav-right-actions">
                  {user.role === 'club' ? (
                    <Link
                      to="/post-gig"
                      className={`btn-gold-primary ${isActive('/post-gig') ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      + Post a Gig
                    </Link>
                  ) : (
                    <Link
                      to="/opportunities"
                      className="btn-gold-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Browse Gigs
                    </Link>
                  )}

                  <div className="user-profile-badge">
                    <div className="avatar-crest">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info-text">
                      <span className="user-name">{user.name}</span>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'club' ? 'Club Organizer' : user.role === 'admin' ? 'Administrator' : 'Student Scholar'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn-navy-outline"
                    title="Sign Out"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-nav-links">
                <Link
                  to="/login"
                  className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-gold-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register Account
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;