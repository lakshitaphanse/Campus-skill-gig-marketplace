import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { calculateCandidateMatch } from '../utils/matchingAlgorithm';

const GigDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [myApplication, setMyApplication] = useState(null);
  const [candidateSort, setCandidateSort] = useState('match'); // 'match' | 'reliability' | 'newest'

  const [interestNote, setInterestNote] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // New Milestone Form State (for Club)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);

  // Active submission note inputs mapped by milestoneId
  const [submissionNotes, setSubmissionNotes] = useState({});
  const [submittingMilestoneId, setSubmittingMilestoneId] = useState(null);
  const [reviewingMilestoneId, setReviewingMilestoneId] = useState(null);

  // Club Rating & Review State for Completed Project
  const [rating, setRating] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [endorsedSkills, setEndorsedSkills] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isOrganizer = user && project && (String(project.organizer?._id) === String(user._id) || String(project.organizer) === String(user._id));
  const isSelectedStudent = user && project && project.selectedStudent && (String(project.selectedStudent?._id) === String(user._id) || String(project.selectedStudent) === String(user._id));
  const isStudent = user?.role === 'student';

  useEffect(() => {
    loadAllData();
  }, [id, user]);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Project Details
      const projRes = await api.get(`/projects/${id}`);
      if (projRes.data.success) {
        setProject(projRes.data.project);

        const currentProject = projRes.data.project;
        const userIsOrganizer = String(currentProject.organizer?._id) === String(user?._id) || String(currentProject.organizer) === String(user?._id);

        // 2. Fetch Milestones
        try {
          const mRes = await api.get(`/projects/${id}/milestones`);
          if (mRes.data.success) {
            setMilestones(mRes.data.milestones);
          }
        } catch (mErr) {
          console.warn('Could not fetch milestones:', mErr.message);
        }

        // 3. If organizer, fetch applicants
        if (userIsOrganizer) {
          try {
            const appRes = await api.get(`/projects/${id}/applications`);
            if (appRes.data.success) {
              setApplicants(appRes.data.applications);
            }
          } catch (appErr) {
            console.warn('Could not fetch applicants:', appErr.message);
          }
        }

        // 4. If student, check if already applied
        if (user?.role === 'student') {
          try {
            const myAppsRes = await api.get('/applications/my');
            if (myAppsRes.data.success) {
              const existing = myAppsRes.data.applications.find(
                (a) => String(a.project?._id || a.project) === String(id)
              );
              setMyApplication(existing || null);
            }
          } catch (myAppErr) {
            console.warn('Could not fetch my applications:', myAppErr.message);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  // --- STUDENT APPLY ACTION ---
  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsApplying(true);

    try {
      const res = await api.post(`/projects/${id}/applications`, {
        interestNote
      });

      if (res.data.success) {
        setSuccessMessage('Application submitted successfully!');
        setMyApplication(res.data.application);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsApplying(false);
    }
  };

  // --- CLUB UPDATE APPLICANT STATUS ACTION ---
  const handleUpdateApplicantStatus = async (applicationId, status) => {
    setError('');
    setSuccessMessage('');

    try {
      const res = await api.patch(`/applications/${applicationId}/status`, { status });
      if (res.data.success) {
        setSuccessMessage(`Applicant status updated to "${status}".`);
        // Refresh project and applicant data
        loadAllData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update applicant status');
    }
  };

  // --- CLUB CREATE MILESTONE ACTION ---
  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newMilestone.title.trim()) {
      setError('Milestone title is required');
      return;
    }

    setIsCreatingMilestone(true);
    try {
      const res = await api.post(`/projects/${id}/milestones`, newMilestone);
      if (res.data.success) {
        setSuccessMessage('New milestone added successfully!');
        setNewMilestone({ title: '', description: '', dueDate: '' });
        // Refresh milestones
        const mRes = await api.get(`/projects/${id}/milestones`);
        if (mRes.data.success) {
          setMilestones(mRes.data.milestones);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create milestone');
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  // --- STUDENT SUBMIT MILESTONE WORK ---
  const handleSubmitMilestoneWork = async (milestoneId) => {
    setError('');
    setSuccessMessage('');
    const note = submissionNotes[milestoneId] || '';

    setSubmittingMilestoneId(milestoneId);
    try {
      const res = await api.patch(`/milestones/${milestoneId}/submit`, {
        submissionNote: note
      });

      if (res.data.success) {
        setSuccessMessage('Milestone work submitted for club review!');
        // Refresh milestones
        const mRes = await api.get(`/projects/${id}/milestones`);
        if (mRes.data.success) {
          setMilestones(mRes.data.milestones);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit milestone');
    } finally {
      setSubmittingMilestoneId(null);
    }
  };

  // --- CLUB REVIEW MILESTONE (APPROVE / REJECT) ---
  const handleReviewMilestone = async (milestoneId, reviewStatus) => {
    setError('');
    setSuccessMessage('');
    setReviewingMilestoneId(milestoneId);

    try {
      const res = await api.patch(`/milestones/${milestoneId}/review`, {
        status: reviewStatus
      });

      if (res.data.success) {
        setSuccessMessage(`Milestone was ${reviewStatus}!`);
        // Refresh project and milestones
        loadAllData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review milestone');
    } finally {
      setReviewingMilestoneId(null);
    }
  };

  // --- CLUB SUBMIT PROJECT COMPLETION RATING & REVIEW ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmittingReview(true);

    try {
      const res = await api.post(`/projects/${id}/review`, {
        rating,
        feedback: reviewFeedback,
        endorsedSkills
      });

      if (res.data.success) {
        setSuccessMessage('Student performance review and rating published successfully!');
        loadAllData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating & review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const toggleEndorseSkill = (skillTag) => {
    setEndorsedSkills((prev) =>
      prev.includes(skillTag) ? prev.filter((s) => s !== skillTag) : [...prev, skillTag]
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state-card">
        <h2>Project Not Found</h2>
        <p>The campus gig you are looking for does not exist or has been removed.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate project progress
  const approvedMilestones = milestones.filter((m) => m.status === 'approved').length;
  const progressPercent =
    milestones.length > 0 ? Math.round((approvedMilestones / milestones.length) * 100) : 0;

  return (
    <div className="gig-detail-container">
      <div className="top-navigation-row">
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
        <div className="top-badges">
          <span className="gig-category">{project.category}</span>
          <span className={`status-badge badge-${project.status}`}>
            {project.status === 'in-progress' ? 'In Progress' : project.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert-box alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert-box alert-success">
          <span>✅ {successMessage}</span>
        </div>
      )}

      {/* Main Project Overview Card */}
      <div className="project-header-card">
        <div className="project-title-section">
          <h1>{project.title}</h1>
          <div className="organizer-info-bar">
            <span>Posted by: <strong>{project.organizer?.name}</strong></span>
            {project.organizer?.email && (
              <span className="contact-email">({project.organizer.email})</span>
            )}
            <span className="bullet-sep">•</span>
            <span className="date-stamp">
              Posted: {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="project-description-block">
          <h3>Project Objective & Scope</h3>
          <p className="desc-text">{project.description}</p>
        </div>

        {/* Required Skills Section */}
        <div className="project-skills-block">
          <h4>Required Skill Proficiency:</h4>
          {project.requiredSkills && project.requiredSkills.length > 0 ? (
            <div className="skills-badge-list">
              {project.requiredSkills.map((req, idx) => (
                <span key={idx} className="required-skill-pill">
                  {req.tag} <small className="min-pill">Min: {req.minLevel}</small>
                </span>
              ))}
            </div>
          ) : (
            <p className="no-skills-text">Open to all students with basic enthusiasm.</p>
          )}
        </div>

        {/* Selected Student Banner (if assigned) */}
        {project.selectedStudent && (
          <div className="selected-student-banner">
            <div className="banner-left">
              <span className="badge-selected">Assigned Student</span>
              <h4>{project.selectedStudent.name}</h4>
              <p className="student-sub">
                {project.selectedStudent.email} • Reliability:{' '}
                <strong>{project.selectedStudent.reliabilityScore ?? 100}%</strong>
              </p>
            </div>
            {isSelectedStudent && (
              <div className="you-are-selected-pill">
                ⭐ You are the selected collaborator for this project!
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* STUDENT VIEW SECTION: APPLY OR TRACK APPLICATION */}
      {/* ============================================================ */}
      {isStudent && !isSelectedStudent && (
        <div className="student-action-card">
          {!myApplication ? (
            // Student hasn't applied yet
            project.status === 'open' ? (
              <div className="apply-form-section">
                <h3>Apply for this Campus Gig</h3>
                <p>
                  Submit your interest note explaining how your skills align with this project.
                </p>

                <form onSubmit={handleApply}>
                  <div className="form-group">
                    <label htmlFor="interestNote">Interest Note / Pitch *</label>
                    <textarea
                      id="interestNote"
                      rows="4"
                      placeholder="e.g. I have worked on web applications using React and would love to build the festival website..."
                      value={interestNote}
                      onChange={(e) => setInterestNote(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isApplying}
                  >
                    {isApplying ? 'Submitting Application...' : 'Apply for this Gig'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="info-box">
                <h4>Applications Closed</h4>
                <p>This project is currently {project.status} and is not accepting new applicants.</p>
              </div>
            )
          ) : (
            // Student has already applied
            <div className="application-status-section">
              <div className="app-status-header">
                <h3>Your Application Status</h3>
                <span className={`status-badge badge-${myApplication.status}`}>
                  {myApplication.status.toUpperCase()}
                </span>
              </div>

              <div className="submitted-note-box">
                <span className="note-title">Your Submitted Pitch:</span>
                <p>"{myApplication.interestNote}"</p>
              </div>

              {myApplication.status === 'pending' && (
                <p className="status-hint-text">
                  Your application is currently under review by <strong>{project.organizer?.name}</strong>.
                </p>
              )}
              {myApplication.status === 'waitlisted' && (
                <p className="status-hint-text waitlist-text">
                  You have been placed on the waitlist for this project.
                </p>
              )}
              {myApplication.status === 'rejected' && (
                <p className="status-hint-text rejected-text">
                  Thank you for your interest. The organizer has selected another candidate for this gig.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* CLUB VIEW SECTION: APPLICANTS REVIEW */}
      {/* ============================================================ */}
      {isOrganizer && (
        <div className="organizer-review-card">
          <div className="card-header-flex">
            <div>
              <h3>Student Applicants ({applicants.length})</h3>
              <p>Objective selection criteria: skill taxonomy alignment, competency levels, and campus reliability</p>
            </div>

            {applicants.length > 1 && (
              <div className="candidate-sort-container">
                <label htmlFor="candidate-sort">Sort Candidates By:</label>
                <select
                  id="candidate-sort"
                  value={candidateSort}
                  onChange={(e) => setCandidateSort(e.target.value)}
                  className="candidate-sort-select"
                >
                  <option value="match">⚡ Best Skill Compatibility (Recommended)</option>
                  <option value="reliability">🛡️ Highest Reliability Score</option>
                  <option value="newest">🕒 Newest Application First</option>
                </select>
              </div>
            )}
          </div>

          {applicants.length === 0 ? (
            <div className="empty-subcard">
              <p>No students have applied to this gig yet. Share the link across campus!</p>
            </div>
          ) : (
            <div className="applicants-list">
              {[...applicants]
                .map((app) => ({
                  ...app,
                  matchData: calculateCandidateMatch(app.applicant, project.requiredSkills)
                }))
                .sort((a, b) => {
                  if (candidateSort === 'match') {
                    return b.matchData.score - a.matchData.score;
                  } else if (candidateSort === 'reliability') {
                    return (b.applicant?.reliabilityScore ?? 100) - (a.applicant?.reliabilityScore ?? 100);
                  } else {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  }
                })
                .map((app) => (
                <div key={app._id} className={`applicant-item-card ${app.matchData.score >= 85 ? 'top-match-card' : ''}`}>
                  {/* Top Match Ribbon */}
                  {app.matchData.score >= 85 && (
                    <div className="top-candidate-ribbon">
                      ⭐ Top Recommended Candidate
                    </div>
                  )}

                  <div className="applicant-main-info">
                    <div className="applicant-avatar">
                      {app.applicant?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="applicant-details">
                      <div className="applicant-header-line">
                        <h4>
                          {app.applicant?.name}
                        </h4>
                        <div className={`compatibility-badge ${app.matchData.colorClass}`}>
                          <span className="compat-score">{app.matchData.score}% Match</span>
                          <span className="compat-label">{app.matchData.label}</span>
                        </div>
                      </div>

                      <div className="applicant-sub-meta">
                        <span className="reliability-tag">
                          Reliability: {app.applicant?.reliabilityScore ?? 100}%
                        </span>
                        <span className="bullet-sep">•</span>
                        <span className="rating-tag">
                          ⭐ {app.applicant?.averageRating ? Number(app.applicant.averageRating).toFixed(1) : '5.0'} ({app.applicant?.totalReviews ?? 0} reviews)
                        </span>
                        <span className="bullet-sep">•</span>
                        <span className="completed-tag">
                          Completed: {app.applicant?.completedProjects ?? 0} gigs
                        </span>
                        <span className="bullet-sep">•</span>
                        <span className="applicant-email">{app.applicant?.email}</span>
                      </div>

                      {app.applicant?.bio && (
                        <p className="applicant-bio">Bio: {app.applicant.bio}</p>
                      )}

                      {/* Applicant Raw Skills List */}
                      <div className="applicant-skills">
                        <span className="skills-subhead">Listed Skills:</span>
                        {app.applicant?.skills?.map((s, idx) => (
                          <span key={idx} className="applicant-skill-tag">
                            {s.tag} ({s.level})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Objective Selection Criteria & Skill Alignment Panel */}
                  {app.matchData.breakdown && app.matchData.breakdown.length > 0 && (
                    <div className="selection-criteria-panel">
                      <div className="criteria-panel-title">
                        <span>🎯 Selection Criteria Alignment</span>
                        <small>{app.matchData.rawSkillScore}% Skill Compatibility Index</small>
                      </div>
                      <div className="criteria-items-list">
                        {app.matchData.breakdown.map((item, idx) => (
                          <div key={idx} className={`criteria-row row-${item.status}`}>
                            <div className="criteria-skill-name">
                              <strong>{item.tag}</strong>
                              <span className="req-min-text">Required: {item.requiredLevel}</span>
                            </div>
                            <div className="criteria-student-level">
                              Candidate: <span className="level-highlight">{item.studentLevel}</span>
                            </div>
                            <span className={`criteria-badge badge-${item.status}`}>
                              {item.statusLabel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="applicant-pitch">
                    <span className="pitch-label">Applicant Interest Note / Pitch:</span>
                    <p className="pitch-text">"{app.interestNote || 'No note provided'}"</p>
                  </div>

                  <div className="applicant-actions-bar">
                    <span className={`status-badge badge-${app.status}`}>
                      Status: {app.status.toUpperCase()}
                    </span>

                    {/* Review action buttons for club */}
                    {app.status === 'pending' || app.status === 'waitlisted' ? (
                      <div className="action-buttons-group">
                        <button
                          onClick={() => handleUpdateApplicantStatus(app._id, 'accepted')}
                          className="btn btn-sm btn-success"
                        >
                          Accept Student
                        </button>
                        <button
                          onClick={() => handleUpdateApplicantStatus(app._id, 'waitlist')}
                          className="btn btn-sm btn-warning"
                        >
                          Waitlist
                        </button>
                        <button
                          onClick={() => handleUpdateApplicantStatus(app._id, 'rejected')}
                          className="btn btn-sm btn-danger"
                        >
                          Reject
                        </button>
                      </div>
                    ) : app.status === 'accepted' ? (
                      <span className="selected-indicator">Selected Collaborator</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MILESTONE MANAGEMENT SECTION */}
      {/* Displayed for organizer OR selected student OR general tracking */}
      {/* ============================================================ */}
      {(isOrganizer || isSelectedStudent || milestones.length > 0) && (
        <div className="milestones-section-card">
          <div className="milestones-header">
            <div>
              <h3>Project Milestones & Deliverables</h3>
              <p>Break project into verifiable checkpoints from initiation to completion</p>
            </div>

            {milestones.length > 0 && (
              <div className="progress-indicator-box">
                <div className="progress-labels">
                  <span>Progress:</span>
                  <strong>{approvedMilestones} of {milestones.length} Approved ({progressPercent}%)</strong>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Organizer Add Milestone Form */}
          {isOrganizer && project.status !== 'completed' && (
            <div className="add-milestone-box">
              <h4>+ Create New Milestone</h4>
              <form onSubmit={handleCreateMilestone} className="milestone-form-grid">
                <div className="form-group">
                  <label>Milestone Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Homepage and Event Schedule"
                    value={newMilestone.title}
                    onChange={(e) =>
                      setNewMilestone((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={(e) =>
                      setNewMilestone((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description / Deliverable Criteria</label>
                  <textarea
                    rows="2"
                    placeholder="Specify the work items expected for this milestone..."
                    value={newMilestone.description}
                    onChange={(e) =>
                      setNewMilestone((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>

                <div className="form-actions full-width">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isCreatingMilestone}
                  >
                    {isCreatingMilestone ? 'Adding Milestone...' : 'Add Milestone'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Milestones List */}
          <div className="milestones-list">
            {milestones.length === 0 ? (
              <div className="empty-subcard">
                <p>
                  No milestones defined yet.{' '}
                  {isOrganizer ? 'Create milestones above to guide the student.' : ''}
                </p>
              </div>
            ) : (
              milestones.map((m, idx) => (
                <div key={m._id} className={`milestone-card status-${m.status}`}>
                  <div className="milestone-card-top">
                    <div className="milestone-num-title">
                      <span className="milestone-num">#{idx + 1}</span>
                      <h4>{m.title}</h4>
                    </div>
                    <span className={`status-badge badge-${m.status}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>

                  {m.description && (
                    <p className="milestone-desc">{m.description}</p>
                  )}

                  {m.dueDate && (
                    <div className="milestone-due">
                      📅 Due: {new Date(m.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Submission Note Display */}
                  {m.submissionNote && (
                    <div className="submission-note-display">
                      <span className="note-label">Student Submission Note:</span>
                      <p>"{m.submissionNote}"</p>
                    </div>
                  )}

                  {/* STUDENT ACTION: Submit Milestone */}
                  {isSelectedStudent && (m.status === 'pending' || m.status === 'rejected') && (
                    <div className="student-submit-box">
                      <h5>Submit Milestone Work</h5>
                      <div className="submission-input-group">
                        <textarea
                          rows="2"
                          placeholder="Describe the completed work, links to demo/repository, or deliverables..."
                          value={submissionNotes[m._id] || ''}
                          onChange={(e) =>
                            setSubmissionNotes((prev) => ({
                              ...prev,
                              [m._id]: e.target.value
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitMilestoneWork(m._id)}
                          className="btn btn-primary"
                          disabled={submittingMilestoneId === m._id}
                        >
                          {submittingMilestoneId === m._id ? 'Submitting...' : 'Submit Milestone'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CLUB ACTION: Review Milestone */}
                  {isOrganizer && m.status === 'submitted' && (
                    <div className="club-review-box">
                      <h5>Review Submission</h5>
                      <p>Check the student's work and approve or request revisions:</p>
                      <div className="review-action-btns">
                        <button
                          onClick={() => handleReviewMilestone(m._id, 'approved')}
                          className="btn btn-success"
                          disabled={reviewingMilestoneId === m._id}
                        >
                          ✓ Approve Milestone
                        </button>
                        <button
                          onClick={() => handleReviewMilestone(m._id, 'rejected')}
                          className="btn btn-danger"
                          disabled={reviewingMilestoneId === m._id}
                        >
                          ✕ Reject / Request Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {m.status === 'approved' && (
                    <div className="approved-stamp">
                      <span>✓ Milestone Approved & Verified</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PROJECT COMPLETION RATING & REVIEWS SECTION */}
      {/* ============================================================ */}
      {project.status === 'completed' && (
        <div className="project-review-section-card">
          <div className="review-section-header">
            <div>
              <h3>Campus Project Performance Review & Rating</h3>
              <p>Official verified performance feedback for student portfolio and campus credentials</p>
            </div>
            <span className="status-badge badge-completed">Project Completed</span>
          </div>

          {/* If Review Already Exists: Showcase Verified Review */}
          {project.review && project.review.rating ? (
            <div className="verified-review-card">
              <div className="verified-review-top">
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star-icon ${star <= project.review.rating ? 'filled' : 'empty'}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="rating-num">({project.review.rating}.0 / 5.0)</span>
                </div>
                <span className="review-date-badge">
                  Verified Review • {project.review.createdAt ? new Date(project.review.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>

              <blockquote className="review-feedback-quote">
                "{project.review.feedback || 'Work completed successfully according to specifications.'}"
              </blockquote>

              <div className="review-footer-meta">
                <div className="reviewer-info">
                  <span>Reviewed by organizer: <strong>{project.organizer?.name}</strong></span>
                </div>

                {project.review.endorsedSkills && project.review.endorsedSkills.length > 0 && (
                  <div className="endorsed-skills-list">
                    <span className="endorsed-label">Endorsed Skills:</span>
                    {project.review.endorsedSkills.map((tag, idx) => (
                      <span key={idx} className="endorsed-skill-pill">
                        🏅 {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : isOrganizer ? (
            /* Club Organizer Form: Rate & Review Completed Project */
            <div className="submit-review-box">
              <h4>Rate Student Performance & Endorse Skills</h4>
              <p>Evaluate {project.selectedStudent?.name || 'the student'} to help build their verified campus portfolio.</p>

              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="form-group">
                  <label>Overall Performance Rating (1 to 5 Stars):</label>
                  <div className="star-rating-picker">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        type="button"
                        key={starVal}
                        className={`star-pick-btn ${starVal <= rating ? 'active' : ''}`}
                        onClick={() => setRating(starVal)}
                      >
                        ★
                      </button>
                    ))}
                    <span className="star-selected-text">
                      {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5/5)' :
                       rating === 4 ? '⭐⭐⭐⭐ Very Good (4/5)' :
                       rating === 3 ? '⭐⭐⭐ Satisfactory (3/5)' :
                       rating === 2 ? '⭐⭐ Needs Improvement (2/5)' : '⭐ Unsatisfactory (1/5)'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reviewFeedback">Written Performance Testimonial *</label>
                  <textarea
                    id="reviewFeedback"
                    rows="3"
                    placeholder="Describe the student's work quality, responsiveness, creativity, and delivery standards..."
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    required
                  ></textarea>
                </div>

                {project.requiredSkills && project.requiredSkills.length > 0 && (
                  <div className="form-group">
                    <label>Skill Endorsements (Select skills demonstrated by student):</label>
                    <div className="endorse-chips-grid">
                      {project.requiredSkills.map((req, idx) => {
                        const isEndorsed = endorsedSkills.includes(req.tag);
                        return (
                          <button
                            type="button"
                            key={idx}
                            className={`endorse-toggle-btn ${isEndorsed ? 'endorsed' : ''}`}
                            onClick={() => toggleEndorseSkill(req.tag)}
                          >
                            {isEndorsed ? '✓ ' : '+ '} Endorse {req.tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? 'Submitting Review...' : 'Publish Performance Review & Rating'}
                </button>
              </form>
            </div>
          ) : (
            /* Student View: Waiting for Club Review */
            <div className="empty-subcard">
              <p>Project is marked completed! Waiting for <strong>{project.organizer?.name}</strong> to publish their performance review and rating.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GigDetail;
