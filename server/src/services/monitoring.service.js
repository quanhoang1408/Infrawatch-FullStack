// src/services/monitoring.service.js
const Monitoring = require('../models/monitoring.model');
const VM = require('../models/vm.model');
const { ApiError } = require('../utils/errors');
const sseService = require('./sse.service');

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

  // If VM has an owner, send SSE event
  if (vm.owner) {
    sseService.sendEventToUser(vm.owner.toString(), 'monitoring_update', {
      vmId,
      data: {
        timestamp: monitoring.timestamp,
        cpu: monitoring.cpu,
        memory: monitoring.memory,
        disk: monitoring.disk,
        network: monitoring.network
      }
    });
  }

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

/**
 * Query monitoring data with granularity
 * @param {string} vmId - MongoDB ID of the VM
 * @param {Date} startTime - Start time for the query
 * @param {Date} endTime - End time for the query
 * @param {string} granularity - Data granularity ('raw', '1m', '5m', '15m', '1h', '1d')
 * @returns {Promise<Array>} - Aggregated monitoring data
 */
const queryMonitoringData = async (vmId, startTime, endTime, granularity = 'raw') => {
  // Verify VM exists
  const vm = await VM.findById(vmId);
  if (!vm) {
    throw new ApiError(404, 'VM not found');
  }

  // Base query
  const query = {
    vmId,
    timestamp: {
      $gte: startTime,
      $lte: endTime,
    },
  };

  // If raw data is requested, simply return filtered data
  if (granularity === 'raw') {
    return Monitoring.find(query).sort({ timestamp: 1 }).exec();
  }

  // Convert granularity to milliseconds for aggregation
  const granularityInMs = getGranularityInMs(granularity);
  
  // Perform aggregation based on time buckets
  return aggregateMonitoringData(query, startTime, endTime, granularityInMs);
};

/**
 * Aggregate monitoring data based on time buckets
 * @param {Object} query - MongoDB query
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @param {number} intervalMs - Interval in milliseconds
 * @returns {Promise<Array>} - Aggregated data
 */
const aggregateMonitoringData = async (query, startTime, endTime, intervalMs) => {
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: {
          // Create time buckets based on granularity
          timeBucket: {
            $subtract: [
              { $toLong: "$timestamp" },
              { $mod: [{ $toLong: "$timestamp" }, intervalMs] }
            ]
          }
        },
        timestamp: { $first: "$timestamp" },
        avgCpuUsage: { $avg: "$cpu.usagePercent" },
        avgMemoryUsage: { $avg: "$memory.usagePercent" },
        disks: { $push: "$disk" },
        totalBytesSent: { $sum: "$network.bytesSent" },
        totalBytesRecv: { $sum: "$network.bytesRecv" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.timeBucket": 1 } },
    {
      $project: {
        _id: 0,
        timestamp: 1,
        cpu: { 
          usagePercent: { $round: ["$avgCpuUsage", 2] } 
        },
        memory: { 
          usagePercent: { $round: ["$avgMemoryUsage", 2] } 
        },
        network: {
          bytesSent: "$totalBytesSent",
          bytesRecv: "$totalBytesRecv"
        },
        dataPoints: "$count"
      }
    }
  ];

  return Monitoring.aggregate(pipeline).exec();
};

/**
 * Helper function to convert granularity string to milliseconds
 * @param {string} granularity - Granularity string ('1m', '5m', '15m', '1h', '1d')
 * @returns {number} - Granularity in milliseconds
 */
const getGranularityInMs = (granularity) => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  switch (granularity) {
    case '1m': return minute;
    case '5m': return 5 * minute;
    case '15m': return 15 * minute;
    case '1h': return hour;
    case '1d': return day;
    default: return minute; // Default to 1 minute if invalid
  }
};

module.exports = {
  saveMonitoringData,
  getLatestMonitoringData,
  getMonitoringDataByTimeRange,
  queryMonitoringData
};