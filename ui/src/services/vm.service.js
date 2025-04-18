import api from './api';

// Mock data for development
const mockVMs = [
  {
    id: 'vm-1',
    name: 'Web Server',
    status: 'running',
    provider: 'aws',
    region: 'us-east-1',
    type: 't2.micro',
    cpu: 1,
    memory: 1024,
    disk: 30,
    ip: '192.168.1.10',
    os: 'Ubuntu 20.04',
    created: '2023-01-15T10:30:00Z'
  },
  {
    id: 'vm-2',
    name: 'Database Server',
    status: 'stopped',
    provider: 'azure',
    region: 'eastus',
    type: 'Standard_B2s',
    cpu: 2,
    memory: 4096,
    disk: 100,
    ip: '192.168.1.11',
    os: 'CentOS 8',
    created: '2023-02-20T14:45:00Z'
  },
  {
    id: 'vm-3',
    name: 'Application Server',
    status: 'running',
    provider: 'gcp',
    region: 'us-central1',
    type: 'e2-medium',
    cpu: 2,
    memory: 4096,
    disk: 50,
    ip: '192.168.1.12',
    os: 'Debian 11',
    created: '2023-03-10T09:15:00Z'
  }
];

// Mock monitoring data
const generateMockMonitoringData = (vmId) => {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  // Generate time points for the last hour (every 5 minutes)
  const timePoints = Array.from({ length: 12 }, (_, i) => {
    return new Date(hourAgo + (i * 5 * 60 * 1000)).toISOString();
  });

  // Generate CPU data (random values between 10-80%)
  const cpuData = timePoints.map(timestamp => ({
    timestamp,
    value: Math.floor(Math.random() * 70) + 10
  }));

  // Generate memory data (random values between 20-90%)
  const memoryData = timePoints.map(timestamp => ({
    timestamp,
    value: Math.floor(Math.random() * 70) + 20
  }));

  // Generate disk data (random values between 30-70%)
  const diskData = timePoints.map(timestamp => ({
    timestamp,
    value: Math.floor(Math.random() * 40) + 30
  }));

  // Generate network data (random values for in/out traffic)
  const networkIo = [];
  timePoints.forEach(timestamp => {
    // Network in (0-10 MB/s)
    networkIo.push({
      timestamp,
      type: 'in',
      value: Math.floor(Math.random() * 10 * 1024 * 1024)
    });

    // Network out (0-5 MB/s)
    networkIo.push({
      timestamp,
      type: 'out',
      value: Math.floor(Math.random() * 5 * 1024 * 1024)
    });
  });

  // Generate disk I/O data (random values for read/write)
  const diskIo = [];
  timePoints.forEach(timestamp => {
    // Disk read (0-20 MB/s)
    diskIo.push({
      timestamp,
      type: 'read',
      value: Math.floor(Math.random() * 20 * 1024 * 1024)
    });

    // Disk write (0-15 MB/s)
    diskIo.push({
      timestamp,
      type: 'write',
      value: Math.floor(Math.random() * 15 * 1024 * 1024)
    });
  });

  return {
    cpu: cpuData,
    memory: memoryData,
    disk: diskData,
    networkIo,
    diskIo,
    currentUsage: {
      cpu: cpuData[cpuData.length - 1].value,
      memory: memoryData[memoryData.length - 1].value,
      disk: diskData[diskData.length - 1].value,
      network: networkIo[networkIo.length - 2].value // Use the last 'in' value
    }
  };
};

const vmService = {
  /**
   * Get all virtual machines from all configured providers
   * @param {Object} options - Optional query parameters
   * @param {boolean} options.sync - Whether to sync VMs before returning
   * @returns {Promise} - Promise with array of VM data
   */
  getVMs: async (options = {}) => {
    try {
      // For development: Use mock data if API is not available
      if (process.env.NODE_ENV === 'development') {
        try {
          const { sync } = options;
          const queryParams = sync ? '?sync=true' : '';
          const response = await api.get(`/vm${queryParams}`);
          return response.data;
        } catch (error) {
          console.warn('API getVMs failed, using mock data for development');
          return mockVMs;
        }
      } else {
        // Production code
        const { sync } = options;
        const queryParams = sync ? '?sync=true' : '';
        const response = await api.get(`/vm${queryParams}`);
        return response.data;
      }
    } catch (error) {
      console.error('Get VMs error:', error);
      throw error;
    }
  },

  /**
   * Get a specific VM by ID
   * @param {string} id - VM ID
   * @returns {Promise} - Promise with VM data
   */
  getVMById: async (id) => {
    try {
      // For development: Use mock data if API is not available
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await api.get(`/vm/${id}`);
          return response.data;
        } catch (error) {
          console.warn('API getVMById failed, using mock data for development');
          const vm = mockVMs.find(vm => vm.id === id) || mockVMs[0];
          return vm;
        }
      } else {
        // Production code
        const response = await api.get(`/vm/${id}`);
        return response.data;
      }
    } catch (error) {
      console.error(`Get VM by ID error for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Start a specific VM
   * @param {string} id - VM ID
   * @returns {Promise} - Promise with action result
   */
  startVM: async (id) => {
    const response = await api.post(`/vm/${id}/start`);
    return response.data;
  },

  /**
   * Stop a specific VM
   * @param {string} id - VM ID
   * @returns {Promise} - Promise with action result
   */
  stopVM: async (id) => {
    const response = await api.post(`/vm/${id}/stop`);
    return response.data;
  },

  /**
   * Reboot a specific VM
   * @param {string} id - VM ID
   * @returns {Promise} - Promise with action result
   */
  rebootVM: async (id) => {
    const response = await api.post(`/vm/${id}/reboot`);
    return response.data;
  },

  /**
   * Check monitoring data for a VM
   * @param {string} id - VM ID
   * @returns {Promise} - Promise with monitoring data
   */
  getVMMonitoring: async (id) => {
    try {
      // For development: Use mock data if API is not available
      if (process.env.NODE_ENV === 'development') {
        try {
          const response = await api.get(`/monitoring/${id}/data`);
          return response.data;
        } catch (error) {
          console.warn('API getVMMonitoring failed, using mock data for development');
          return generateMockMonitoringData(id);
        }
      } else {
        // Production code
        const response = await api.get(`/monitoring/${id}/data`);
        return response.data;
      }
    } catch (error) {
      console.error(`Get VM monitoring error for ${id}:`, error);
      throw error;
    }
  }
};

export default vmService;