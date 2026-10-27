const mongoose = require('mongoose');
const Application = require('../models/Application');
const Project = require('../models/Project');

// @desc    Apply to a project (student only)
// @route   POST /api/projects/:id/applications
const applyToProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'This project is no longer accepting applications.' });
    }

    const { interestNote } = req.body;

    const application = await Application.create({
      project: project._id,
      applicant: req.user._id,
      interestNote: interestNote || '',
    });

    res.status(201).json(application);
  } catch (error) {
    // Handle duplicate application (unique index violation)
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this project.' });
    }
    console.error('Apply error:', error.message);
    res.status(500).json({ message: 'Server error applying to project.' });
  }
};

// @desc    Get applications for a project (owning organizer only)
// @route   GET /api/projects/:id/applications
const getApplications = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Ownership check
    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized. Only the project organizer can view applications.' });
    }

    const applications = await Application.find({ project: project._id })
      .populate('applicant', 'name email skills reliabilityScore')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error.message);
    res.status(500).json({ message: 'Server error fetching applications.' });
  }
};

// @desc    Update application status (owning organizer)
// @route   PATCH /api/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid application ID.' });
    }

    const { status } = req.body;

    if (!['accepted', 'rejected', 'waitlisted'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted, rejected, or waitlisted.' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    const project = await Project.findById(application.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Ownership check
    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized. Only the project organizer can manage applications.' });
    }

    // If accepting, ensure no one is already accepted
    if (status === 'accepted') {
      if (project.selectedStudent) {
        return res.status(400).json({ message: 'A student has already been accepted for this project.' });
      }

      // Set the project's selectedStudent and status
      project.selectedStudent = application.applicant;
      project.status = 'in-progress';
      await project.save();
    }

    application.status = status;
    if (status === 'waitlisted' && req.body.waitlistRank) {
      application.waitlistRank = req.body.waitlistRank;
    }
    await application.save();

    res.json(application);
  } catch (error) {
    console.error('Update application status error:', error.message);
    res.status(500).json({ message: 'Server error updating application status.' });
  }
};

module.exports = { applyToProject, getApplications, updateApplicationStatus };
