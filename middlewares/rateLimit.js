const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const UsageLog = require('../models/UsageLog');

// Standard rate limiter - 5 requests per minute per user
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many requests from this user, please try again after a minute',
  keyGenerator: (req) => {
    return req.user.id; // Use user ID as the key
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this user, please try again after a minute'
    });
  }
});

// Abuse detection middleware
const detectAbuse = async (req, res, next) => {
  const userId = req.user.id;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    const recentRequests = await UsageLog.countDocuments({
      user: userId,
      timestamp: { $gte: fiveMinutesAgo }
    });

    if (recentRequests >= 30) {
      // Mark user as potentially abusive
      await User.findByIdAndUpdate(userId, { isActive: false });
      
      return res.status(429).json({
        message: 'Account temporarily suspended due to excessive usage. Please contact support.'
      });
    }

    next();
  } catch (err) {
    console.error('Abuse detection error:', err);
    next(err);
  }
};

module.exports = {
  apiLimiter,
  detectAbuse
};