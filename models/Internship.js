const mongoose = require('mongoose');


const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    duration: { type: String, default: '' },
    stipend: { type: String, default: '' },
    price: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Volunteer'],
      default: 'Paid'
    },
    workMode: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote'
    },
    description: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-briefcase' },
    link: { type: String, default: '' },
    skills: { type: [String], default: [] },
    postedDate: { type: String, default: '' },

    postedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Internship', internshipSchema);
