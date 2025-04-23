const config = require('../config/vault');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

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

  async getCAPublicKey() {
    try {
      // Try to read the CA public key
      try {
        const { data } = await vault.read(`${config.vault.mount}/config/ca`);
        if (data && data.public_key) {
          logger.info('Successfully retrieved Vault CA public key');
          return data.public_key;
        }
      } catch (readError) {
        logger.warn(`Failed to read CA public key: ${readError.message}`);
        // If reading fails, try to set up the CA
      }

      // If we get here, either the read failed or the public key wasn't found
      // Try to set up the CA and get the public key
      logger.info('Setting up Vault SSH CA...');
      return await this.setupCA();
    } catch (error) {
      logger.error('Failed to get Vault CA public key:', error);

      // For development/testing, return a mock CA public key
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using mock CA public key for development');
        return 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3YZM2ZfFSFQkJQPEEYkQIgbRHvR2phJqc8c5hRRqtnGKFAHbGlIJiVuQFU7ELoYUgBpMdmrQQQQqXYSuDOoAZe9yZc6LDxvBzCDkmwjg7vBk4nP4jgQcfzHmWzlU6+yYBXBCLUQFwxvqCGFaRWwqGBXjfGGQHIcbLYroOUOoHvgmuQ7zzTYBmXgJFdSGPd+LSLkJQn3xGbCS2Bj5UmEJQQJIJ5HbM8Cu0QztTYFnTtYpXQVQPIA0n9HpPJQ1qexyL4Jt6MjsHLlCk6NBR9Sy+aeIYHALXyEJRdK2hg5CZpqZ0sMkJ4mOUJiuiT6TlxKvRiOQS9zBVpz4QM9PTSfDr vault-ca@infrawatch';
      }

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
      logger.debug(`Full public key: ${publicKey}`);

      // Format the public key if needed
      let formattedKey = publicKey;

      // Validate the public key format
      if (!publicKey.startsWith('ssh-rsa ') && !publicKey.startsWith('ssh-ed25519 ')) {
        // If it's not in OpenSSH format, reject it
        // We no longer try to fix malformed keys as this has proven problematic
        logger.error('Public key is not in OpenSSH format (must start with ssh-rsa or ssh-ed25519)');
        logger.error(`Received key format: ${publicKey.substring(0, 30)}...`);
        throw new Error('Public key must be in OpenSSH format (starting with ssh-rsa or ssh-ed25519)');
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
          logger.debug(`Full certificate: ${data.signed_key}`);

          // Validate certificate format
          if (!data.signed_key.startsWith('ssh-rsa-cert-v01@openssh.com ')) {
            logger.error('Certificate does not have expected format (should start with ssh-rsa-cert-v01@openssh.com)');
            logger.error(`Received certificate format: ${data.signed_key.substring(0, 30)}...`);
            throw new Error('Invalid certificate format received from Vault');
          }

          // Verify certificate structure
          const certParts = data.signed_key.split(' ');
          if (certParts.length < 2) {
            logger.error('Certificate has invalid structure (should have at least 2 parts)');
            throw new Error('Invalid certificate structure received from Vault');
          }

          // Check for any non-base64 characters that could cause parsing issues
          // Note: We don't throw an error here because some non-standard characters might be valid
          // in the certificate data, but we log a warning
          const base64Regex = /^[A-Za-z0-9+/=]+$/;
          const certData = certParts[1]; // The base64 encoded part
          if (!base64Regex.test(certData)) {
            logger.warn('Certificate contains non-base64 characters which may cause parsing issues');
            logger.debug(`Certificate data part: ${certData}`);
          }

          // Verify certificate with ssh-keygen if possible
          try {
            // Create a temporary file to test the certificate
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-cert-'));
            const certPath = path.join(tempDir, 'test-cert.pub');

            // Write certificate to file
            fs.writeFileSync(certPath, data.signed_key);

            // Try to validate the certificate
            try {
              execSync(`ssh-keygen -L -f "${certPath}"`, { stdio: 'ignore' });
              logger.info('Certificate validated successfully with ssh-keygen');
            } catch (validateError) {
              logger.error(`Certificate validation failed: ${validateError.message}`);
              throw new Error('Certificate validation failed');
            } finally {
              // Clean up
              try {
                fs.unlinkSync(certPath);
                fs.rmdirSync(tempDir);
              } catch (cleanupError) {
                logger.warn(`Failed to clean up temporary certificate file: ${cleanupError.message}`);
              }
            }
          } catch (tempError) {
            logger.warn(`Could not verify certificate: ${tempError.message}`);
            // Continue anyway, as we might not have ssh-keygen available
          }
        } else {
          logger.warn('No signed certificate received from Vault');
          throw new Error('No signed certificate received from Vault');
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

      // If Vault is not configured, log a clear error
      if (!config.vault.token || error.message.includes('no vault token')) {
        logger.error('Vault token not configured or invalid. Certificate-based authentication will not work.');
        logger.error('Please configure Vault token in the environment variables.');

        // In development, we can fall back to private key authentication
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Development mode: Falling back to private key authentication without certificate.');
          return {
            certificate: null,
            serialNumber: `mock-serial-${Date.now()}`
          };
        }
      }

      // Propagate the error
      throw error;
    }
  }
}

module.exports = new VaultSSHService();