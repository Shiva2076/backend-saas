const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

// Register a new user and company
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('name', 'Name is required').not().isEmpty(),
    check('companyName', 'Company name is required').not().isEmpty()
  ],
  authController.register
);

// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// Get current user
router.get('/me', authController.getCurrentUser);

module.exports = router;  // This must be exported