// src/services/vm.service.js
const VM = require('../models/vm.model');
const Provider = require('../models/provider.model');
const { createProviderService } = require('./provider/provider.factory');
const providerService = require('./provider.service');
const { ApiError } = require('../utils/errors');

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

module.exports = {
  syncVMs,
  getVMs,
  getVMById,
};