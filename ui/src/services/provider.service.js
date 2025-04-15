import api from './api';

const providerService = {
  /**
   * Get all provider configurations (Admin only)
   * @returns {Promise} - Promise with array of provider data
   */
  getProviders: async () => {
    const response = await api.get('/admin/providers');
    return response.data;
  },

  /**
   * Add a new provider configuration (Admin only)
   * @param {object} providerData - Provider configuration data
   * @returns {Promise} - Promise with created provider data
   */
  addProvider: async (providerData) => {
    const response = await api.post('/admin/providers', providerData);
    return response.data;
  },

  /**
   * Delete a provider configuration (Admin only)
   * @param {string} id - Provider ID
   * @returns {Promise} - Promise with deletion result
   */
  deleteProvider: async (id) => {
    const response = await api.delete(`/admin/providers/${id}`);
    return response.data;
  }
};

export default providerService;