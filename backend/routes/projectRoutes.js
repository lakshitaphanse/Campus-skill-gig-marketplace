const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  submitProjectReview,
  getStudentPortfolio
} = require('../controllers/projectController');
const { createApplication, getProjectApplications } = require('../controllers/applicationController');
const { createMilestone, getProjectMilestones } = require('../controllers/milestoneController');
const { protect, requireRole } = require('../middleware/auth');

// Project routes
router.route('/')
  .post(protect, requireRole('club'), createProject)
  .get(protect, getProjects);

router.route('/student/:studentId/portfolio')
  .get(protect, getStudentPortfolio);

router.route('/:id')
  .get(protect, getProjectById);

router.route('/:id/review')
  .post(protect, requireRole('club'), submitProjectReview);

// Nested routes for project applications
router.route('/:id/applications')
  .post(protect, requireRole('student'), createApplication)
  .get(protect, requireRole('club'), getProjectApplications);

// Nested routes for project milestones
router.route('/:id/milestones')
  .post(protect, requireRole('club'), createMilestone)
  .get(protect, getProjectMilestones);

module.exports = router;
