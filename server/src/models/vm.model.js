// src/models/vm.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const vmSchema = new mongoose.Schema(
  {
    instanceId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['aws', 'azure', 'gcp', 'vmware'],
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    publicIpAddress: {
      type: String,
    },
    agentToken: {
      type: String,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    agentConnected: {
      type: Boolean,
      default: false,
    },
    lastSyncAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for fast lookups
vmSchema.index({ provider: 1, instanceId: 1, providerId: 1 }, { unique: true });

const VM = mongoose.model('VM', vmSchema);

module.exports = VM;