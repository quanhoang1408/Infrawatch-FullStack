/**
 * Test script to verify Vault SSH CA configuration
 * 
 * This script checks if Vault is properly configured for SSH certificate signing:
 * 1. Verifies Vault connection
 * 2. Checks if SSH secrets engine is enabled
 * 3. Verifies CA configuration
 * 4. Tests role configuration
 * 5. Attempts to sign a test key
 */

const vaultSSHService = require('./src/services/vault-ssh.service');
const config = require('./src/config/vault');
const { generateKeyPairSync } = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Create a vault client
const vault = require('node-vault')({
  apiVersion: 'v1',
  endpoint: config.vault.address,
  token: config.vault.token
});

async function main() {
  try {
    log('Starting Vault SSH CA configuration test');
    
    // Step 1: Verify Vault connection
    log('Verifying Vault connection...');
    await testVaultConnection();
    
    // Step 2: Check SSH secrets engine
    log('Checking SSH secrets engine...');
    await checkSSHSecretsEngine();
    
    // Step 3: Verify CA configuration
    log('Verifying CA configuration...');
    await checkCAConfiguration();
    
    // Step 4: Test role configuration
    log('Testing role configuration...');
    await checkRoleConfiguration();
    
    // Step 5: Test key signing
    log('Testing key signing...');
    await testKeySigningWithVault();
    
    log('Vault SSH CA configuration test completed successfully');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

async function testVaultConnection() {
  try {
    // Simple health check
    const { data } = await vault.health();
    log(`Vault is running and healthy: ${JSON.stringify(data)}`);
    
    // Check token permissions
    const { data: tokenData } = await vault.tokenLookupSelf();
    log(`Token is valid, policies: ${tokenData.policies.join(', ')}`);
    
    return true;
  } catch (err) {
    error(`Vault connection failed: ${err.message}`);
    throw err;
  }
}

async function checkSSHSecretsEngine() {
  try {
    // List mounted secret engines
    const { data: mounts } = await vault.mounts();
    
    // Check if SSH is mounted at the configured path
    const sshMountPath = `${config.vault.mount}/`;
    if (mounts[sshMountPath]) {
      log(`SSH secrets engine is mounted at ${sshMountPath}`);
      log(`Type: ${mounts[sshMountPath].type}`);
      log(`Description: ${mounts[sshMountPath].description}`);
      return true;
    } else {
      log(`SSH secrets engine is not mounted at ${sshMountPath}`);
      log('Available mounts:');
      Object.keys(mounts).forEach(mount => {
        log(`- ${mount} (${mounts[mount].type})`);
      });
      
      // Try to mount SSH secrets engine
      log('Attempting to mount SSH secrets engine...');
      await vaultSSHService.setupCA();
      log('SSH secrets engine mounted successfully');
      return true;
    }
  } catch (err) {
    error(`Failed to check SSH secrets engine: ${err.message}`);
    throw err;
  }
}

async function checkCAConfiguration() {
  try {
    // Read CA configuration
    const { data } = await vault.read(`${config.vault.mount}/config/ca`);
    
    if (data && data.public_key) {
      log('CA is configured with a public key');
      log(`Public key: ${data.public_key.substring(0, 40)}...`);
      return true;
    } else {
      error('CA is not properly configured - no public key found');
      
      // Try to configure CA
      log('Attempting to configure CA...');
      await vault.write(`${config.vault.mount}/config/ca`, {
        generate_signing_key: true,
      });
      
      // Verify configuration
      const { data: newData } = await vault.read(`${config.vault.mount}/config/ca`);
      if (newData && newData.public_key) {
        log('CA configured successfully');
        log(`Public key: ${newData.public_key.substring(0, 40)}...`);
        return true;
      } else {
        throw new Error('Failed to configure CA');
      }
    }
  } catch (err) {
    error(`Failed to check CA configuration: ${err.message}`);
    throw err;
  }
}

async function checkRoleConfiguration() {
  try {
    // Check if role exists
    try {
      const { data } = await vault.read(`${config.vault.mount}/roles/${config.vault.role}`);
      
      log(`Role ${config.vault.role} exists`);
      log(`Key type: ${data.key_type}`);
      log(`Algorithm: ${data.algorithm}`);
      log(`TTL: ${data.ttl}`);
      log(`Allow user certificates: ${data.allow_user_certificates}`);
      
      return true;
    } catch (roleErr) {
      if (roleErr.response && roleErr.response.statusCode === 404) {
        log(`Role ${config.vault.role} does not exist`);
        
        // Create role
        log('Creating role...');
        await vaultSSHService.createRole();
        log(`Role ${config.vault.role} created successfully`);
        return true;
      } else {
        throw roleErr;
      }
    }
  } catch (err) {
    error(`Failed to check role configuration: ${err.message}`);
    throw err;
  }
}

async function testKeySigningWithVault() {
  try {
    // Generate a test key
    log('Generating test SSH key...');
    const { publicKey } = await generateSshKeyPair();
    
    // Sign the key
    log('Signing key with Vault...');
    const { certificate, serialNumber } = await vaultSSHService.signSSHKey(publicKey, 'test-user');
    
    if (certificate) {
      log('Key signed successfully');
      log(`Certificate: ${certificate.substring(0, 40)}...`);
      log(`Serial number: ${serialNumber}`);
      
      // Validate certificate format
      if (certificate.startsWith('ssh-rsa-cert-v01@openssh.com ')) {
        log('Certificate has correct format');
      } else {
        error(`Certificate has unexpected format: ${certificate.split(' ')[0]}`);
      }
      
      return true;
    } else {
      throw new Error('No certificate returned from signing operation');
    }
  } catch (err) {
    error(`Failed to test key signing: ${err.message}`);
    throw err;
  }
}

async function generateSshKeyPair() {
  try {
    // Create temporary directory for key generation
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-test-'));
    const keyPath = path.join(tempDir, 'id_rsa');
    
    // Generate SSH key using ssh-keygen
    execSync(`ssh-keygen -t rsa -b 2048 -m PEM -f "${keyPath}" -N "" -C "test-key"`, {
      stdio: 'ignore'
    });
    
    // Read the generated keys
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();
    
    log(`SSH key pair generated successfully`);
    
    // Clean up temporary files
    try {
      fs.unlinkSync(keyPath);
      fs.unlinkSync(`${keyPath}.pub`);
      fs.rmdirSync(tempDir);
    } catch (cleanupError) {
      log(`Warning: Failed to clean up temporary SSH key files: ${cleanupError.message}`);
    }
    
    return { privateKey, publicKey };
  } catch (error) {
    throw new Error(`Failed to generate SSH key pair: ${error.message}`);
  }
}

// Run the test
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
