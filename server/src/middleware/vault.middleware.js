const vault = require('node-vault');
const config = require('../config/vault');
const logger = require('../utils/logger');

async function initializeVault() {
  const client = vault({
    apiVersion: 'v1',
    endpoint: config.vault.address,
    token: config.vault.token
  });

  try {
    // Enable SSH secrets engine
    await client.mount({
      mount_point: config.vault.mount,
      type: 'ssh',
      description: 'SSH secrets engine'
    });

    // Configure SSH secrets engine
    await client.write(`${config.vault.mount}/config/ca`, {
      generate_signing_key: true,
    });

    // Create SSH role
    await client.write(`${config.vault.mount}/roles/${config.vault.role}`, {
      key_type: "ca",
      algorithm: "rsa-sha2-512",
      allow_user_certificates: true,
      default_extensions: {
        "permit-pty": "",
        "permit-user-rc": ""
      },
      allowed_users: "*",
      default_user: "ubuntu",  // Changed to ubuntu for Ubuntu EC2 instances
      ttl: "5m"  // Short-lived certificate for web SSH
    });

    logger.info('Vault SSH secrets engine configured successfully');
  } catch (error) {
    logger.error('Failed to configure Vault SSH secrets engine:', error);
    throw error;
  }

  return client;
}

module.exports = {
  initializeVault
};

