const Application = require('../models/Application');
const Project = require('../models/Project');

// @desc    Apply to a project/gig
// @route   POST /api/projects/:id/applications
// @access  Private (Student only)
const createApplication = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { interestNote } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply to this project because it is currently ${project.status}`
      });
    }

    // Check if the student has already applied
    const existingApp = await Application.findOne({
      project: projectId,
      applicant: req.user._id
    });

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this gig'
      });
    }

    const application = await Application.create({
      project: projectId,
      applicant: req.user._id,
      interestNote: interestNote || '',
      status: 'pending'
    });

    const populatedApp = await Application.findById(application._id)
      .populate('applicant', 'name email skills reliabilityScore completedProjects');

    res.status(201).json({
      success: true,
      application: populatedApp
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this gig'
      });
    }
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating application'
    });
  }
};

// @desc    Get all applications for a project
// @route   GET /api/projects/:id/applications
// @access  Private (Club organizer only)
const getProjectApplications = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Authorization: Only the organizer of the project can view applicants
    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the club organizer who posted this project can access its applications'
      });
    }

    const applications = await Application.find({ project: projectId })
      .populate('applicant', 'name email skills reliabilityScore completedProjects bio')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Get project applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching applications'
    });
  }
};

// @desc    Update application status (accept, reject, waitlist)
// @route   PATCH /api/applications/:id/status
// @access  Private (Club organizer only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, waitlistRank } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'waitlisted'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const project = await Project.findById(application.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Verify organizer owns the project
    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project organizer can update application status'
      });
    }

    // Handle acceptance
    if (status === 'accepted') {
      application.status = 'accepted';
      project.selectedStudent = application.applicant;
      project.status = 'in-progress';
      await project.save();
    } else if (status === 'waitlisted') {
      application.status = 'waitlisted';
      if (waitlistRank !== undefined) {
        application.waitlistRank = waitlistRank;
      }
    } else {
      application.status = status;
    }

    await application.save();

    const populatedApp = await Application.findById(application._id)
      .populate('applicant', 'name email skills reliabilityScore completedProjects bio');

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application: populatedApp,
      project
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating application status'
    });
  }
};

// @desc    Get student's own applications
// @route   GET /api/applications/my
// @access  Private (Student)
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'project',
        select: 'title category status organizer selectedStudent',
        populate: { path: 'organizer', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching your applications'
    });
  }
};

module.exports = {
  createApplication,
  getProjectApplications,
  updateApplicationStatus,
  getMyApplications
};
