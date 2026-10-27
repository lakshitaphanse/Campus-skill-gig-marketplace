import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      setError('');
      try {
        // No dedicated clubs endpoint is needed: we group gigs by their organizer.
        const res = await api.get('/projects');
        if (res.data.success) {
          const map = {};
          res.data.projects.forEach((p) => {
            const org = p.organizer;
            if (!org) return;
            const id = org._id || org.name;
            if (!map[id]) {
              map[id] = { id, name: org.name || 'Campus Club', gigs: [] };
            }
            map[id].gigs.push(p);
          });
          setClubs(Object.values(map));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <div className="container" style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: '24px' }}>
          <span className="eyebrow-label">REGISTERED ORGANIZATIONS</span>
          <h1 className="serif-title">Clubs & Societies</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Accredited university councils, departmental bodies, and student societies that publish campus gigs.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search clubs & societies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '420px', marginBottom: '24px' }}
        />

        {error && (
          <div className="alert-box alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading clubs & societies...
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <h3 className="serif-title" style={{ marginBottom: '8px' }}>No Clubs Found</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              No clubs or societies have posted gigs yet.
            </p>
          </div>
        ) : (
          <div className="gigs-grid">
            {filteredClubs.map((club) => {
              const openCount = club.gigs.filter((g) => g.status === 'open').length;
              return (
                <div key={club.id} className="gig-card">
                  <div className="gig-card-media">
                    <div className="card-overlap-crest">
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="card-top-category">Club / Society</span>
                  </div>

                  <div className="gig-card-body">
                    <h3 className="gig-card-title">{club.name}</h3>
                    <p className="gig-card-organizer">
                      <strong>{club.gigs.length}</strong> gig{club.gigs.length !== 1 ? 's' : ''} posted
                      {' · '}
                      <strong>{openCount}</strong> open
                    </p>

                    <div className="gig-card-skills">
                      {[...new Set(club.gigs.map((g) => g.category).filter(Boolean))]
                        .slice(0, 3)
                        .map((cat) => (
                          <span key={cat} className="skill-tag">{cat}</span>
                        ))}
                    </div>

                    <div className="gig-card-footer">
                      <Link to="/opportunities" className="learn-more-link">
                        View Opportunities →
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
  );
};

export default Clubs;