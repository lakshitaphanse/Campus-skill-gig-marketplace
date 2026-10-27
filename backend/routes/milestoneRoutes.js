const express = require('express');
const router = express.Router();
const { submitMilestone, reviewMilestone } = require('../controllers/milestoneController');
const { protect, requireRole } = require('../middleware/auth');

router.patch('/:id/submit', protect, requireRole('student'), submitMilestone);
router.patch('/:id/review', protect, requireRole('club'), reviewMilestone);

module.exports = router;
