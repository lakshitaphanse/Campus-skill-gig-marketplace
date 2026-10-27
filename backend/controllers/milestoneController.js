const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a milestone for a project
// @route   POST /api/projects/:id/milestones
// @access  Private (Club organizer only)
const createMilestone = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Milestone title is required'
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Authorization: Only the organizer can add milestones
    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project organizer can create milestones'
      });
    }

    const milestone = await Milestone.create({
      project: projectId,
      title,
      description: description || '',
      dueDate: dueDate || null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating milestone'
    });
  }
};

// @desc    Get all milestones for a project
// @route   GET /api/projects/:id/milestones
// @access  Private (Authenticated users)
const getProjectMilestones = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const milestones = await Milestone.find({ project: projectId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: milestones.length,
      milestones
    });
  } catch (error) {
    console.error('Get project milestones error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching milestones'
    });
  }
};

// @desc    Submit milestone work
// @route   PATCH /api/milestones/:id/submit
// @access  Private (Selected student only)
const submitMilestone = async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const { submissionNote } = req.body;

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    const project = await Project.findById(milestone.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Critical authorization logic: Only the selected student can submit this milestone
    if (String(project.selectedStudent) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the selected student can submit this milestone'
      });
    }

    milestone.submissionNote = submissionNote || '';
    milestone.status = 'submitted';
    await milestone.save();

    res.status(200).json({
      success: true,
      message: 'Milestone submitted successfully',
      milestone
    });
  } catch (error) {
    console.error('Submit milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error submitting milestone'
    });
  }
};

// @desc    Review milestone submission (Approve or Reject)
// @route   PATCH /api/milestones/:id/review
// @access  Private (Club organizer only)
const reviewMilestone = async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'"
      });
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    const project = await Project.findById(milestone.project);
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
        message: 'Only the project organizer can review milestones'
      });
    }

    milestone.status = status;
    await milestone.save();

    // Check project completion: if all milestones are approved, project becomes 'completed'
    let projectUpdated = false;
    if (status === 'approved') {
      const allMilestones = await Milestone.find({ project: project._id });
      const allApproved = allMilestones.length > 0 && allMilestones.every(m => m.status === 'approved');

      if (allApproved && project.status !== 'completed') {
        project.status = 'completed';
        await project.save();
        projectUpdated = true;

        // Increment student's completedProjects count
        if (project.selectedStudent) {
          await User.findByIdAndUpdate(project.selectedStudent, {
            $inc: { completedProjects: 1 }
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Milestone has been ${status}`,
      milestone,
      projectStatus: project.status
    });
  } catch (error) {
    console.error('Review milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error reviewing milestone'
    });
  }
};

module.exports = {
  createMilestone,
  getProjectMilestones,
  submitMilestone,
  reviewMilestone
};
