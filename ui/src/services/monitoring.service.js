import api from './api';

// Generate mock monitoring data for development
const generateMockMonitoringData = (vmId, timeRange) => {
  const now = new Date();
  let startTime;
  let dataPoints;

  // Determine time range and number of data points
  switch (timeRange) {
    case '15m':
      startTime = new Date(now.getTime() - 15 * 60 * 1000);
      dataPoints = 15; // One per minute
      break;
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      dataPoints = 12; // One per 5 minutes
      break;
    case '6h':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      dataPoints = 12; // One per 30 minutes
      break;
    case '1d':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dataPoints = 24; // One per hour
      break;
    case '1w':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dataPoints = 28; // One per 6 hours
      break;
    default:
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      dataPoints = 12;
  }

  // Generate time points
  const interval = (now.getTime() - startTime.getTime()) / dataPoints;
  const timePoints = Array.from({ length: dataPoints + 1 }, (_, i) => {
    return new Date(startTime.getTime() + (i * interval));
  });

  // Generate mock data
  const mockData = timePoints.map(timestamp => {
    // Generate random values with some consistency
    const cpuBase = 20 + Math.random() * 30; // Base CPU usage 20-50%
    const memoryBase = 30 + Math.random() * 40; // Base memory usage 30-70%
    const diskBase = 40 + Math.random() * 30; // Base disk usage 40-70%

    // Add some variation but keep it somewhat consistent
    const cpuVariation = Math.random() * 10 - 5; // +/- 5%
    const memoryVariation = Math.random() * 6 - 3; // +/- 3%
    const diskVariation = Math.random() * 4 - 2; // +/- 2%

    // Network traffic with some spikes
    const networkSent = Math.floor(Math.random() * 1024 * 1024 * 5); // 0-5 MB
    const networkReceived = Math.floor(Math.random() * 1024 * 1024 * 10); // 0-10 MB

    return {
      timestamp: timestamp.toISOString(),
      cpu: {
        usagePercent: Math.min(100, Math.max(0, cpuBase + cpuVariation))
      },
      memory: {
        usagePercent: Math.min(100, Math.max(0, memoryBase + memoryVariation)),
        totalMB: 8192, // 8 GB
        usedMB: Math.floor((memoryBase + memoryVariation) * 81.92) // Convert percentage to MB
      },
      disk: [
        {
          usagePercent: Math.min(100, Math.max(0, diskBase + diskVariation)),
          totalGB: 100,
          usedGB: Math.floor((diskBase + diskVariation) * 1),
          path: '/'
        }
      ],
      network: {
        bytesSent: networkSent,
        bytesRecv: networkReceived
      }
    };
  });

  return mockData;
};

/**
 * Service for handling monitoring-related API calls
 */
