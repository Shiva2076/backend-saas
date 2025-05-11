// app.js - corrected version
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const errorHandler = require('./utils/errorHandler');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Import routes - ensure these files exist and export properly
const authRoutes = require('./routes/authRoutes');
const toolRoutes = require('./routes/toolRoutes');
const usageRoutes = require('./routes/usageRoutes');

// Verify routes are valid middleware functions
console.log('Auth Routes:', typeof authRoutes); // Should be 'function'
console.log('Tool Routes:', typeof toolRoutes); // Should be 'function'
console.log('Usage Routes:', typeof usageRoutes); // Should be 'function'

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/usage', usageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handler
app.use(errorHandler);

module.exports = app;