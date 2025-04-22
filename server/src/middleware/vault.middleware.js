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
    // Check if SSH secrets engine is already mounted
    let mountsResponse;
    try {
      mountsResponse = await client.mounts();
    } catch (error) {
      logger.error('Failed to get Vault mounts:', error);
      throw error;
    }

    const sshMountPath = `${config.vault.mount}/`;
    const isSshMounted = mountsResponse && mountsResponse.hasOwnProperty(sshMountPath);

    if (!isSshMounted) {
      // Enable SSH secrets engine if not already mounted
      logger.info('Mounting SSH secrets engine...');
      await client.mount({
        mount_point: config.vault.mount,
        type: 'ssh',
        description: 'SSH secrets engine'
      });
    } else {
      logger.info('SSH secrets engine already mounted');
    }

    // Check if CA is already configured
    let caConfigured = false;
    try {
      const caResponse = await client.read(`${config.vault.mount}/config/ca`);
      if (caResponse && caResponse.data && caResponse.data.public_key) {
        logger.info('SSH CA already configured');
        caConfigured = true;
      }
    } catch (error) {
      // If error, CA is not configured
      logger.info('SSH CA not configured, will configure now');
    }

    if (!caConfigured) {
      // Configure SSH secrets engine
      logger.info('Configuring SSH CA...');
      await client.write(`${config.vault.mount}/config/ca`, {
        generate_signing_key: true,
      });
    }

    // Check if role exists
    let roleExists = false;
    try {
      const roleResponse = await client.read(`${config.vault.mount}/roles/${config.vault.role}`);
      if (roleResponse && roleResponse.data) {
        logger.info('SSH role already exists, updating...');
        roleExists = true;
      }
    } catch (error) {
      // If error, role does not exist
      logger.info('SSH role does not exist, will create now');
    }

    // Create or update SSH role
    logger.info(`${roleExists ? 'Updating' : 'Creating'} SSH role with TTL of 5m...`);
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

