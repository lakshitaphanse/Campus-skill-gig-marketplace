const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interestNote: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'waitlisted', 'withdrawn'],
      default: 'pending',
    },
    waitlistRank: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate applications
applicationSchema.index({ project: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
