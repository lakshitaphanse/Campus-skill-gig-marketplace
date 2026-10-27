import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CATEGORIES = [
  'Development',
  'Design & Art',
  'Performance',
  'Writing & Content',
  'Marketing & Outreach',
  'Event & Operations'
];

const PREDEFINED_SKILLS = [
  'Web Development',
  'UI/UX Design',
  'Graphic Design',
  'Video Editing',
  'Content Writing',
  'Social Media Marketing',
  'Photography',
  'Classical Dance',
  'Music',
  'Event Management'
];

const PostGig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Development'
  });

  const [requiredSkills, setRequiredSkills] = useState([]);
  const [currentSkillTag, setCurrentSkillTag] = useState(PREDEFINED_SKILLS[0]);
  const [currentMinLevel, setCurrentMinLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safeguard: Only club role can post
  if (user?.role !== 'club') {
    return (
      <div className="container" style={{ padding: '60px 24px', maxWidth: '600px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <span className="eyebrow-label">PERMISSION NOTICE</span>
          <h3 className="serif-title" style={{ marginTop: '6px', marginBottom: '10px' }}>Access Restricted</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
            Only recognized student clubs, campus societies, and academic departments possess publishing authority.
          </p>
          <Link to="/dashboard" className="btn-gold-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!currentSkillTag) return;

    if (requiredSkills.some((s) => s.tag === currentSkillTag)) {
      setError(`Skill "${currentSkillTag}" is already added to requirements.`);
      return;
    }

    setError('');
    setRequiredSkills((prev) => [
      ...prev,
      { tag: currentSkillTag, minLevel: currentMinLevel }
    ]);
  };

  const handleRemoveSkill = (tagToRemove) => {
    setRequiredSkills((prev) => prev.filter((s) => s.tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Please provide a title for the gig.');
      return;
    }

    if (!form.description.trim()) {
      setError('Please provide a project description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/projects', {
        ...form,
        requiredSkills
      });

      if (data.success && data.project?._id) {
        navigate(`/gig/${data.project._id}`);
      } else {
        setError('Gig created, but redirection failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post gig. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '48px 24px', maxWidth: '780px' }}>
      <div className="card" style={{ padding: '36px 32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to="/dashboard" className="learn-more-link" style={{ marginBottom: '12px', display: 'inline-flex' }}>
            ← Return to Dashboard
          </Link>
          <span className="eyebrow-label" style={{ display: 'block', marginTop: '4px' }}>DEPARTMENT PUBLISHING</span>
          <h2 style={{ fontSize: '2rem', marginTop: '4px', marginBottom: '6px' }}>Publish Campus Engagement</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Specify project parameters, required skill competencies, and expected deliverable scope.
          </p>
        </div>

        {/* Institutional notice banner */}
        <div className="info-notice-banner" style={{ marginBottom: '24px' }}>
          <span>🏛️</span>
          <span style={{ fontSize: '0.84rem' }}>
            <strong>Institutional Charter:</strong> Opportunities are non-monetary collaborations organized for campus recognition, skill development, and portfolio credentials.
          </span>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Engagement Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Annual Cultural Fest Digital Portal"
              value={form.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Collegiate Domain / Category *</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleInputChange}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Scope of Work & Objectives *</label>
            <textarea
              id="description"
              name="description"
              rows="5"
              placeholder="Outline project deliverables, milestones, weekly commitment, and target impact..."
              value={form.description}
              onChange={handleInputChange}
              required
            ></textarea>
          </div>

          {/* Required Skills Management */}
          <div style={{ backgroundColor: 'var(--bg-cool-gray)', border: '1px solid var(--border-hairline)', borderRadius: '4px', padding: '20px', marginBottom: '24px' }}>
            <span className="eyebrow-label" style={{ fontSize: '0.68rem' }}>CANDIDATE SELECTION CRITERIA</span>
            <h4 className="serif-title" style={{ fontSize: '1.05rem', color: 'var(--navy-primary)', marginBottom: '4px' }}>
              Requisite Competencies & Proficiency
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Define prerequisites used by the match engine to rank candidate applications.
            </p>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{ fontSize: '0.75rem' }}>Skill Domain</label>
                <select
                  value={currentSkillTag}
                  onChange={(e) => setCurrentSkillTag(e.target.value)}
                >
                  {PREDEFINED_SKILLS.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: '150px' }}>
                <label style={{ fontSize: '0.75rem' }}>Minimum Proficiency</label>
                <select
                  value={currentMinLevel}
                  onChange={(e) => setCurrentMinLevel(e.target.value)}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddSkill}
                className="btn-navy-outline"
                style={{ padding: '9px 14px', fontSize: '0.82rem' }}
              >
                + Add Requirement
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {requiredSkills.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No prerequisites added yet. Specify at least one skill domain above.
                </span>
              ) : (
                requiredSkills.map((s) => (
                  <div
                    key={s.tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-hairline)',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '0.78rem'
                    }}
                  >
                    <strong style={{ color: 'var(--navy-primary)' }}>{s.tag}</strong>
                    <span style={{ color: 'var(--gold-hover)', fontSize: '0.7rem' }}>(Min: {s.minLevel})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.tag)}
                      style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px' }}
                      title="Remove requirement"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-gold-primary btn-block btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering Opportunity...' : 'Publish Campus Engagement'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostGig;
