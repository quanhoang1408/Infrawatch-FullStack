import api from './api';

/**
 * Get list of SSH certificates
 * @returns {Promise} - Certificates response
 */
export const getCertificates = async () => {
  const response = await api.get('/certificates');
  return response.data;
};

/**
 * Get a specific certificate by ID
 * @param {string} id - Certificate ID
 * @returns {Promise} - Certificate response
 */
export const getCertificate = async (id) => {
  const response = await api.get(`/certificates/${id}`);
  return response.data;
};

/**
 * Create a new certificate
 * @param {Object} certData - Certificate data
 * @returns {Promise} - New certificate response
 */
export const createCertificate = async (certData) => {
  const response = await api.post('/certificates', certData);
  return response.data;
};

/**
 * Update certificate details
 * @param {string} id - Certificate ID
 * @param {Object} certData - Certificate data to update
 * @returns {Promise} - Updated certificate response
 */
export const updateCertificate = async (id, certData) => {
  const response = await api.patch(`/certificates/${id}`, certData);
  return response.data;
};

/**
 * Delete a certificate
 * @param {string} id - Certificate ID
 * @returns {Promise} - Success response
 */
export const deleteCertificate = async (id) => {
  const response = await api.delete(`/certificates/${id}`);
  return response.data;
};

/**
 * Revoke a certificate
 * @param {string} id - Certificate ID
 * @returns {Promise} - Success response
 */
export const revokeCertificate = async (id) => {
  const response = await api.post(`/certificates/${id}/revoke`);
  return response.data;
};

/**
 * Generate a new SSH certificate
 * @param {Object} params - Certificate parameters
 * @param {string} params.name - Certificate name
 * @param {number} params.validityDays - Validity period in days
 * @param {Array} params.vmIds - List of VM IDs for which the certificate is valid
 * @returns {Promise} - New certificate response
 */
export const generateCertificate = async (params) => {
  const response = await api.post('/certificates/generate', params);
  return response.data;
};

/**
 * Assign a certificate to a VM
 * @param {string} certificateId - Certificate ID
 * @param {string} vmId - VM ID
 * @returns {Promise} - Success response
 */
export const assignCertificateToVM = async (certificateId, vmId) => {
  const response = await api.post(`/certificates/${certificateId}/assign`, { vmId });
  return response.data;
};

/**
 * Remove a certificate from a VM
 * @param {string} certificateId - Certificate ID
 * @param {string} vmId - VM ID
 * @returns {Promise} - Success response
 */
export const removeCertificateFromVM = async (certificateId, vmId) => {
  const response = await api.post(`/certificates/${certificateId}/remove`, { vmId });
  return response.data;
};

/**
 * Get certificate logs
 * @param {string} id - Certificate ID
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of logs to return
 * @param {number} params.page - Page number
 * @returns {Promise} - Logs response
 */
export const getCertificateLogs = async (id, params = {}) => {
  const response = await api.get(`/certificates/${id}/logs`, { params });
  return response.data;
};