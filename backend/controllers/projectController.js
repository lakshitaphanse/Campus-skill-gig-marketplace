const mongoose = require('mongoose');
const Project = require('../models/Project');

// @desc    Create a project (club only)
// @route   POST /api/projects
const createProject = async (req, res) => {
  try {
    const { title, description, category, requiredSkills } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Please provide title, description, and category.' });
    }

    const project = await Project.create({
      title,
      description,
      category,
      requiredSkills: requiredSkills || [],
      organizer: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error creating project.' });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
const getProjects = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const projects = await Project.find(filter)
      .populate('organizer', 'name email role')
      .populate('selectedStudent', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error.message);
    res.status(500).json({ message: 'Server error fetching projects.' });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(req.params.id)
      .populate('organizer', 'name email role')
      .populate('selectedStudent', 'name email skills reliabilityScore');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project by ID error:', error.message);
    res.status(500).json({ message: 'Server error fetching project.' });
  }
};

// @desc    Submit rating and review for completed project
// @route   POST /api/projects/:id/review
// @access  Private (Club organizer only)
const submitProjectReview = async (req, res) => {
  try {
    const { rating, feedback, endorsedSkills } = req.body;
    const numRating = Number(rating);

    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (String(project.organizer) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the project organizer can rate and review this project'
      });
    }

    if (project.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only submit reviews for completed projects'
      });
    }

    if (project.review && project.review.rating) {
      return res.status(400).json({
        success: false,
        message: 'A review has already been submitted for this project'
      });
    }

    project.review = {
      rating: numRating,
      feedback: feedback || '',
      endorsedSkills: Array.isArray(endorsedSkills) ? endorsedSkills : [],
      createdAt: new Date()
    };

    await project.save();

    // Update student's ratings and reliability profile
    const User = require('../models/User');
    const student = await User.findById(project.selectedStudent);
    if (student) {
      const allCompletedProjects = await Project.find({
        selectedStudent: student._id,
        status: 'completed',
        'review.rating': { $ne: null }
      });

      const totalRatings = allCompletedProjects.reduce((acc, p) => acc + (p.review?.rating || 0), 0);
      const count = allCompletedProjects.length;
      student.totalReviews = count;
      student.averageRating = count > 0 ? Number((totalRatings / count).toFixed(1)) : 5.0;

      // Adjust reliability score based on high ratings (5-star rewards)
      if (numRating === 5 && student.reliabilityScore < 100) {
        student.reliabilityScore = Math.min(100, student.reliabilityScore + 2);
      }
      await student.save();
    }

    const populatedProject = await Project.findById(project._id)
      .populate('organizer', 'name email bio')
      .populate('selectedStudent', 'name email skills reliabilityScore completedProjects averageRating totalReviews');

    res.status(200).json({
      success: true,
      message: 'Review and rating submitted successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error submitting review'
    });
  }
};

// @desc    Get student portfolio with past works and reviews
// @route   GET /api/projects/student/:studentId/portfolio
// @access  Private (Authenticated users)
const getStudentPortfolio = async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.params.studentId).select('-password');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const completedProjects = await Project.find({
      selectedStudent: student._id,
      status: 'completed'
    })
      .populate('organizer', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      student,
      completedProjects
    });
  } catch (error) {
    console.error('Get student portfolio error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching student portfolio'
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  submitProjectReview,
  getStudentPortfolio
};
