// src/api/v1/admin/vm-assignment.controller.js
const vmAssignmentService = require('../../../services/vm-assignment.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Assign a VM to a user
 */
const assignVM = asyncHandler(async (req, res) => {
  const { vmId, userId } = req.body;
  const assignment = await vmAssignmentService.assignVMToUser(vmId, userId, req.user._id);
  res.status(201).send(assignment);
});

/**
 * Unassign a VM from a user
 */
const unassignVM = asyncHandler(async (req, res) => {
  const { vmId, userId } = req.body;
  await vmAssignmentService.unassignVMFromUser(vmId, userId);
  res.status(204).send();
});

/**
 * Get all VM assignments
 */
const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await vmAssignmentService.getAllAssignments();
  res.send(assignments);
});

/**
 * Get VMs assigned to a user
 */
const getVMsAssignedToUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const vmIds = await vmAssignmentService.getVMsAssignedToUser(userId);
  res.send(vmIds);
});

/**
 * Get users assigned to a VM
 */
const getUsersAssignedToVM = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  const userIds = await vmAssignmentService.getUsersAssignedToVM(vmId);
  res.send(userIds);
});

module.exports = {
  assignVM,
  unassignVM,
  getAssignments,
  getVMsAssignedToUser,
  getUsersAssignedToVM,
};
