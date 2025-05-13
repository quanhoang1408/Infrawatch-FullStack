import api from './api';

// Mock data for development
const mockCertificates = [
  {
    id: 'cert-1',
    name: 'Production Access',
    user: 'admin',
    status: 'active',
    created: '2023-05-15T10:30:00Z',
    expires: '2024-05-15T10:30:00Z',
    vms: ['vm-1', 'vm-3']
  },
  {
    id: 'cert-2',
    name: 'Development Access',
    user: 'admin',
    status: 'active',
    created: '2023-06-20T14:45:00Z',
    expires: '2023-12-20T14:45:00Z',
    vms: ['vm-2']
  },
  {
    id: 'cert-3',
    name: 'Temporary Access',
    user: 'user',
    status: 'revoked',
    created: '2023-07-10T09:15:00Z',
    expires: '2023-08-10T09:15:00Z',
    vms: ['vm-1']
  }
];

/**
 * Service for handling certificate-related API calls
 */
const certificateService = {
  /**
   * Get all certificates
   *
   * @returns {Promise<Array>} - List of certificates
   */
  getCertificates: async () => {
    try {
      const response = await api.get('/certificates');
      return response.data;
    } catch (error) {
      console.error('Error fetching certificates:', error);
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock certificate data');
        return mockCertificates;
      }
      throw error;
    }
  },

  /**
   * Get all certificates for a VM
   *
   * @param {string} vmId - ID of the VM
   * @returns {Promise<Array>} - List of certificates
   */
  getCertificatesForVM: async (vmId) => {
    const response = await api.get(`/vms/${vmId}/certificates`);
    return response.data;
  },

  /**
   * Get a specific certificate by ID
   *
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Object>} - Certificate details
   */
  getCertificate: async (certId) => {
    try {
      const response = await api.get(`/certificates/${certId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching certificate ${certId}:`, error);
      if (process.env.NODE_ENV === 'development') {
        const cert = mockCertificates.find(c => c.id === certId);
        if (cert) return cert;
      }
      throw error;
    }
  },

  /**
   * Create a new certificate
   *
   * @param {Object} certData - Certificate data
   * @returns {Promise<Object>} - Created certificate
   */
  createCertificate: async (certData) => {
    try {
      const response = await api.post('/certificates', certData);
      return response.data;
    } catch (error) {
      console.error('Error creating certificate:', error);
      if (process.env.NODE_ENV === 'development') {
        // Return a mock response for development
        return {
          id: `cert-${Date.now()}`,
          name: certData.name,
          user: 'admin',
          status: 'active',
          created: new Date().toISOString(),
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          vms: certData.vms || []
        };
      }
      throw error;
    }
  },

  /**
   * Delete a certificate
   *
   * @param {string} certId - ID of the certificate
   * @returns {Promise<void>}
   */
  deleteCertificate: async (certId) => {
    try {
      await api.delete(`/certificates/${certId}`);
    } catch (error) {
      console.error(`Error deleting certificate ${certId}:`, error);
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
    }
  },

  /**
   * Revoke a certificate
   *
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Object>} - Revocation result
   */
  revokeCertificate: async (certId) => {
    try {
      const response = await api.post(`/certificates/${certId}/revoke`);
      return response.data;
    } catch (error) {
      console.error(`Error revoking certificate ${certId}:`, error);
      if (process.env.NODE_ENV === 'development') {
        // Return a mock response for development
        return { success: true, message: 'Certificate revoked successfully' };
      }
      throw error;
    }
  },

  /**
   * Renew a certificate
   *
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Object>} - Renewed certificate
   */
  renewCertificate: async (certId) => {
    const response = await api.post(`/certificates/${certId}/renew`);
    return response.data;
  }
};

export default certificateService;