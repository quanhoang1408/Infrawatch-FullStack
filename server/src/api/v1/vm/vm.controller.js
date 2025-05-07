// src/api/v1/vm/vm.controller.js
const { vm: vmService, command: commandService, vault: vaultService } = require('../../../services');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Get all VMs based on user role and permissions
 */
const getVMs = asyncHandler(async (req, res) => {
  // Optional: Sync VMs from providers before returning
  if (req.query.sync === 'true' && ['admin', 'superadmin'].includes(req.user.role)) {
    await vmService.syncVMs();
  }

  // Pass user object to filter VMs based on role and assignments
  const vms = await vmService.getVMs(req.user);
  res.send(vms);
});

/**
 * Get VM by ID with permission check
 */
const getVM = asyncHandler(async (req, res) => {
  const vm = await vmService.getVMById(req.params.vmId, req.user);
  res.send(vm);
});

/**
 * Sync VMs from providers (admin only)
 */
const syncVMs = asyncHandler(async (req, res) => {
  const providerId = req.query.providerId;
  const vms = await vmService.syncVMs(providerId);
  res.send(vms);
});

/**
 * Start VM with permission check
 */
const startVM = asyncHandler(async (req, res) => {
  await vmService.startVM(req.params.vmId, req.user._id, req.user);
  res.status(202).send({
    message: `Start request accepted for VM ${req.params.vmId}`,
  });
});

/**
 * Stop VM with permission check
 */
const stopVM = asyncHandler(async (req, res) => {
  await vmService.stopVM(req.params.vmId, req.user._id, req.user);
  res.status(202).send({
    message: `Stop request accepted for VM ${req.params.vmId}`,
  });
});

/**
 * Reboot VM with permission check
 */
const rebootVM = asyncHandler(async (req, res) => {
  await vmService.rebootVM(req.params.vmId, req.user._id, req.user);
  res.status(202).send({
    message: `Reboot request accepted for VM ${req.params.vmId}`,
  });
});

/**
 * Update SSH key for VM (admin only)
 */
const updateSSHKey = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  const { sshUser } = req.body;

  // Get VM to verify it exists (admin check is done in the route middleware)
  await vmService.getVMById(vmId, req.user);

  // Generate SSH key using Vault
  const sshKeyData = await vaultService.signSSHKey(sshUser, vmId);

  // Create command for agent to execute
  const command = await commandService.createCommand({
    vmId,
    type: 'UPDATE_SSH_KEY',
    payload: {
      sshUser,
      publicKey: sshKeyData.publicKey,
      signedKey: sshKeyData.signedKey,
      serialNumber: sshKeyData.serialNumber
    },
    createdBy: req.user._id
  });

  res.status(202).send({
    message: `SSH key update command created for VM ${vmId}`,
    commandId: command._id
  });
});

module.exports = {
  getVMs,
  getVM,
  syncVMs,
  startVM,
  stopVM,
  rebootVM,
  updateSSHKey,
};