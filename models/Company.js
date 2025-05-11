const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  monthlyUsage: {
    type: Number,
    default: 0
  },
  monthlyLimit: {
    type: Number,
    default: 100 // Free plan default
  },
  isActive: {
    type: Boolean,
    default: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

// Set monthly limit based on plan
CompanySchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    switch (this.plan) {
      case 'pro':
        this.monthlyLimit = 500;
        break;
      case 'enterprise':
        this.monthlyLimit = Infinity;
        break;
      default: // free
        this.monthlyLimit = 100;
    }
  }
  next();
});
module.exports = mongoose.model('Company', CompanySchema);