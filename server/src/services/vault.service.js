const Vault = require('node-vault');
const config = require('../config/vault');
const logger = require('../utils/logger');
const { generateKeyPair } = require('crypto');
const { promisify } = require('util');

class VaultService {
  constructor() {
    this.client = Vault({
      apiVersion: 'v1',
      endpoint: config.vault.address,
      token: config.vault.token
    });
  }

  async initialize() {
    try {
      const health = await this.client.health();
      if (!health.initialized) {
        throw new Error('Vault is not initialized');
      }
      logger.info('Vault connection established');
    } catch (error) {
      logger.error('Failed to initialize Vault connection:', error);
      throw error;
    }
  }

  async generateSSHKey() {
    const generateKeyPairAsync = promisify(generateKeyPair);
    try {
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      return publicKey;
    } catch (error) {
      logger.error('Failed to generate SSH key pair:', error);
      throw error;
    }
  }

  async signSSHKey(username, vmId) {
    try {
      const publicKey = await this.generateSSHKey();

      // Check if Vault is configured
      if (!config.vault.token) {
        logger.warn('Vault token not configured. Using mock signed key.');
        // Return mock data for testing without Vault
        return {
          signedKey: publicKey, // Use public key as signed key for testing
          serialNumber: 'mock-serial-' + Date.now(),
          publicKey
        };
      }

      // If Vault is configured, proceed with signing
      const response = await this.client.write(
        `${config.vault.mount}/sign/${config.vault.role}`,
        {
          public_key: publicKey,
          cert_type: 'user',
          username,
          valid_principals: username,
          ttl: '24h',
          metadata: JSON.stringify({
            username,
            vm_id: vmId
          })
        }
      );

      return {
        signedKey: response.data.signed_key,
        serialNumber: response.data.serial_number,
        publicKey
      };
    } catch (error) {
      logger.error('Failed to sign SSH key:', error);

      // If there's an error with Vault, return mock data for testing
      const publicKey = await this.generateSSHKey();
      logger.warn('Vault error. Using mock signed key for testing.');
      return {
        signedKey: publicKey, // Use public key as signed key for testing
        serialNumber: 'mock-serial-' + Date.now(),
        publicKey
      };
    }
  }
}

module.exports = new VaultService();
