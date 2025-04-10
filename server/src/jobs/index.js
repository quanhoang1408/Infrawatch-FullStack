// src/jobs/index.js
const cron = require('node-cron');
const updateVMState = require('./vm.health.job');
const vmService = require('../services/vm.service');

/**
 * Initialize all scheduled jobs
 */
const initJobs = () => {
  // Update VM states for VMs in transitional states every minute
  cron.schedule('* * * * *', async () => {
    await updateVMState();
  });

  // Sync all VMs from all providers every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('[Job] Running VM synchronization');
      await vmService.syncVMs();
      console.log('[Job] VM synchronization completed');
    } catch (error) {
      console.error(`[Job] VM synchronization error: ${error.message}`);
    }
  });
};

module.exports = { initJobs };