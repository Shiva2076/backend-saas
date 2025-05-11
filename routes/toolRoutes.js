const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { auth } = require('../middlewares/auth');
const { apiLimiter, detectAbuse } = require('../middlewares/rateLimit');
const toolController = require('../controllers/toolController');

// Use tool endpoint
router.post(
  '/use-tool',
  [
    auth,
    apiLimiter,
    detectAbuse,
    check('toolName', 'Tool name is required').not().isEmpty(),
    check('prompt', 'Prompt is required').not().isEmpty()
  ],
  toolController.useTool
);

// Chatbot endpoint with streaming
router.post(
  '/chatbot',
  [
    auth,
    apiLimiter,
    detectAbuse,
    check('messages', 'Messages array is required').isArray()
  ],
  toolController.chatbot
);

module.exports = router;  // This must be exported