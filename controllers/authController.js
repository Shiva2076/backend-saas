const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, companyName, plan = 'free' } = req.body;

  try {
    // Check if user exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create company first with empty admin
    const company = new Company({
      name: companyName,
      plan,
      monthlyUsage: 0
    });
    await company.save();

    // Create user with company reference
    const user = new User({
      email,
      password,
      name,
      role: 'admin',
      company: company._id,
      isActive: true
    });
    await user.save();

    // Update company with admin reference
    company.admin = user._id;
    await company.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        user: {
          id: user.id,
          role: user.role,
          company: user.company
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: company._id,
          name: company.name,
          plan: company.plan
        }
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Clean up if anything failed
    if (company && company._id) {
      await Company.deleteOne({ _id: company._id }).catch(e => console.error('Cleanup error:', e));
    }
    if (user && user._id) {
      await User.deleteOne({ _id: user._id }).catch(e => console.error('Cleanup error:', e));
    }

    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email }).populate('company');
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      {
        user: {
          id: user.id,
          role: user.role,
          company: user.company._id
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    // Since we already attached the user in the auth middleware
    // We can just send it back
    res.json(req.user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};