const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: [
        'Development',
        'Design & Art',
        'Performance',
        'Writing & Content',
        'Marketing & Outreach',
        'Event & Operations',
      ],
      required: [true, 'Category is required'],
    },
    requiredSkills: [
      {
        tag: { type: String, required: true },
        minLevel: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced'],
          required: true,
        },
      },
    ],
    isMonetary: {
      type: Boolean,
      default: false,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    selectedStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
