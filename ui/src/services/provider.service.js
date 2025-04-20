import api from './api';

// Mock provider data for development
const mockProviders = [
  {
    id: 'provider-1',
    name: 'AWS Development',
    type: 'aws',
    status: 'active',
    region: 'us-east-1',
    lastSyncAt: new Date().toISOString()
  },
  {
    id: 'provider-2',
    name: 'Azure Development',
    type: 'azure',
    status: 'active',
    region: 'eastus',
    lastSyncAt: new Date().toISOString()
  }
];

const providerService = {
  /**
   * Get all provider configurations (Admin only)
   * @returns {Promise} - Promise with array of provider data
   */
  getProviders: async () => {
    try {
      console.log('Fetching providers from:', `${api.defaults.baseURL}/admin/providers`);
      const response = await api.get('/admin/providers');
      console.log('Provider response:', response);

      // Check if response is HTML from ngrok
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>') && response.data.includes('ngrok')) {
        console.error('Received HTML from ngrok instead of JSON. This is likely the ngrok warning page.');
        console.error('Please open the ngrok URL in a browser first and accept the warning:');
        console.error(api.defaults.baseURL);

        // Show a more helpful error message
        const error = new Error('Ngrok requires browser confirmation. Please open the ngrok URL in your browser first.');
        error.isNgrokError = true;
        throw error;
      }

      // Ensure we're returning an array
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object but not an array, check if it has a data property that's an array
        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        // If it's an object with no data array, log and return empty array
        console.warn('API returned object but not an array:', response.data);
        return [];
      } else {
        console.warn('API returned invalid data type:', typeof response.data);
        return [];
      }
    } catch (error) {
      console.error('Get providers error:', error);
      // Only use mock data in development mode and if explicitly allowed
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
        console.warn('Using mock data as fallback in development mode');
        return mockProviders;
      }
      throw error;
    }
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