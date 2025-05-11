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
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const toolRoutes = require('./routes/toolRoutes');
const usageRoutes = require('./routes/usageRoutes');


console.log('Auth Routes:', typeof authRoutes); 
console.log('Tool Routes:', typeof toolRoutes); 
console.log('Usage Routes:', typeof usageRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/usage', usageRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/', (req, res) => {
  res.send('API is running 🎉');
});

app.use(errorHandler);

module.exports = app;
