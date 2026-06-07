const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship'
    },
    company: { type: String, default: '' },
    category: { type: String, default: '' },

    title: { type: String, required: true },
    description: { type: String, default: '' },
    deadline: { type: Date },
    instructions: { type: String, default: '' },
    targetYear: { type: String, default: 'any' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
