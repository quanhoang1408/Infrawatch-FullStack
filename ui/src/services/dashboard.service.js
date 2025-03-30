import api from './api';

/**
 * Get dashboard statistics
 * @returns {Promise} - Dashboard stats response
 */
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

/**
 * Get activities
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of activities to return
 * @param {number} params.page - Page number
 * @param {string} params.type - Activity type filter
 * @param {string} params.vmId - VM ID filter
 * @returns {Promise} - Activities response
 */
export const getActivities = async (params = {}) => {
  const response = await api.get('/activities', { params });
  return response.data;
};

/**
 * Get resource usage history
 * @param {Object} params - Query parameters
 * @param {string} params.resource - Resource type (cpu, ram, disk, network)
 * @param {string} params.timeRange - Time range (1h, 6h, 24h, 7d)
 * @param {string} params.vmId - Optional VM ID for specific VM metrics
 * @returns {Promise} - Resource usage response
 */
export const getResourceUsageHistory = async (params = {}) => {
  const response = await api.get('/metrics/history', { params });
  return response.data;
};

/**
 * Get real-time resource usage
 * @param {string} vmId - Optional VM ID for specific VM metrics
 * @returns {Promise} - Resource usage response
 */
export const getRealTimeResourceUsage = async (vmId = null) => {
  const params = vmId ? { vmId } : {};
  const response = await api.get('/metrics/realtime', { params });
  return response.data;
};

/**
 * Get system health status
 * @returns {Promise} - System health response
 */
export const getSystemHealth = async () => {
  const response = await api.get('/system/health');
  return response.data;
};

/**
 * Get system notifications
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of notifications to return
 * @param {number} params.page - Page number
 * @returns {Promise} - Notifications response
 */
export const getSystemNotifications = async (params = {}) => {
  const response = await api.get('/system/notifications', { params });
  return response.data;
};