// src/api/v1/agent/agent.controller.js
const { command: commandService, agent: agentService } = require('../../../services');
const { asyncHandler } = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');

/**
 * Get pending commands for a VM
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCommands = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  
  // Update agent connection status
  await agentService.updateAgentConnectionStatus(vmId, true);
  
  // Get pending commands
  const commands = await commandService.getPendingCommandsForVM(vmId);
  
  // Format commands for agent
  const formattedCommands = commands.map(cmd => ({
    id: cmd._id,
    type: cmd.type,
    payload: cmd.payload,
  }));
  
  res.send(formattedCommands);
});

/**
 * Update command result
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCommandResult = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  const { commandId, status, message, data } = req.body;
  
  // Update agent connection status
  await agentService.updateAgentConnectionStatus(vmId, true);
  
  // Update command result
  await commandService.updateCommandResult(commandId, {
    status,
    message,
    data,
  });
  
  res.status(200).send({ message: 'Command result updated successfully' });
});

module.exports = {
  getCommands,
  updateCommandResult,
};
