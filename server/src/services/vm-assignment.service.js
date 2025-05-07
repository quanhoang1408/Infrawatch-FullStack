// src/services/vm-assignment.service.js
const { VMAssignment, VM, User } = require('../models');
const { ApiError } = require('../utils/errors');
const mongoose = require('mongoose');

/**
 * Assign a VM to a user
 * @param {string} vmId - VM ID
 * @param {string} userId - User ID
 * @param {string} adminId - Admin ID who is making the assignment
 * @returns {Promise<Object>} Assignment object
 */
const assignVMToUser = async (vmId, userId, adminId) => {
  // Check if VM exists
  const vm = await VM.findById(vmId);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if assignment already exists
  const existingAssignment = await VMAssignment.findOne({ vmId, userId });
  if (existingAssignment) {
    throw new ApiError(409, 'VM is already assigned to this user');
  }

  // Create assignment
  const assignment = await VMAssignment.create({
    vmId,
    userId,
    assignedBy: adminId,
  });

  return assignment;
};

/**
 * Unassign a VM from a user
 * @param {string} vmId - VM ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if unassigned successfully
 */
const unassignVMFromUser = async (vmId, userId) => {
  const result = await VMAssignment.deleteOne({ vmId, userId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, 'VM assignment not found');
  }
  return true;
};

/**
 * Get all VMs assigned to a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of VM IDs
 */
const getVMsAssignedToUser = async (userId) => {
  const assignments = await VMAssignment.find({ userId });
  return assignments.map(assignment => assignment.vmId);
};

/**
 * Get all users assigned to a VM
 * @param {string} vmId - VM ID
 * @returns {Promise<Array>} List of user IDs
 */
const getUsersAssignedToVM = async (vmId) => {
  const assignments = await VMAssignment.find({ vmId });
  return assignments.map(assignment => assignment.userId);
};

/**
 * Check if a user has access to a VM
 * @param {string} userId - User ID
 * @param {string} vmId - VM ID
 * @returns {Promise<boolean>} True if user has access
 */
const hasAccessToVM = async (userId, vmId) => {
  const assignment = await VMAssignment.findOne({ userId, vmId });
  return !!assignment;
};

/**
 * Get all VM assignments with populated user and VM data
 * @returns {Promise<Array>} List of assignments
 */
const getAllAssignments = async () => {
  return VMAssignment.find()
    .populate('userId', 'name email role')
    .populate('vmId', 'name instanceId ipAddress state')
    .populate('assignedBy', 'name email');
};

module.exports = {
  assignVMToUser,
  unassignVMFromUser,
  getVMsAssignedToUser,
  getUsersAssignedToVM,
  hasAccessToVM,
  getAllAssignments,
};
