// src/services/monitoring.service.js
const Monitoring = require('../models/monitoring.model');
const VM = require('../models/vm.model');
const { ApiError } = require('../utils/errors');

/**
 * Save monitoring data to database
 * @param {string} vmId - MongoDB ID of the VM
 * @param {Object} monitoringData - Monitoring data from agent
 * @returns {Promise<Object>} - Saved monitoring document
 */
const saveMonitoringData = async (vmId, monitoringData) => {
  // Verify VM exists
  const vm = await VM.findById(vmId);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Create monitoring record
  const monitoring = await Monitoring.create({
    vmId,
    timestamp: monitoringData.timestamp || new Date(),
    cpu: monitoringData.cpu,
    memory: monitoringData.memory,
    disk: monitoringData.disk,
    network: monitoringData.network,
  });

  return monitoring;
};

/**
 * Get latest monitoring data for a VM
 * @param {string} vmId - MongoDB ID of the VM
 * @returns {Promise<Object>} - Latest monitoring data
 */
const getLatestMonitoringData = async (vmId) => {
  // Verify VM exists
  const vm = await VM.findById(vmId);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  const latestData = await Monitoring.findOne({ vmId })
    .sort({ timestamp: -1 })
    .exec();

  if (!latestData) {
    throw new ApiError(404, 'No monitoring data found for this VM');
  }

  return latestData;
};

/**
 * Get monitoring data for a VM within a time range
 * @param {string} vmId - MongoDB ID of the VM
 * @param {Date} startDate - Start time
 * @param {Date} endDate - End time
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of monitoring data
 */
const getMonitoringDataByTimeRange = async (vmId, startDate, endDate, limit = 100) => {
  // Verify VM exists
  const vm = await VM.findById(vmId);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  const query = {
    vmId,
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  const data = await Monitoring.find(query)
    .sort({ timestamp: 1 })
    .limit(limit)
    .exec();

  return data;
};

module.exports = {
  saveMonitoringData,
  getLatestMonitoringData,
  getMonitoringDataByTimeRange,
};