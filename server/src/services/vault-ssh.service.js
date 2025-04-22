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
      const { data } = await vault.write(`${config.vault.mount}/sign/${config.vault.role}`, {
        public_key: publicKey,
        cert_type: 'user',
        username,
        valid_principals: username,
        ttl: "5m" // Short-lived certificate for web SSH
      });

      return {
        certificate: data.signed_key,
        serialNumber: data.serial_number
      };
    } catch (error) {
      logger.error('Failed to sign SSH key:', error);
      throw error;
    }
  }
}

module.exports = new VaultSSHService();