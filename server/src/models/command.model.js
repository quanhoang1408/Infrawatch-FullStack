// src/models/command.model.js
const mongoose = require('mongoose');

const commandSchema = new mongoose.Schema(
  {
    vmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VM',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['UPDATE_SSH_KEY', 'RESTART_AGENT', 'SYSTEM_UPDATE'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    payload: {
      type: Object,
      required: true,
    },
    result: {
      status: {
        type: String,
        enum: ['SUCCESS', 'ERROR'],
      },
      message: {
        type: String,
      },
      data: {
        type: Object,
      },
      completedAt: {
        type: Date,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding pending commands for a VM
commandSchema.index({ vmId: 1, status: 1 });

// Index for expiration
commandSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Command = mongoose.model('Command', commandSchema);

module.exports = Command;
