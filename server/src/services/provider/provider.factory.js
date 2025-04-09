// src/services/provider/provider.factory.js
const AWSService = require('./aws.service');
const { ApiError } = require('../../utils/errors');

/**
 * Factory to create provider-specific services
 * @param {string} type - Provider type ('aws', 'azure', etc.)
 * @param {Object} credentials - Provider credentials
 * @returns {Object} Provider service instance
 */
const createProviderService = (type, credentials) => {
  switch (type) {
    case 'aws':
      return new AWSService(credentials);
    case 'azure':
      // TODO: Implement Azure service
      throw new ApiError(501, 'Azure provider not implemented yet');
    case 'gcp':
      // TODO: Implement GCP service
      throw new ApiError(501, 'GCP provider not implemented yet');
    case 'vmware':
      // TODO: Implement VMware service
      throw new ApiError(501, 'VMware provider not implemented yet');
    default:
      throw new ApiError(400, `Unsupported provider type: ${type}`);
  }
};

module.exports = { createProviderService };