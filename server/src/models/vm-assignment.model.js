// src/models/vm-assignment.model.js
const mongoose = require('mongoose');

const vmAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VM',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for fast lookups and to ensure uniqueness
vmAssignmentSchema.index({ userId: 1, vmId: 1 }, { unique: true });

const VMAssignment = mongoose.model('VMAssignment', vmAssignmentSchema);

module.exports = VMAssignment;
