import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    bio: ''
  });

  const [skills, setSkills] = useState([]);
  const [currentSkillTag, setCurrentSkillTag] = useState(PREDEFINED_SKILLS[0]);
  const [currentSkillLevel, setCurrentSkillLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!currentSkillTag) return;

    if (skills.some((s) => s.tag === currentSkillTag)) {
      setError(`Skill "${currentSkillTag}" is already added.`);
      return;
    }

    setError('');
    setSkills((prev) => [
      ...prev,
      { tag: currentSkillTag, level: currentSkillLevel }
    ]);
  };

  const handleRemoveSkill = (tagToRemove) => {
    setSkills((prev) => prev.filter((s) => s.tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      skills: formData.role === 'student' ? skills : []
    };

    const res = await register(payload);

    setIsSubmitting(false);
    if (res.ok) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-page-container" style={{ maxWidth: '620px' }}>
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow-label">REGISTRATION DESK</span>
          <h2>Institutional Profile Setup</h2>
          <p>Join the verified campus registry as a student talent or club organizer</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="name">Full Legal / Organization Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Alex Morgan or Tech Society"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Institutional Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. alex@college.edu"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="password">Password (min 6 characters) *</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create secure password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Institutional Standing / Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="student">Student Scholar (Apply to Gigs)</option>
                <option value="club">Club / Department (Host Projects)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Academic & Project Summary</label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              placeholder={
                formData.role === 'student'
                  ? 'Briefly state your branch, academic interests, or technical competencies...'
                  : 'Official mission and scope of your recognized college club or committee...'
              }
              value={formData.bio}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Student Skills Section */}
          {formData.role === 'student' && (
            <div style={{ backgroundColor: 'var(--bg-cool-gray)', border: '1px solid var(--border-hairline)', borderRadius: '4px', padding: '18px', marginBottom: '22px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span className="eyebrow-label" style={{ fontSize: '0.68rem' }}>TALENT TAXONOMY</span>
                <h4 className="serif-title" style={{ fontSize: '1.05rem', color: 'var(--navy-primary)' }}>
                  Technical & Creative Proficiencies
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Selected proficiencies directly feed the algorithmic match engine.
                </p>
              </div>

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

                <div style={{ width: '130px' }}>
                  <label style={{ fontSize: '0.75rem' }}>Proficiency</label>
                  <select
                    value={currentSkillLevel}
                    onChange={(e) => setCurrentSkillLevel(e.target.value)}
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
                  + Add Skill
                </button>
              </div>

              {/* Skill chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No competencies added yet. Select a domain and click "+ Add Skill".
                  </span>
                ) : (
                  skills.map((s) => (
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
                      <span style={{ color: 'var(--gold-hover)', fontSize: '0.7rem' }}>({s.level})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s.tag)}
                        style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px' }}
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-gold-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '10px' }}
          >
            {isSubmitting ? 'Registering Institutional Record...' : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer">
          Already possess a collegiate profile?{' '}
          <Link to="/login">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
