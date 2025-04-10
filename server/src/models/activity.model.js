// src/models/activity.model.js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['vm:start', 'vm:stop', 'vm:reboot', 'vm:sync', 'provider:add', 'provider:update', 'provider:delete', 'user:login', 'user:logout'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['vm', 'provider', 'user'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resourceType',
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
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups by user or resource
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;