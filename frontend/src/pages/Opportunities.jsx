import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { calculateCandidateMatch } from '../utils/matchingAlgorithm';

const CATEGORIES = [
  'All Categories',
  'Development',
  'Design & Art',
  'Performance',
  'Writing & Content',
  'Marketing & Outreach',
  'Event & Operations'
];

const Opportunities = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isClub = user?.role === 'club';

  const [projects, setProjects] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'applications' ? 'applications' : 'browse'
  );
  const [onlyHighMatch, setOnlyHighMatch] = useState(false);

  // Keep the tab in sync when arriving via /opportunities?tab=applications
  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'applications' ? 'applications' : 'browse');
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isClub) {
        const res = await api.get('/projects?organizer=me');
        if (res.data.success) setProjects(res.data.projects);
      } else {
        const res = await api.get('/projects');
        if (res.data.success) setProjects(res.data.projects);

        try {
          const appRes = await api.get('/applications/my');
          if (appRes.data.success) setMyApplications(appRes.data.applications);
        } catch (appErr) {
          console.warn('Could not fetch student applications:', appErr.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      categoryFilter === 'All Categories' || project.category === categoryFilter;
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesMatchFilter = true;
    if (!isClub && onlyHighMatch) {
      const matchData = calculateCandidateMatch(user, project.requiredSkills);
      matchesMatchFilter = matchData.score >= 70;
    }

    return matchesCategory && matchesSearch && matchesMatchFilter;
  });

  return (
    <div className="dashboard-page">
      <div className="container" style={{ padding: '40px 0' }}>
        {/* Page header */}
        <div style={{ marginBottom: '24px' }}>
          <span className="eyebrow-label">
            {isClub ? 'YOUR POSTED GIGS' : 'CAMPUS OPPORTUNITIES'}
          </span>
          <h1 className="serif-title">{isClub ? 'Posted Gigs Roster' : 'Opportunities'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isClub
              ? 'Review applicants, inspect compatibility scores, and supervise deliverable timelines.'
              : 'Explore collegiate engagements sorted by skill alignment and departmental discipline.'}
          </p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Student Navigation Tabs */}
        {!isClub && (
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Available Opportunities ({projects.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              My Registered Applications ({myApplications.length})
            </button>
          </div>
        )}

        {/* Student 'My Applications' Tab */}
        {!isClub && activeTab === 'applications' && (
          <div className="applications-view">
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading application roster...
              </div>
            ) : myApplications.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <h3 className="serif-title" style={{ marginBottom: '8px' }}>No Applications Yet</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                  You haven't submitted interest for any campus gigs yet. Browse open opportunities to begin.
                </p>
                <button onClick={() => setActiveTab('browse')} className="btn-navy-outline">
                  Browse Campus Opportunities
                </button>
              </div>
            ) : (
              <div className="gigs-grid">
                {myApplications.map((app) => (
                  <div key={app._id} className="gig-card">
                    <div className="gig-card-media">
                      <div className="card-overlap-crest">CG</div>
                      <span className="card-top-category">{app.project?.category || 'Project'}</span>
                    </div>

                    <div className="gig-card-body">
                      <div style={{ marginBottom: '8px' }}>
                        <span className={`status-badge badge-${app.status}`}>
                          Status: {app.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="gig-card-title">{app.project?.title || 'Campus Gig'}</h3>
                      <p className="gig-card-organizer">
                        Department: <strong>{app.project?.organizer?.name || 'Club'}</strong>
                      </p>

                      <div style={{ backgroundColor: 'var(--bg-cool-gray)', padding: '12px', border: '1px solid var(--border-hairline)', borderRadius: '4px', marginBottom: '16px', fontSize: '0.82rem' }}>
                        <strong style={{ color: 'var(--navy-primary)', display: 'block', marginBottom: '4px' }}>Your Pitch Note:</strong>
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{app.interestNote || 'No pitch provided'}"
                        </span>
                      </div>

                      <div className="gig-card-footer">
                        <Link to={`/gig/${app.project?._id}`} className="learn-more-link">
                          {app.status === 'accepted' ? 'Access Deliverables →' : 'View Gig Scope →'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gigs listing */}
        {(isClub || activeTab === 'browse') && (
          <div className="card-section-split">
            {/* Left column: search & filters */}
            <div className="split-left-col">
              <span className="eyebrow-label">CURATED DIRECTORY</span>
              <h2>Search & Filter</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <input
                  type="text"
                  placeholder={isClub ? 'Search posted gigs...' : 'Search opportunities...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {!isClub && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--navy-primary)', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={onlyHighMatch}
                      onChange={(e) => setOnlyHighMatch(e.target.checked)}
                      style={{ width: 'auto', accentColor: 'var(--gold-accent)' }}
                    />
                    <span>High Match (≥70%) Only</span>
                  </label>
                )}
              </div>

              <div style={{ marginTop: '24px' }}>
                <span className="view-all-link">
                  Showing {filteredProjects.length} of {projects.length} Gigs
                </span>
              </div>
            </div>

            {/* Right side: card grid */}
            <div className="split-right-grid">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading campus registry...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <h3 className="serif-title" style={{ marginBottom: '8px' }}>No Matching Gigs Found</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {isClub
                      ? "You haven't posted any gigs matching this filter yet."
                      : 'There are currently no active opportunities matching your filter.'}
                  </p>
                  {isClub && (
                    <Link to="/post-gig" className="btn-gold-primary">
                      + Post Your First Gig
                    </Link>
                  )}
                </div>
              ) : (
                <div className="gigs-grid">
                  {filteredProjects.map((project) => {
                    const studentMatch = !isClub
                      ? calculateCandidateMatch(user, project.requiredSkills)
                      : null;
                    return (
                      <div key={project._id} className="gig-card">
                        <div className="gig-card-media">
                          <div className="card-overlap-crest">
                            {project.category ? project.category.charAt(0) : 'G'}
                          </div>
                          <span className="card-top-category">{project.category}</span>
                        </div>

                        <div className="gig-card-body">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className={`status-badge badge-${project.status}`}>
                              {project.status === 'in-progress' ? 'In Progress' : project.status}
                            </span>
                            {studentMatch && (
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--gold-hover)' }}>
                                🎯 {studentMatch.score}% Fit
                              </span>
                            )}
                          </div>

                          <h3 className="gig-card-title">{project.title}</h3>
                          <p className="gig-card-organizer">
                            Host: <strong>{project.organizer?.name || 'Campus Club'}</strong>
                          </p>

                          <p className="gig-card-desc">{project.description}</p>

                          {project.requiredSkills && project.requiredSkills.length > 0 && (
                            <div className="gig-card-skills">
                              {project.requiredSkills.slice(0, 3).map((req, idx) => (
                                <span key={idx} className="skill-tag">
                                  {req.tag} <small>({req.minLevel})</small>
                                </span>
                              ))}
                              {project.requiredSkills.length > 3 && (
                                <span className="skill-tag">+{project.requiredSkills.length - 3}</span>
                              )}
                            </div>
                          )}

                          <div className="gig-card-footer">
                            <Link to={`/gig/${project._id}`} className="learn-more-link">
                              {isClub ? 'Manage Roster →' : 'Learn More →'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Opportunities;