// src/services/agent.service.js
const VM = require('../models/vm.model');
const activityService = require('./activity.service');
const { ApiError } = require('../utils/errors');
const crypto = require('crypto');

/**
 * Update agent connection status
 * @param {string} vmId - MongoDB ID of the VM
 * @param {boolean} connected - Connection status
 * @returns {Promise<Object>} - Updated VM
 */
const updateAgentConnectionStatus = async (vmId, connected) => {
  const vm = await VM.findByIdAndUpdate(
    vmId,
    {
      $set: {
        agentConnected: connected,
        lastSeenAt: new Date(),
      },
    },
    { new: true }
  );

  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Log activity
  await activityService.logActivity({
    action: connected ? 'agent:connected' : 'agent:disconnected',
    resourceType: 'vm',
    resourceId: vm._id,
    details: {
      instanceId: vm.instanceId,
      name: vm.name,
      provider: vm.provider,
    },
    status: 'success',
  });

  return vm;
};

/**
 * Generate new agent token
 * @param {string} vmId - MongoDB ID of the VM
 * @returns {Promise<string>} - New token
 */
const generateNewAgentToken = async (vmId) => {
  const newToken = crypto.randomBytes(32).toString('hex');

  const vm = await VM.findByIdAndUpdate(
    vmId,
    {
      $set: {
        agentToken: newToken,
      },
    },
    { new: true }
  );

  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Log activity
  await activityService.logActivity({
    action: 'agent:token_refreshed',
    resourceType: 'vm',
    resourceId: vm._id,
    details: {
      instanceId: vm.instanceId,
      name: vm.name,
      provider: vm.provider,
    },
    status: 'success',
  });

  return newToken;
};

module.exports = {
  updateAgentConnectionStatus,
  generateNewAgentToken,
};