const monitoringService = {
  /**
   * Get monitoring data for a VM with time range
   *
   * @param {string} vmId - ID of the VM
   * @param {Object} options - Query options
   * @param {string} options.timeRange - Time range (15m, 1h, 6h, 1d, 1w)
   * @param {string} options.granularity - Data granularity (raw, 1m, 5m, 15m, 1h, 1d)
   * @returns {Promise<Object>} - Monitoring data
   */
  getMonitoringData: async (vmId, options = {}) => {
    try {
      const { timeRange = '1h', granularity } = options;

      // Calculate start and end times based on timeRange
      const endTime = new Date();
      let startTime;
      let defaultGranularity;

      switch (timeRange) {
        case '15m':
          startTime = new Date(endTime.getTime() - 15 * 60 * 1000);
          defaultGranularity = 'raw';
          break;
        case '1h':
          startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
          defaultGranularity = 'raw';
          break;
        case '6h':
          startTime = new Date(endTime.getTime() - 6 * 60 * 60 * 1000);
          defaultGranularity = '1m';
          break;
        case '1d':
          startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
          defaultGranularity = '5m';
          break;
        case '1w':
          startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          defaultGranularity = '1h';
          break;
        default:
          startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // Default to 1 hour
          defaultGranularity = 'raw';
      }

      // Build query parameters
      const params = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        granularity: granularity || defaultGranularity
      };

      // For development: Use mock data if API is not available or mock data is enabled
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        try {
          const response = await api.get(`/monitoring/${vmId}`, { params });
          return formatMonitoringData(response.data);
        } catch (error) {
          console.warn('API getMonitoringData failed, using mock data for development');
          const mockData = generateMockMonitoringData(vmId, timeRange);
          return formatMonitoringData(mockData);
        }
      } else {
        // Production code or when mock data is disabled
        const response = await api.get(`/monitoring/${vmId}`, { params });
        return formatMonitoringData(response.data);
      }
    } catch (error) {
      console.error(`Get monitoring data error for ${vmId}:`, error);
      // Use mock data in development mode if authentication fails
      if (process.env.NODE_ENV === 'development' && error.response?.status === 401) {
        console.warn('API getMonitoringData failed due to authentication, using mock data for development');
        // Get timeRange from options or use default
        const mockTimeRange = options.timeRange || '1h';
        const mockData = generateMockMonitoringData(vmId, mockTimeRange);
        return formatMonitoringData(mockData);
      }
      throw error;
    }
  },

  /**
   * Get latest monitoring data for a VM
   *
   * @param {string} vmId - ID of the VM
   * @returns {Promise<Object>} - Latest monitoring data
   */
  getLatestMonitoringData: async (vmId) => {
    try {
      // For development: Use mock data if API is not available or mock data is enabled
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        try {
          const response = await api.get(`/monitoring/${vmId}/data`);
          return response.data;
        } catch (error) {
          console.warn('API getLatestMonitoringData failed, using mock data for development');

          // Generate current usage data
          const cpuUsage = Math.floor(Math.random() * 70) + 10; // 10-80%
          const memoryUsage = Math.floor(Math.random() * 70) + 20; // 20-90%
          const diskUsage = Math.floor(Math.random() * 40) + 30; // 30-70%
          const networkUsage = Math.floor(Math.random() * 10 * 1024 * 1024); // 0-10 MB/s

          return {
            cpu: cpuUsage,
            memory: memoryUsage,
            disk: diskUsage,
            network: networkUsage
          };
        }
      } else {
        // Production code or when mock data is disabled
        const response = await api.get(`/monitoring/${vmId}/data`);
        return response.data;
      }
    } catch (error) {
      console.error(`Get latest monitoring data error for ${vmId}:`, error);
      // Use mock data in development mode if authentication fails
      if (process.env.NODE_ENV === 'development' && error.response?.status === 401) {
        console.warn('API getLatestMonitoringData failed due to authentication, using mock data for development');

        // Generate current usage data
        const cpuUsage = Math.floor(Math.random() * 70) + 10; // 10-80%
        const memoryUsage = Math.floor(Math.random() * 70) + 20; // 20-90%
        const diskUsage = Math.floor(Math.random() * 40) + 30; // 30-70%
        const networkUsage = Math.floor(Math.random() * 10 * 1024 * 1024); // 0-10 MB/s

        return {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
          network: networkUsage
        };
      }
      throw error;
    }
  }
};

/**
 * Format raw monitoring data into chart-friendly format
 *
 * @param {Array} data - Raw monitoring data from API
 * @returns {Object} - Formatted data for charts
 */
const formatMonitoringData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      cpu: [],
      memory: [],
      disk: [],
      network: []
    };
  }

  // Format CPU data
  const cpu = data.map(item => ({
    timestamp: new Date(item.timestamp),
    value: item.cpu?.usagePercent || 0
  }));

  // Format memory data
  const memory = data.map(item => ({
    timestamp: new Date(item.timestamp),
    value: item.memory?.usagePercent || 0,
    total: item.memory?.totalMB || 0,
    used: item.memory?.usedMB || 0
  }));

  // Format disk data (take first disk if multiple)
  const disk = data.map(item => {
    const diskData = Array.isArray(item.disk) && item.disk.length > 0
      ? item.disk[0]
      : item.disk || {};

    return {
      timestamp: new Date(item.timestamp),
      value: diskData.usagePercent || 0,
      total: diskData.totalGB || 0,
      used: diskData.usedGB || 0,
      path: diskData.path || '/'
    };
  });

  // Format network data
  const network = data.map(item => ({
    timestamp: new Date(item.timestamp),
    sent: item.network?.bytesSent || 0,
    received: item.network?.bytesRecv || 0
  }));

  return {
    cpu,
    memory,
    disk,
    network
  };
};

export default monitoringService;