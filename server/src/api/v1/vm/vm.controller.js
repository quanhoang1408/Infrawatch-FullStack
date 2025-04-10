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

/**
 * Start VM
 */
const startVM = asyncHandler(async (req, res) => {
  await vmService.startVM(req.params.vmId, req.user._id);
  res.status(202).send({
    message: `Start request accepted for VM ${req.params.vmId}`,
  });
});

/**
 * Stop VM
 */
const stopVM = asyncHandler(async (req, res) => {
  await vmService.stopVM(req.params.vmId, req.user._id);
  res.status(202).send({
    message: `Stop request accepted for VM ${req.params.vmId}`,
  });
});

/**
 * Reboot VM
 */
const rebootVM = asyncHandler(async (req, res) => {
  await vmService.rebootVM(req.params.vmId, req.user._id);
  res.status(202).send({
    message: `Reboot request accepted for VM ${req.params.vmId}`,
  });
});

module.exports = {
  getVMs,
  getVM,
  syncVMs,
  startVM,
  stopVM,
  rebootVM,
};