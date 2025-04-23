// src/api/v1/vault/vault.controller.js
const asyncHandler = require('express-async-handler');
const vaultSSHService = require('../../../services/vault-ssh.service');
const logger = require('../../../utils/logger');

/**
 * Get Vault CA public key
 * @route GET /api/v1/vault/ca-key
 * @access Public
 */
const getCAPublicKey = asyncHandler(async (req, res) => {
  try {
    logger.info('Retrieving Vault CA public key');
    
    // Get CA public key from Vault
    const publicKey = await vaultSSHService.getCAPublicKey();
    
    if (!publicKey) {
      logger.error('Failed to retrieve Vault CA public key');
      res.status(500);
      throw new Error('Failed to retrieve Vault CA public key');
    }
    
    logger.info('Successfully retrieved Vault CA public key');
    res.send(publicKey);
  } catch (error) {
    logger.error(`Error retrieving Vault CA public key: ${error.message}`);
    res.status(500);
    throw new Error(`Failed to retrieve Vault CA public key: ${error.message}`);
  }
});

module.exports = {
  getCAPublicKey
};
