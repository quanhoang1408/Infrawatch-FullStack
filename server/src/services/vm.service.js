// src/services/vm.service.js
const VM = require('../models/vm.model');
const Provider = require('../models/provider.model');
const { createProviderService } = require('./provider/provider.factory');
const providerService = require('./provider.service');
const activityService = require('./activity.service');
const { ApiError } = require('../utils/errors');
const sseService = require('./sse.service');

/**
 * Sync VMs from all providers or specific provider
 * @param {string} [providerId] - Optional provider ID to sync
 * @returns {Promise<Array>} Array of VMs
 */
const syncVMs = async (providerId = null) => {
  // Get providers to sync
  let providers;
  if (providerId) {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      throw new ApiError(404, 'Provider not found');
    }
    providers = [provider];
  } else {
    providers = await Provider.find({ status: 'active' });
  }

  // Process each provider
  const results = [];
  for (const provider of providers) {
    try {
      // Get decrypted credentials
      const credentials = provider.getDecryptedCredentials();

      // Create provider service
      const providerServiceInstance = createProviderService(provider.type, credentials);

      // Get VMs from provider
      const providerVMs = await providerServiceInstance.listVMs();

      // Process VMs
      for (const vmData of providerVMs) {
        // Check if VM already exists in our DB
        const existingVM = await VM.findOne({
          provider: provider.type,
          instanceId: vmData.instanceId,
          providerId: provider._id,
        });

        if (existingVM) {
          // Update existing VM
          existingVM.name = vmData.name;
          existingVM.state = vmData.state;
          existingVM.ipAddress = vmData.ipAddress;
          existingVM.publicIpAddress = vmData.publicIpAddress;
          existingVM.lastSyncAt = new Date();
          await existingVM.save();
          results.push(existingVM);
        } else {
          // Create new VM
          const newVM = await VM.create({
            ...vmData,
            provider: provider.type,
            providerId: provider._id,
          });
          results.push(newVM);
        }
      }

      // Update provider sync time
      await providerService.updateProviderSyncTime(provider._id);
    } catch (error) {
      console.error(`Error syncing VMs from provider ${provider.name}: ${error.message}`);
      // Continue with next provider
    }
  }

  return results;
};

/**
 * Get all VMs
 * @returns {Promise<Array>} Array of VMs
 */
const getVMs = async () => {
  return VM.find();
};

/**
 * Get VM by ID
 * @param {string} id - VM ID
 * @returns {Promise<Object>} VM object
 */
const getVMById = async (id) => {
  const vm = await VM.findById(id);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }
  return vm;
};

/**
 * Start a VM
 * @param {string} id - VM ID
 * @param {string} userId - User ID for activity logging
 * @returns {Promise<Object>} Updated VM object
 */
const startVM = async (id, userId) => {
  const vm = await VM.findById(id);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Check if VM is already running
  if (vm.state === 'running') {
    throw new ApiError(400, 'VM is already running');
  }

  // Log activity (pending)
  const activity = await activityService.logActivity({
    action: 'vm:start',
    user: userId,
    resourceType: 'vm',
    resourceId: vm._id,
    details: { instanceId: vm.instanceId, provider: vm.provider },
    status: 'pending',
  });

  try {
    // Get provider
    const provider = await Provider.findById(vm.providerId);
    if (!provider) {
      throw new ApiError(404, 'Provider not found');
    }

    // Get credentials
    const credentials = provider.getDecryptedCredentials();

    // Create provider service
    const providerServiceInstance = createProviderService(provider.type, credentials);

    // Start VM
    await providerServiceInstance.startVM(vm.instanceId);

    // Update VM state (set to pending, will be updated on next sync)
    vm.state = 'pending';
    await vm.save();

    // Update activity status
    await activityService.updateActivityStatus(activity._id, 'success');

    return vm;
  } catch (error) {
    // Update activity status with error
    await activityService.updateActivityStatus(activity._id, 'failure', error.message);
    throw error;
  }
};

/**
 * Stop a VM
 * @param {string} id - VM ID
 * @param {string} userId - User ID for activity logging
 * @returns {Promise<Object>} Updated VM object
 */
const stopVM = async (id, userId) => {
  const vm = await VM.findById(id);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Check if VM is already stopped
  if (vm.state === 'stopped') {
    throw new ApiError(400, 'VM is already stopped');
  }

  // Log activity (pending)
  const activity = await activityService.logActivity({
    action: 'vm:stop',
    user: userId,
    resourceType: 'vm',
    resourceId: vm._id,
    details: { instanceId: vm.instanceId, provider: vm.provider },
    status: 'pending',
  });

  try {
    // Get provider
    const provider = await Provider.findById(vm.providerId);
    if (!provider) {
      throw new ApiError(404, 'Provider not found');
    }

    // Get credentials
    const credentials = provider.getDecryptedCredentials();

    // Create provider service
    const providerServiceInstance = createProviderService(provider.type, credentials);

    // Stop VM
    await providerServiceInstance.stopVM(vm.instanceId);

    // Update VM state (set to stopping, will be updated on next sync)
    vm.state = 'stopping';
    await vm.save();

    // Update activity status
    await activityService.updateActivityStatus(activity._id, 'success');

    return vm;
  } catch (error) {
    // Update activity status with error
    await activityService.updateActivityStatus(activity._id, 'failure', error.message);
    throw error;
  }
};

/**
 * Reboot a VM
 * @param {string} id - VM ID
 * @param {string} userId - User ID for activity logging
 * @returns {Promise<Object>} Updated VM object
 */
const rebootVM = async (id, userId) => {
  const vm = await VM.findById(id);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Check if VM is running
  if (vm.state !== 'running') {
    throw new ApiError(400, 'VM must be running to reboot');
  }

  // Log activity (pending)
  const activity = await activityService.logActivity({
    action: 'vm:reboot',
    user: userId,
    resourceType: 'vm',
    resourceId: vm._id,
    details: { instanceId: vm.instanceId, provider: vm.provider },
    status: 'pending',
  });

  try {
    // Get provider
    const provider = await Provider.findById(vm.providerId);
    if (!provider) {
      throw new ApiError(404, 'Provider not found');
    }

    // Get credentials
    const credentials = provider.getDecryptedCredentials();

    // Create provider service
    const providerServiceInstance = createProviderService(provider.type, credentials);

    // Reboot VM
    await providerServiceInstance.rebootVM(vm.instanceId);

    // Update VM state (set to rebooting, will be updated on next sync)
    vm.state = 'rebooting';
    await vm.save();

    // Update activity status
    await activityService.updateActivityStatus(activity._id, 'success');

    return vm;
  } catch (error) {
    // Update activity status with error
    await activityService.updateActivityStatus(activity._id, 'failure', error.message);
    throw error;
  }
};

module.exports = {
  syncVMs,
  getVMs,
  getVMById,
  startVM,
  stopVM,
  rebootVM,
};
