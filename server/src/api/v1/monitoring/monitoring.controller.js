// src/api/v1/monitoring/monitoring.controller.js
const { asyncHandler } = require('../../../utils/asyncHandler');
const monitoringService = require('../../../services/monitoring.service');
const agentService = require('../../../services/agent.service');

/**
 * Receive and save monitoring data from agent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMonitoringData = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  const monitoringData = req.body;

  // Save monitoring data
  await monitoringService.saveMonitoringData(vmId, monitoringData);

  // Update agent connection status
  await agentService.updateAgentConnectionStatus(vmId, true);

  res.status(201).send({ message: 'Monitoring data received successfully' });
});

/**
 * Get monitoring data for a VM
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonitoringData = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  const { startDate, endDate, limit } = req.query;

  let data;
  if (startDate && endDate) {
    // Get data within time range
    data = await monitoringService.getMonitoringDataByTimeRange(
      vmId, 
      new Date(startDate), 
      new Date(endDate), 
      limit ? parseInt(limit, 10) : 100
    );
  } else {
    // Get latest data
    data = await monitoringService.getLatestMonitoringData(vmId);
  }

  res.send(data);
});

/**
 * Receive heartbeat from agent and update status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const heartbeat = asyncHandler(async (req, res) => {
  const { vmId } = req.params;

  // Update connection status
  await agentService.updateAgentConnectionStatus(vmId, true);

  // Return expected interval for next heartbeat
  const nextExpectedInSeconds = 30; // Could be configurable

  res.send({
    message: 'Heartbeat received',
    nextExpectedInSeconds,
  });
});

module.exports = {
  sendMonitoringData,
  getMonitoringData,
  heartbeat,
};