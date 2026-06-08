const mongoose = require('mongoose');


const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentUniversity: { type: String, default: '' },
    studentMajor: { type: String, default: '' },

    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true
    },

        cvFilePath: { type: String, default: '' },
    cvFileName: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
