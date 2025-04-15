// src/models/activity.model.js
const mongoose = require('mongoose');

const activitySchema = mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success',
    },
    errorMessage: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for performance
activitySchema.index({ action: 1, timestamp: -1 });
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });

// Convert to JSON method
activitySchema.methods.toJSON = function() {
  const activity = this.toObject();
  delete activity.__v;
  return activity;
};

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;