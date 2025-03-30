import api from './api';

/**
 * Get all VMs
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (running, stopped)
 * @param {string} params.provider - Filter by provider (AWS, Azure, GCP, VMware)
 * @param {string} params.search - Search term
 * @returns {Promise} - VMs response
 */
export const getVMs = async (params = {}) => {
  const response = await api.get('/vms', { params });
  return response.data;
};

/**
 * Get a specific VM by ID
 * @param {string} id - VM ID
 * @returns {Promise} - VM response
 */
export const getVM = async (id) => {
  const response = await api.get(`/vms/${id}`);
  return response.data;
};

/**
 * Start a VM
 * @param {string} id - VM ID
 * @returns {Promise} - Success response
 */
export const startVM = async (id) => {
  const response = await api.post(`/vms/${id}/start`);
  return response.data;
};

/**
 * Stop a VM
 * @param {string} id - VM ID
 * @returns {Promise} - Success response
 */
export const stopVM = async (id) => {
  const response = await api.post(`/vms/${id}/stop`);
  return response.data;
};

/**
 * Restart a VM
 * @param {string} id - VM ID
 * @returns {Promise} - Success response
 */
export const restartVM = async (id) => {
  const response = await api.post(`/vms/${id}/restart`);
  return response.data;
};

/**
 * Delete a VM
 * @param {string} id - VM ID
 * @returns {Promise} - Success response
 */
export const deleteVM = async (id) => {
  const response = await api.delete(`/vms/${id}`);
  return response.data;
};

/**
 * Get VM metrics
 * @param {string} id - VM ID
 * @param {string} timeRange - Time range (1h, 6h, 24h, 7d)
 * @returns {Promise} - Metrics response
 */
export const getVMMetrics = async (id, timeRange = '1h') => {
  const response = await api.get(`/vms/${id}/metrics`, {
    params: { timeRange }
  });
  return response.data;
};

/**
 * Get VM logs
 * @param {string} id - VM ID
 * @param {number} limit - Number of logs to return
 * @param {number} page - Page number
 * @returns {Promise} - Logs response
 */
export const getVMLogs = async (id, limit = 100, page = 1) => {
  const response = await api.get(`/vms/${id}/logs`, {
    params: { limit, page }
  });
  return response.data;
};

/**
 * Create a new VM
 * @param {Object} vmData - VM data
 * @returns {Promise} - New VM response
 */
export const createVM = async (vmData) => {
  const response = await api.post('/vms', vmData);
  return response.data;
};

/**
 * Update VM details
 * @param {string} id - VM ID
 * @param {Object} vmData - VM data to update
 * @returns {Promise} - Updated VM response
 */
export const updateVM = async (id, vmData) => {
  const response = await api.patch(`/vms/${id}`, vmData);
  return response.data;
};