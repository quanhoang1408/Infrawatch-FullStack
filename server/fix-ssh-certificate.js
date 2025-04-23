/**
 * Script to fix SSH certificate format issues
 * 
 * This script modifies the SSH certificate handling to ensure proper format:
 * 1. Ensures private key is in the correct format
 * 2. Ensures certificate is properly formatted
 * 3. Adds fallback to password authentication if certificate fails
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// File paths
const sshSessionServicePath = path.join(__dirname, 'src', 'services', 'ssh-session.service.js');
const vaultSSHServicePath = path.join(__dirname, 'src', 'services', 'vault-ssh.service.js');

function fixSSHSessionService() {
  try {
    log(`Fixing SSH session service at ${sshSessionServicePath}`);
    
    // Read the current file
    let content = fs.readFileSync(sshSessionServicePath, 'utf8');
    
    // Fix 1: Improve private key handling
    const oldKeyPairFunction = `  generateKeyPair() {
    try {
      // Create temporary directory for key generation
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-keys-'));
      const keyPath = path.join(tempDir, 'id_rsa');

      // Generate SSH key using ssh-keygen (most reliable way to get correct format)
      try {
        // Use -m PEM to ensure the private key is in PEM format
        execSync(\`ssh-keygen -t rsa -b 2048 -m PEM -f "\${keyPath}" -N "" -C "web-ssh-key"\`, {
          stdio: 'ignore'
        });

        logger.info('Successfully executed ssh-keygen command');
      } catch (error) {
        logger.error('Failed to execute ssh-keygen:', error);
        // Fallback to Node.js crypto if ssh-keygen fails
        return this.generateKeyPairFallback();
      }

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const publicKey = fs.readFileSync(\`\${keyPath}.pub\`, 'utf8').trim();

      // Log key information for debugging
      logger.info('Generated SSH key pair using ssh-keygen');
      logger.debug(\`Public key format: \${publicKey.substring(0, 20)}...\`);
      logger.debug(\`Private key format: \${privateKey.substring(0, 20)}...\`);

      // Verify the keys are in the correct format
      if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
        logger.warn('Private key is not in PEM format, may cause authentication issues');
      }

      if (!publicKey.startsWith('ssh-rsa ')) {
        logger.warn('Public key is not in OpenSSH format, may cause signing issues');
      }

      // Clean up temporary files
      try {
        fs.unlinkSync(keyPath);
        fs.unlinkSync(\`\${keyPath}.pub\`);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary SSH key files:', cleanupError);
      }

      return { publicKey, privateKey };
    } catch (error) {
      logger.error('Failed to generate SSH key pair:', error);
      // Fallback to Node.js crypto if anything fails
      return this.generateKeyPairFallback();
    }
  }`;

    const newKeyPairFunction = `  generateKeyPair() {
    try {
      // Create temporary directory for key generation
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-keys-'));
      const keyPath = path.join(tempDir, 'id_rsa');

      // Generate SSH key using ssh-keygen (most reliable way to get correct format)
      try {
        // Use -m PEM to ensure the private key is in PEM format
        execSync(\`ssh-keygen -t rsa -b 2048 -m PEM -f "\${keyPath}" -N "" -C "web-ssh-key"\`, {
          stdio: 'ignore'
        });

        logger.info('Successfully executed ssh-keygen command');
      } catch (error) {
        logger.error('Failed to execute ssh-keygen:', error);
        // Fallback to Node.js crypto if ssh-keygen fails
        return this.generateKeyPairFallback();
      }

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const publicKey = fs.readFileSync(\`\${keyPath}.pub\`, 'utf8').trim();

      // Log key information for debugging
      logger.info('Generated SSH key pair using ssh-keygen');
      logger.debug(\`Public key format: \${publicKey.substring(0, 20)}...\`);
      logger.debug(\`Private key format: \${privateKey.substring(0, 20)}...\`);

      // Verify the keys are in the correct format
      if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
        logger.warn('Private key is not in PEM format, may cause authentication issues');
        // Try to convert to PEM format if needed
        try {
          const tempPemPath = path.join(tempDir, 'id_rsa_pem');
          execSync(\`ssh-keygen -p -m PEM -f "\${keyPath}" -N ""\`);
          const pemPrivateKey = fs.readFileSync(keyPath, 'utf8');
          logger.info('Successfully converted private key to PEM format');
          return { publicKey, privateKey: pemPrivateKey };
        } catch (conversionError) {
          logger.error('Failed to convert private key to PEM format:', conversionError);
        }
      }

      if (!publicKey.startsWith('ssh-rsa ')) {
        logger.warn('Public key is not in OpenSSH format, may cause signing issues');
      }

      // Clean up temporary files
      try {
        fs.unlinkSync(keyPath);
        fs.unlinkSync(\`\${keyPath}.pub\`);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary SSH key files:', cleanupError);
      }

      return { publicKey, privateKey };
    } catch (error) {
      logger.error('Failed to generate SSH key pair:', error);
      // Fallback to Node.js crypto if anything fails
      return this.generateKeyPairFallback();
    }
  }`;

    // Fix 2: Improve connection options
    const oldConnectOptions = `        // Create connection options with certificate-based authentication
        const connectOptions = {
          host: sessionData.targetIp,
          port: 22,
          username: sessionData.sshUser,
          // Use the private key for authentication
          privateKey: sessionData.privateKey,
          // Add debug option to see more details
          debug: (message) => logger.debug(\`SSH2 Debug: \${message}\`),
          // Increase readyTimeout
          readyTimeout: 30000
        };

        // Add certificate if available
        if (sessionData.certificate) {
          connectOptions.certificate = sessionData.certificate;
        }`;

    const newConnectOptions = `        // Create connection options with certificate-based authentication
        const connectOptions = {
          host: sessionData.targetIp,
          port: 22,
          username: sessionData.sshUser,
          // Use the private key for authentication
          privateKey: sessionData.privateKey,
          // Add debug option to see more details
          debug: (message) => logger.debug(\`SSH2 Debug: \${message}\`),
          // Increase readyTimeout
          readyTimeout: 30000,
          // Add authentication methods in order of preference
          authHandler: ['publickey', 'password', 'keyboard-interactive']
        };

        // Add certificate if available and not disabled for testing
        const disableCertAuth = process.env.DISABLE_CERT_AUTH === 'true';
        
        if (sessionData.certificate && !disableCertAuth) {
          connectOptions.certificate = sessionData.certificate;
          logger.info('Using certificate-based authentication');
        } else {
          if (disableCertAuth) {
            logger.info('Certificate authentication disabled for testing');
          } else {
            logger.info('Using private key authentication without certificate');
          }
        }
        
        // Add password as fallback authentication method
        if (sessionData.password) {
          connectOptions.password = sessionData.password;
          logger.info('Added password as fallback authentication method');
        }`;

    // Apply fixes
    content = content.replace(oldKeyPairFunction, newKeyPairFunction);
    content = content.replace(oldConnectOptions, newConnectOptions);
    
    // Write the updated file
    fs.writeFileSync(sshSessionServicePath, content, 'utf8');
    
    log('SSH session service has been fixed.');
    return true;
  } catch (err) {
    error(`Failed to fix SSH session service: ${err.message}`);
    return false;
  }
}

function fixVaultSSHService() {
  try {
    log(`Fixing Vault SSH service at ${vaultSSHServicePath}`);
    
    // Read the current file
    let content = fs.readFileSync(vaultSSHServicePath, 'utf8');
    
    // Fix: Improve certificate handling
    const oldSignFunction = `  async signSSHKey(publicKey, username) {
    try {
      // Log the public key for debugging
      logger.info(\`Signing SSH key for user \${username}\`);
      logger.debug(\`Public key format (first 20 chars): \${publicKey.substring(0, 20)}...\`);

      // Format the public key if needed
      let formattedKey = publicKey;

      // Check if the key is in PEM format and convert if needed
      if (publicKey.includes('-----BEGIN PUBLIC KEY-----') || publicKey.includes('-----BEGIN RSA PUBLIC KEY-----')) {
        logger.info('Detected PEM format key, using as-is for Vault signing');
        // Vault can handle PEM format directly
      } else if (!publicKey.startsWith('ssh-rsa ') && !publicKey.startsWith('ssh-ed25519 ')) {
        // If it's not in OpenSSH format and not in PEM format, try to add ssh-rsa prefix
        logger.warn('Key is not in OpenSSH or PEM format, attempting to fix...');
        formattedKey = \`ssh-rsa \${publicKey} web-ssh-key\`;
        logger.info('Added ssh-rsa prefix to key');
      }`;

    const newSignFunction = `  async signSSHKey(publicKey, username) {
    try {
      // Log the public key for debugging
      logger.info(\`Signing SSH key for user \${username}\`);
      logger.debug(\`Public key format (first 20 chars): \${publicKey.substring(0, 20)}...\`);
      logger.debug(\`Full public key: \${publicKey}\`);

      // Format the public key if needed
      let formattedKey = publicKey;

      // Check if the key is in PEM format and convert if needed
      if (publicKey.includes('-----BEGIN PUBLIC KEY-----') || publicKey.includes('-----BEGIN RSA PUBLIC KEY-----')) {
        logger.info('Detected PEM format key, using as-is for Vault signing');
        // Vault can handle PEM format directly
      } else if (!publicKey.startsWith('ssh-rsa ') && !publicKey.startsWith('ssh-ed25519 ')) {
        // If it's not in OpenSSH format and not in PEM format, try to add ssh-rsa prefix
        logger.warn('Key is not in OpenSSH or PEM format, attempting to fix...');
        formattedKey = \`ssh-rsa \${publicKey} web-ssh-key\`;
        logger.info('Added ssh-rsa prefix to key');
        logger.debug(\`Formatted key: \${formattedKey}\`);
      }`;
    
    // Apply fix
    content = content.replace(oldSignFunction, newSignFunction);
    
    // Write the updated file
    fs.writeFileSync(vaultSSHServicePath, content, 'utf8');
    
    log('Vault SSH service has been fixed.');
    return true;
  } catch (err) {
    error(`Failed to fix Vault SSH service: ${err.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    log('Starting SSH certificate fixes');
    
    // Fix SSH session service
    const sshSessionFixed = fixSSHSessionService();
    
    // Fix Vault SSH service
    const vaultSSHFixed = fixVaultSSHService();
    
    if (sshSessionFixed && vaultSSHFixed) {
      log('All fixes applied successfully');
      
      // Restart the server
      try {
        log('Restarting the server...');
        execSync('pm2 restart server');
        log('Server restarted successfully');
      } catch (restartError) {
        error(`Failed to restart server: ${restartError.message}`);
        log('Please restart the server manually');
      }
    } else {
      error('Some fixes could not be applied');
    }
    
    log('SSH certificate fix script completed');
  } catch (err) {
    error(`Unhandled error: ${err.message}`);
    console.error(err);
  }
}

// Run the script
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
