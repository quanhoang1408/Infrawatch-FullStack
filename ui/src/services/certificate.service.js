import api from './api';

/**
 * Service for handling certificate-related API calls
 */
const certificateService = {
  /**
   * Get all certificates for a VM
   *
   * @param {string} vmId - ID of the VM
   * @returns {Promise<Array>} - List of certificates
   */
  getCertificates: async (vmId) => {
    const response = await api.get(`/vms/${vmId}/certificates`);
    return response.data;
  },

  /**
   * Get a specific certificate by ID
   *
   * @param {string} vmId - ID of the VM
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Object>} - Certificate details
   */
  getCertificate: async (vmId, certId) => {
    const response = await api.get(`/vms/${vmId}/certificates/${certId}`);
    return response.data;
  },

  /**
   * Create a new certificate
   *
   * @param {string} vmId - ID of the VM
   * @param {Object} certData - Certificate data
   * @returns {Promise<Object>} - Created certificate
   */
  createCertificate: async (vmId, certData) => {
    const response = await api.post(`/vms/${vmId}/certificates`, certData);
    return response.data;
  },

  /**
   * Update a certificate
   *
   * @param {string} vmId - ID of the VM
   * @param {string} certId - ID of the certificate
   * @param {Object} certData - Updated certificate data
   * @returns {Promise<Object>} - Updated certificate
   */
  updateCertificate: async (vmId, certId, certData) => {
    const response = await api.put(`/vms/${vmId}/certificates/${certId}`, certData);
    return response.data;
  },

  /**
   * Delete a certificate
   *
   * @param {string} vmId - ID of the VM
   * @param {string} certId - ID of the certificate
   * @returns {Promise<void>}
   */
  deleteCertificate: async (vmId, certId) => {
    await api.delete(`/vms/${vmId}/certificates/${certId}`);
  },

  /**
   * Download a certificate
   *
   * @param {string} vmId - ID of the VM
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Blob>} - Certificate file as blob
   */
  downloadCertificate: async (vmId, certId) => {
    const response = await api.get(`/vms/${vmId}/certificates/${certId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Revoke a certificate
   *
   * @param {string} vmId - ID of the VM
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Object>} - Revocation result
   */
  revokeCertificate: async (vmId, certId) => {
    const response = await api.post(`/vms/${vmId}/certificates/${certId}/revoke`);
    return response.data;
  },

  /**
   * Renew a certificate
   *
   * @param {string} vmId - ID of the VM
   * @param {string} certId - ID of the certificate
   * @returns {Promise<Object>} - Renewed certificate
   */
  renewCertificate: async (vmId, certId) => {
    const response = await api.post(`/vms/${vmId}/certificates/${certId}/renew`);
    return response.data;
  }
};

export default certificateService;