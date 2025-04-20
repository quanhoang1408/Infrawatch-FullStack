// src/services/command.service.js
const { Command, VM } = require('../models');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create a new command for a VM
 * @param {Object} commandData - Command data
 * @param {string} commandData.vmId - VM ID
 * @param {string} commandData.type - Command type
 * @param {Object} commandData.payload - Command payload
 * @param {string} [commandData.createdBy] - User ID who created the command
 * @returns {Promise<Object>} - Created command
 */
const createCommand = async (commandData) => {
  try {
    // Check if VM exists
    const vm = await VM.findById(commandData.vmId);
    if (!vm) {
      throw new ApiError(404, 'VM not found');
    }

    // Set expiration time (default: 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create command
    const command = await Command.create({
      ...commandData,
      expiresAt,
    });

    logger.info(`Command created: ${command._id} for VM: ${vm._id}, type: ${command.type}`);
    return command;
  } catch (error) {
    logger.error('Error creating command:', error);
    throw error;
  }
};

/**
 * Get pending commands for a VM
 * @param {string} vmId - VM ID
 * @returns {Promise<Array>} - Array of pending commands
 */
const getPendingCommandsForVM = async (vmId) => {
  try {
    const commands = await Command.find({
      vmId,
      status: 'PENDING',
    }).sort({ createdAt: 1 });

    return commands;
  } catch (error) {
    logger.error(`Error getting pending commands for VM ${vmId}:`, error);
    throw error;
  }
};

/**
 * Update command status
 * @param {string} commandId - Command ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated command
 */
const updateCommandStatus = async (commandId, status) => {
  try {
    const command = await Command.findByIdAndUpdate(
      commandId,
      { status },
      { new: true }
    );

    if (!command) {
      throw new ApiError(404, 'Command not found');
    }

    logger.info(`Command ${commandId} status updated to ${status}`);
    return command;
  } catch (error) {
    logger.error(`Error updating command ${commandId} status:`, error);
    throw error;
  }
};

/**
 * Update command result
 * @param {string} commandId - Command ID
 * @param {Object} result - Command result
 * @param {string} result.status - Result status (SUCCESS or ERROR)
 * @param {string} result.message - Result message
 * @param {Object} [result.data] - Result data
 * @returns {Promise<Object>} - Updated command
 */
const updateCommandResult = async (commandId, result) => {
  try {
    const now = new Date();
    const command = await Command.findByIdAndUpdate(
      commandId,
      {
        status: 'COMPLETED',
        result: {
          ...result,
          completedAt: now,
        },
      },
      { new: true }
    );

    if (!command) {
      throw new ApiError(404, 'Command not found');
    }

    logger.info(`Command ${commandId} completed with status: ${result.status}`);
    return command;
  } catch (error) {
    logger.error(`Error updating command ${commandId} result:`, error);
    throw error;
  }
};

/**
 * Get command by ID
 * @param {string} commandId - Command ID
 * @returns {Promise<Object>} - Command
 */
const getCommandById = async (commandId) => {
  try {
    const command = await Command.findById(commandId);
    
    if (!command) {
      throw new ApiError(404, 'Command not found');
    }
    
    return command;
  } catch (error) {
    logger.error(`Error getting command ${commandId}:`, error);
    throw error;
  }
};

module.exports = {
  createCommand,
  getPendingCommandsForVM,
  updateCommandStatus,
  updateCommandResult,
  getCommandById,
};
