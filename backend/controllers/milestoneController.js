const mongoose = require('mongoose');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');

// @desc    Create a milestone (owning organizer)
// @route   POST /api/projects/:id/milestones
const createMilestone = async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized. Only the project organizer can create milestones.' });
    }

    const { title, description, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Milestone title is required.' });
    }

    const milestone = await Milestone.create({
      project: project._id,
      title,
      description: description || '',
      dueDate: dueDate || null,
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error('Create milestone error:', error.message);
    res.status(500).json({ message: 'Server error creating milestone.' });
  }
};

// @desc    Get milestones for a project (organizer or selected student)
// @route   GET /api/projects/:id/milestones
const getMilestones = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only organizer or selected student can see milestones
    const isOrganizer = String(project.organizer) === String(req.user._id);
    const isSelectedStudent =
      project.selectedStudent &&
      String(project.selectedStudent) === String(req.user._id);

    if (!isOrganizer && !isSelectedStudent) {
      return res.status(403).json({ message: 'Not authorized to view milestones for this project.' });
    }

    const milestones = await Milestone.find({ project: project._id }).sort({
      createdAt: 1,
    });

    res.json(milestones);
  } catch (error) {
    console.error('Get milestones error:', error.message);
    res.status(500).json({ message: 'Server error fetching milestones.' });
  }
};

// @desc    Submit a milestone (selected student only)
// @route   PATCH /api/milestones/:id/submit
const submitMilestone = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid milestone ID.' });
    }

    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found.' });
    }

    const project = await Project.findById(milestone.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only selected student can submit
    if (String(project.selectedStudent) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the selected student can submit this milestone' });
    }

    if (milestone.status !== 'pending' && milestone.status !== 'rejected') {
      return res.status(400).json({ message: 'This milestone cannot be submitted in its current status.' });
    }

    milestone.status = 'submitted';
    milestone.submissionNote = req.body.submissionNote || '';
    await milestone.save();

    res.json(milestone);
  } catch (error) {
    console.error('Submit milestone error:', error.message);
    res.status(500).json({ message: 'Server error submitting milestone.' });
  }
};

// @desc    Review a milestone (owning organizer: approved | rejected)
// @route   PATCH /api/milestones/:id/review
const reviewMilestone = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid milestone ID.' });
    }

    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Review status must be approved or rejected.' });
    }

    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found.' });
    }

    const project = await Project.findById(milestone.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Ownership check
    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized. Only the project organizer can review milestones.' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted milestones can be reviewed.' });
    }

    milestone.status = status;
    await milestone.save();

    // Check if ALL milestones are approved -> project completed
    if (status === 'approved') {
      const allMilestones = await Milestone.find({ project: project._id });
      const allApproved =
        allMilestones.length > 0 &&
        allMilestones.every((m) => m.status === 'approved');

      if (allApproved) {
        project.status = 'completed';
        await project.save();

        // Update student stats
        const User = require('../models/User');
        await User.findByIdAndUpdate(project.selectedStudent, {
          $inc: { completedProjects: 1 },
        });
      }
    }

    // Refetch to return updated milestone
    const updatedMilestone = await Milestone.findById(req.params.id);
    res.json(updatedMilestone);
  } catch (error) {
    console.error('Review milestone error:', error.message);
    res.status(500).json({ message: 'Server error reviewing milestone.' });
  }
};

module.exports = { createMilestone, getMilestones, submitMilestone, reviewMilestone };
