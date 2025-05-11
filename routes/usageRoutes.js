const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const usageController = require('../controllers/usageController');

// Get usage stats for company
router.get('/stats', auth, usageController.getUsageStats);

// Get user's usage history
router.get('/history', auth, usageController.getUserUsage);

module.exports = router;  // This must be exported