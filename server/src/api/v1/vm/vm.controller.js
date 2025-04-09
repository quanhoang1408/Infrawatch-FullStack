// src/api/v1/vm/vm.controller.js
const vmService = require('../../../services/vm.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Get all VMs
 */
const getVMs = asyncHandler(async (req, res) => {
  // Optional: Sync VMs from providers before returning
  if (req.query.sync === 'true') {
    await vmService.syncVMs();
  }
  
  const vms = await vmService.getVMs();
  res.send(vms);
});

/**
 * Get VM by ID
 */
const getVM = asyncHandler(async (req, res) => {
  const vm = await vmService.getVMById(req.params.vmId);
  res.send(vm);
});

/**
 * Sync VMs from providers
 */
const syncVMs = asyncHandler(async (req, res) => {
  const providerId = req.query.providerId;
  const vms = await vmService.syncVMs(providerId);
  res.send(vms);
});

module.exports = {
  getVMs,
  getVM,
  syncVMs,
};