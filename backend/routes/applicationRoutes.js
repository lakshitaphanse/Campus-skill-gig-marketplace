const express = require('express');
const router = express.Router();
const { updateApplicationStatus, getMyApplications } = require('../controllers/applicationController');
const { protect, requireRole } = require('../middleware/auth');

router.patch('/:id/status', protect, requireRole('club'), updateApplicationStatus);
router.get('/my', protect, requireRole('student'), getMyApplications);

module.exports = router;
