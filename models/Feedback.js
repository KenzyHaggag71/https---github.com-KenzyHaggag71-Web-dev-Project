const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['company-to-student', 'student-review'],
      required: true
    },

    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

       For student-review: the student writing the review. */
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship'
    },

    rating: { type: Number, min: 1, max: 5 },
    text: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
