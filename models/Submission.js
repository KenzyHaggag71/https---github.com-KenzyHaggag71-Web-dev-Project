const mongoose = require('mongoose');


const submissionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    title: { type: String, required: true },
   link: {
  type: String,
  required: true,
  trim: true
},
    description: { type: String, default: '' },

    status: {
      type: String,
      enum: ['submitted', 'evaluated'],
      default: 'submitted'
    },

        grade: { type: String, default: '' },
    feedback: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
