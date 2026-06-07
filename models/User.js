const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  role: {
    type: String,
    enum: ['user', 'student', 'mentor', 'company', 'admin'],
    default: 'user'
  },

  status: {
    type: String,
    enum: ['active', 'pending', 'approved', 'blocked'],
    default: 'active'
  },

  year: { type: Number, min: 1, max: 6 },

  profile: {
    fullName: { type: String, default: '' },
    university: { type: String, default: '' },
    major: { type: String, default: '' },
    year: { type: Number, default: null },
    skills: { type: [String], default: [] },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },

  takenInternships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship'
  }],

  companyName: String,
  industry: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, default: '' },

  approved: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },

  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  internshipAlerts: { type: Boolean, default: true },
  unsubscribeToken: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
