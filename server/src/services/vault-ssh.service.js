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
      logger.debug(`Public key format (first 20 chars): ${publicKey.substring(0, 20)}...`);

      // Format the public key if needed
      let formattedKey = publicKey;

      // Check if the key is in PEM format and convert if needed
      if (publicKey.includes('-----BEGIN PUBLIC KEY-----') || publicKey.includes('-----BEGIN RSA PUBLIC KEY-----')) {
        logger.info('Detected PEM format key, using as-is for Vault signing');
        // Vault can handle PEM format directly
      } else if (!publicKey.startsWith('ssh-rsa ') && !publicKey.startsWith('ssh-ed25519 ')) {
        // If it's not in OpenSSH format and not in PEM format, try to add ssh-rsa prefix
        logger.warn('Key is not in OpenSSH or PEM format, attempting to fix...');
        formattedKey = `ssh-rsa ${publicKey} web-ssh-key`;
        logger.info('Added ssh-rsa prefix to key');
      }

      // Try to sign the key with Vault
      try {
        logger.info(`Sending public key to Vault for signing: ${formattedKey.substring(0, 20)}...`);

        const { data } = await vault.write(`${config.vault.mount}/sign/${config.vault.role}`, {
          public_key: formattedKey,
          cert_type: 'user',
          username,
          valid_principals: username,
          ttl: "30m" // Increased certificate lifetime for testing
        });

        // Log the signed certificate format
        if (data.signed_key) {
          logger.info(`Received signed certificate from Vault: ${data.signed_key.substring(0, 20)}...`);
          logger.debug(`Certificate serial number: ${data.serial_number}`);
        } else {
          logger.warn('No signed certificate received from Vault');
        }

        logger.info(`Successfully signed SSH key for user ${username}, serial: ${data.serial_number}`);

        return {
          certificate: data.signed_key,
          serialNumber: data.serial_number
        };
      } catch (vaultError) {
        logger.error(`Vault signing error: ${vaultError.message}`);
        throw vaultError;
      }
    } catch (error) {
      logger.error(`Failed to sign SSH key for user ${username}:`, error);

      // If Vault is not configured or there's an error, provide a mock certificate for testing
      if (!config.vault.token || error.message.includes('no vault token')) {
        logger.warn('Vault token not configured or invalid. Using private key authentication without certificate.');
        return {
          // Return null certificate to fall back to private key authentication
          certificate: null,
          serialNumber: `mock-serial-${Date.now()}`
        };
      }

      // For development/testing, we can return a null certificate for any error
      // This allows testing the SSH terminal feature without a working Vault setup
      // by falling back to private key or password authentication
      logger.warn('Vault signing error. Falling back to private key authentication without certificate.');
      return {
        certificate: null,
        serialNumber: `mock-error-${Date.now()}`
      };
    }
  }
}

module.exports = new VaultSSHService();