// src/services/vm.service.js
const VM = require('../models/vm.model');
const Provider = require('../models/provider.model');
const VMAssignment = require('../models/vm-assignment.model');
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
  console.log(`[Sync] Starting VM sync ${providerId ? `for provider ID: ${providerId}` : 'for all providers'}`);

  // Get providers to sync
  let providers;
  if (providerId) {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      console.error(`[Sync] Provider not found with ID: ${providerId}`);
      throw new ApiError(404, 'Provider not found');
    }
    providers = [provider];
    console.log(`[Sync] Found provider: ${provider.name} (${provider.type})`);
  } else {
    providers = await Provider.find({ status: 'active' });
    console.log(`[Sync] Found ${providers.length} active providers`);
  }

  // Process each provider
  const results = [];
  for (const provider of providers) {
    try {
      console.log(`[Sync] Processing provider: ${provider.name} (${provider.type})`);

      // Get decrypted credentials
      const credentials = provider.getDecryptedCredentials();
      console.log(`[Sync] Successfully decrypted credentials for provider: ${provider.name}`);

      // Create provider service
      const providerServiceInstance = createProviderService(provider.type, credentials);
      console.log(`[Sync] Created provider service for: ${provider.type}`);

      // Get VMs from provider
      console.log(`[Sync] Fetching VMs from provider: ${provider.name}`);
      const providerVMs = await providerServiceInstance.listVMs();
      console.log(`[Sync] Found ${providerVMs.length} VMs from provider: ${provider.name}`);

      // Process VMs
      for (const vmData of providerVMs) {
        try {
          console.log(`[Sync] Processing VM: ${vmData.name} (${vmData.instanceId})`);

          // Check if VM already exists in our DB
          const existingVM = await VM.findOne({
            provider: provider.type,
            instanceId: vmData.instanceId,
            providerId: provider._id,
          });

          if (existingVM) {
            // Update existing VM
            console.log(`[Sync] Updating existing VM: ${existingVM.name} (${existingVM._id})`);
            existingVM.name = vmData.name;
            existingVM.state = vmData.state;
            existingVM.ipAddress = vmData.ipAddress;
            existingVM.publicIpAddress = vmData.publicIpAddress;
            existingVM.lastSyncAt = new Date();
            await existingVM.save();
            results.push(existingVM);
            console.log(`[Sync] VM updated: ${existingVM.name} (${existingVM._id})`);
          } else {
            // Create new VM
            console.log(`[Sync] Creating new VM: ${vmData.name} (${vmData.instanceId})`);
            const newVM = await VM.create({
              ...vmData,
              provider: provider.type,
              providerId: provider._id,
            });
            results.push(newVM);
            console.log(`[Sync] New VM created: ${newVM.name} (${newVM._id})`);
          }
        } catch (vmError) {
          console.error(`[Sync] Error processing VM ${vmData.name} (${vmData.instanceId}): ${vmError.message}`);
          // Continue with next VM
        }
      }

      // Update provider sync time
      await providerService.updateProviderSyncTime(provider._id);
      console.log(`[Sync] Updated sync time for provider: ${provider.name}`);
    } catch (error) {
      console.error(`[Sync] Error syncing VMs from provider ${provider.name}: ${error.message}`, error);
      // Continue with next provider
    }
  }

  console.log(`[Sync] VM sync completed. Total VMs: ${results.length}`);
  return results;
};

/**
 * Get all VMs based on user role and assignments
 * @param {Object} user - User object with role
 * @returns {Promise<Array>} Array of VMs
 */
const getVMs = async (user = null) => {
  // If no user is provided or user is admin/superadmin, return all VMs
  if (!user || ['admin', 'superadmin'].includes(user.role)) {
    return VM.find();
  }

  // For regular users, only return VMs assigned to them
  const assignments = await VMAssignment.find({ userId: user._id });
  const vmIds = assignments.map(assignment => assignment.vmId);

  if (vmIds.length === 0) {
    return [];
  }

  return VM.find({ _id: { $in: vmIds } });
};

/**
 * Get VM by ID with permission check
 * @param {string} id - VM ID
 * @param {Object} user - User object with role
 * @returns {Promise<Object>} VM object
 */
const getVMById = async (id, user = null) => {
  const vm = await VM.findById(id);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // If no user is provided or user is admin/superadmin, allow access
  if (!user || ['admin', 'superadmin'].includes(user.role)) {
    return vm;
  }

  // For regular users, check if VM is assigned to them
  const assignment = await VMAssignment.findOne({ userId: user._id, vmId: id });
  if (!assignment) {
    throw new ApiError(403, 'You do not have permission to access this VM');
  }

  return vm;
};

/**
 * Start a VM with permission check
 * @param {string} id - VM ID
 * @param {string} userId - User ID for activity logging
 * @param {Object} user - User object with role
 * @returns {Promise<Object>} Updated VM object
 */
const startVM = async (id, userId, user = null) => {
  // Get VM with permission check
  const vm = await getVMById(id, user);
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
 * Stop a VM with permission check
 * @param {string} id - VM ID
 * @param {string} userId - User ID for activity logging
 * @param {Object} user - User object with role
 * @returns {Promise<Object>} Updated VM object
 */
const stopVM = async (id, userId, user = null) => {
  // Get VM with permission check
  const vm = await getVMById(id, user);
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
 * Reboot a VM with permission check
 * @param {string} id - VM ID
 * @param {string} userId - User ID for activity logging
 * @param {Object} user - User object with role
 * @returns {Promise<Object>} Updated VM object
 */
const rebootVM = async (id, userId, user = null) => {
  // Get VM with permission check
  const vm = await getVMById(id, user);
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
