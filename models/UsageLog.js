const mongoose = require('mongoose');

const UsageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  toolName: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  error: {
    type: String
  }
});

module.exports = mongoose.model('UsageLog', UsageLogSchema);