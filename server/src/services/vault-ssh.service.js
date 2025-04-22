const config = require('../config/vault');
const logger = require('../utils/logger');

const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: config.vault.address,
  token: config.vault.token
});

class VaultSSHService {
  async setupCA() {
    try {
      // Enable SSH secrets engine if not enabled
      await vault.mount({
        mount_point: config.vault.mount,
        type: 'ssh',
        description: 'SSH Certificate Authority'
      });

      // Configure CA
      await vault.write(`${config.vault.mount}/config/ca`, {
        generate_signing_key: true,
      });

      // Get CA public key
      const { data } = await vault.read(`${config.vault.mount}/config/ca`);
      return data.public_key;
    } catch (error) {
      logger.error('Failed to setup Vault SSH CA:', error);
      throw error;
    }
  }

  async createRole() {
    try {
      await vault.write(`${config.vault.mount}/roles/${config.vault.role}`, {
        key_type: "ca",
        algorithm: "rsa-sha2-512",
        allow_user_certificates: true,
        default_extensions: {
          "permit-pty": "",
          "permit-user-rc": ""
        },
        allowed_users: "*",
        default_user: "ubuntu",
        ttl: "5m"
      });
    } catch (error) {
      logger.error('Failed to create SSH role:', error);
      throw error;
    }
  }

  async signSSHKey(publicKey, username) {
    try {
      // Log the public key for debugging
      logger.info(`Signing SSH key for user ${username}`);
      logger.debug(`Public key format: ${publicKey.substring(0, 20)}...`);

      // Validate the public key format
      if (!publicKey.startsWith('ssh-rsa ')) {
        throw new Error('Invalid public key format. Expected OpenSSH format starting with "ssh-rsa"');
      }

      const { data } = await vault.write(`${config.vault.mount}/sign/${config.vault.role}`, {
        public_key: publicKey,
        cert_type: 'user',
        username,
        valid_principals: username,
        ttl: "5m" // Short-lived certificate for web SSH
      });

      logger.info(`Successfully signed SSH key for user ${username}, serial: ${data.serial_number}`);

      return {
        certificate: data.signed_key,
        serialNumber: data.serial_number
      };
    } catch (error) {
      logger.error(`Failed to sign SSH key for user ${username}:`, error);

      // If Vault is not configured or there's an error, provide a mock certificate for testing
      if (!config.vault.token || error.message.includes('no vault token')) {
        logger.warn('Vault token not configured or invalid. Using mock certificate for testing.');
        return {
          certificate: publicKey, // Use public key as certificate for testing
          serialNumber: `mock-serial-${Date.now()}`
        };
      }

      throw error;
    }
  }
}

module.exports = new VaultSSHService();