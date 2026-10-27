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

module.exports = { createProject, getProjects, getProjectById };
