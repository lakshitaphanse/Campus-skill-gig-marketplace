import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);

  const isClub = user?.role === 'club';

  // Only clubs need project data here (for the stats cards)
  useEffect(() => {
    if (!isClub) return;
    const fetchClubProjects = async () => {
      try {
        const res = await api.get('/projects?organizer=me');
        if (res.data.success) setProjects(res.data.projects);
      } catch (err) {
        console.warn('Could not load club stats:', err.message);
      }
    };
    fetchClubProjects();
  }, [isClub]);

  const clubStats = {
    total: projects.length,
    open: projects.filter((p) => p.status === 'open').length,
    inProgress: projects.filter((p) => p.status === 'in-progress').length,
    completed: projects.filter((p) => p.status === 'completed').length
  };

  return (
    <div className="dashboard-page">
      {/* 1. HERO BANNER */}
      <section className="hero-banner-section">
        <div className="hero-banner-grid">
          <div className="hero-content">
            <span className="eyebrow-label eyebrow-label-light">
              {isClub ? 'CAMPUS ORGANIZATIONS & SOCIETIES' : 'COLLEGIATE TALENT DISCOVERY'}
            </span>
            <h1>
              {isClub
                ? 'Empower Campus Projects With Verified Student Talent.'
                : 'Accelerate Your Career With Prestigious Campus Gigs.'}
            </h1>
            <p>
              {isClub
                ? 'Publish official collegiate opportunities, evaluate skill-aligned applicants, track milestone deliverables, and endorse exceptional student builders.'
                : 'Collaborate with university clubs and departments on real-world projects, earn milestone endorsements, and establish a verified academic portfolio.'}
            </p>

            <div className="hero-actions">
              {isClub ? (
                <>
                  <Link to="/post-gig" className="btn-gold-primary btn-lg">
                    + Post New Campus Gig
                  </Link>
                  <Link to="/opportunities" className="btn-white-outline btn-lg">
                    Manage Active Roster
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/opportunities" className="btn-gold-primary btn-lg">
                    Explore Open Opportunities
                  </Link>
                  <Link to="/opportunities?tab=applications" className="btn-white-outline btn-lg">
                    View My Applications
                  </Link>
                </>
              )}
            </div>

            {/* Student verified standing inside hero */}
            {!isClub && (
              <div className="student-stats-row">
                <div className="stat-pill">
                  <span className="stat-pill-label">Verified Rating</span>
                  <span className="stat-pill-value">★ {user?.averageRating ? Number(user.averageRating).toFixed(1) : '5.0'}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Reliability Index</span>
                  <span className="stat-pill-value">{user?.reliabilityScore ?? 100}%</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill-label">Completed Gigs</span>
                  <span className="stat-pill-value">{user?.completedProjects ?? 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right edge: Navy Info Panel Card */}
          <div className="hero-info-panel">
            <span className="info-panel-eyebrow">INSTITUTIONAL NOTICE</span>
            <h3 className="info-panel-title">Non-Monetary Credited Learning</h3>
            <p className="info-panel-desc">
              All engagements operate under the university collaborative model. Student scholars receive hands-on experience, formal club recommendations, and verified portfolio records.
            </p>
            <Link to="/clubs" className="info-panel-link">
              Browse Clubs & Societies →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FEATURE STRIP */}
      <section className="feature-strip-section">
        <div className="feature-strip-grid">
          <div className="feature-strip-item">
            <div className="feature-icon-circle">🎯</div>
            <h4 className="feature-item-title">Skill-Weighted Matching</h4>
            <p className="feature-item-desc">Algorithmic alignment connecting candidates to verified departmental skill requisites.</p>
          </div>
          <div className="feature-strip-item">
            <div className="feature-icon-circle">📑</div>
            <h4 className="feature-item-title">Milestone Governance</h4>
            <p className="feature-item-desc">Structured deliverable phases with multi-stage submission reviews and audit trails.</p>
          </div>
          <div className="feature-strip-item">
            <div className="feature-icon-circle">⭐</div>
            <h4 className="feature-item-title">Verified Portfolio Credit</h4>
            <p className="feature-item-desc">5-star performance evaluations and official club endorsements on project completion.</p>
          </div>
          <div className="feature-strip-item">
            <div className="feature-icon-circle">🏛️</div>
            <h4 className="feature-item-title">Registered Organizations</h4>
            <p className="feature-item-desc">Fully accredited university councils, departmental bodies, and student societies.</p>
          </div>
        </div>
      </section>

      {/* Club stats overview */}
      {isClub && (
        <div className="container" style={{ padding: '32px 0' }}>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card-num">{clubStats.total}</span>
              <span className="stat-card-title">Total Gigs Posted</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-num" style={{ color: '#065F46' }}>{clubStats.open}</span>
              <span className="stat-card-title">Open for Applications</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-num" style={{ color: '#1E40AF' }}>{clubStats.inProgress}</span>
              <span className="stat-card-title">In Progress</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-num" style={{ color: '#5B21B6' }}>{clubStats.completed}</span>
              <span className="stat-card-title">Completed & Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. GOLD BANNER STRIP */}
      <section className="gold-banner-strip">
        <div className="gold-banner-content">
          <div className="gold-banner-text">
            <h3>{isClub ? 'Have a New Departmental Initiative?' : 'Ready to Showcase Your Technical Skills?'}</h3>
            <p>
              {isClub
                ? 'Create a verified campus gig and recruit high-performing student builders across all faculties.'
                : 'Browse available gigs, pitch your strengths, and gain recognized institutional endorsements.'}
            </p>
          </div>
          <div>
            {isClub ? (
              <Link to="/post-gig" className="btn-navy-primary btn-lg">
                + Create Campus Gig
              </Link>
            ) : (
              <Link to="/opportunities" className="btn-navy-primary btn-lg">
                Explore Available Gigs
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;