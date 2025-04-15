import api from './api';

const vmService = {
  /**
   * Get all virtual machines from all configured providers
   * @param {Object} options - Optional query parameters
   * @param {boolean} options.sync - Whether to sync VMs before returning
   * @returns {Promise} - Promise with array of VM data
   */
  getVMs: async (options = {}) => {
    const { sync } = options;
    const queryParams = sync ? '?sync=true' : '';
    const response = await api.get(`/vm${queryParams}`);
    return response.data;
  },

  /**
   * Get a specific VM by ID
   * @param {string} id - VM ID
   * @returns {Promise} - Promise with VM data
   */
  getVMById: async (id) => {
    const response = await api.get(`/vm/${id}`);
    return response.data;
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
    const response = await api.get(`/monitoring/${id}/data`);
    return response.data;
  }
};

export default vmService;