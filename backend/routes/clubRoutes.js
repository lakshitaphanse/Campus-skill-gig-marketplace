const express = require('express');
const router = express.Router();
const { getClubs } = require('../controllers/clubController');

router.get('/', getClubs);
console.log(require('../controllers/clubController'));
module.exports = router;