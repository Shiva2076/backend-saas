// In your usageController.js
const UsageService = require('../services/usageService');

const getUsageStats = async (req, res) => {
  try {
    const stats = await UsageService.getUsageStats(
      req.user.company, 
      req.query.period
    );
    res.json(stats);
  } catch (err) {
    console.error('Error getting usage stats:', err);
    res.status(500).json({ 
      message: 'Failed to get usage statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const getUserUsage = async (req, res) => {
  try {
    const history = await UsageService.getUserUsage(
      req.user.id,
      req.user.company,
      req.query.period
    );
    res.json(history);
  } catch (err) {
    console.error('Error getting user history:', err);
    res.status(500).json({ 
      message: 'Failed to get usage history',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getUsageStats,
  getUserUsage
};