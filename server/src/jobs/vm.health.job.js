// src/jobs/vm.health.job.js
const VM = require('../models/vm.model');
const Provider = require('../models/provider.model');
const { createProviderService } = require('../services/provider/provider.factory');

/**
 * Updates VM state for VMs in transitional states
 * Run this job frequently to keep VM state up-to-date
 */
const updateVMState = async () => {
  try {
    console.log('[Job] Updating VM states...');
    
    // Find VMs in transitional states (pending, stopping, rebooting)
    const transitionalStates = ['pending', 'stopping', 'rebooting'];
    const vms = await VM.find({ state: { $in: transitionalStates } });
    
    if (vms.length === 0) {
      return;
    }
    
    console.log(`[Job] Found ${vms.length} VMs in transitional states`);
    
    // Group VMs by provider to minimize API calls
    const vmsByProvider = {};
    vms.forEach(vm => {
      if (!vmsByProvider[vm.providerId]) {
        vmsByProvider[vm.providerId] = [];
      }
      vmsByProvider[vm.providerId].push(vm);
    });
    
    // Process each provider
    for (const [providerId, providerVMs] of Object.entries(vmsByProvider)) {
      try {
        // Get provider details
        const provider = await Provider.findById(providerId);
        if (!provider) {
          console.error(`[Job] Provider ${providerId} not found`);
          continue;
        }
        
        // Get credentials
        const credentials = provider.getDecryptedCredentials();
        
        // Create provider service
        const providerServiceInstance = createProviderService(provider.type, credentials);
        
        // Update each VM state
        for (const vm of providerVMs) {
          try {
            const vmDetails = await providerServiceInstance.getVM(vm.instanceId);
            
            // Update VM state
            if (vm.state !== vmDetails.state) {
              console.log(`[Job] Updating VM ${vm._id} state from ${vm.state} to ${vmDetails.state}`);
              vm.state = vmDetails.state;
              vm.lastSyncAt = new Date();
              await vm.save();
            }
          } catch (error) {
            console.error(`[Job] Error updating VM ${vm._id} state: ${error.message}`);
          }
        }
      } catch (error) {
        console.error(`[Job] Error processing provider ${providerId}: ${error.message}`);
      }
    }
    
    console.log('[Job] VM state update completed');
  } catch (error) {
    console.error(`[Job] VM state update error: ${error.message}`);
  }
};

module.exports = updateVMState;