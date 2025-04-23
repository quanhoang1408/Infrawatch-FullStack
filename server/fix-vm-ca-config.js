/**
 * Script to fix VM CA configuration
 * 
 * This script configures the VM to trust Vault CA certificates:
 * 1. Creates or updates the trusted-user-ca-keys.pem file
 * 2. Updates SSH server configuration
 * 3. Restarts SSH server
 * 
 * Run this script with sudo on the VM where you want to enable certificate authentication.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration
const TRUSTED_CA_PATH = '/etc/ssh/trusted-user-ca-keys.pem';
const SSHD_CONFIG_PATH = '/etc/ssh/sshd_config';

// Function to prompt for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    log('Starting VM CA configuration fix');
    
    // Check if running as root
    if (process.getuid && process.getuid() !== 0) {
      error('This script must be run as root (sudo)');
      process.exit(1);
    }
    
    // Step 1: Get CA public key
    log('Please enter the Vault CA public key:');
    let caPublicKey = await prompt('> ');
    
    // Trim whitespace
    caPublicKey = caPublicKey.trim();
    
    // Validate the key format
    if (!caPublicKey.startsWith('ssh-rsa ') && !caPublicKey.startsWith('ssh-ed25519 ')) {
      error('Invalid CA public key format. It should start with "ssh-rsa " or "ssh-ed25519 "');
      process.exit(1);
    }
    
    // Step 2: Create or update trusted-user-ca-keys.pem
    log(`Creating/updating ${TRUSTED_CA_PATH}...`);
    fs.writeFileSync(TRUSTED_CA_PATH, caPublicKey + '\n');
    
    // Set proper permissions
    execSync(`chmod 644 ${TRUSTED_CA_PATH}`);
    log(`${TRUSTED_CA_PATH} created with proper permissions`);
    
    // Step 3: Update SSH server configuration
    log(`Updating ${SSHD_CONFIG_PATH}...`);
    updateSSHConfig();
    
    // Step 4: Restart SSH server
    log('Restarting SSH server...');
    try {
      execSync('systemctl restart sshd');
      log('SSH server restarted successfully');
    } catch (restartError) {
      error(`Failed to restart SSH server: ${restartError.message}`);
      log('Please restart the SSH server manually');
    }
    
    log('VM CA configuration fix completed');
    log('The VM is now configured to trust certificates signed by the Vault CA');
  } catch (err) {
    error(`Fix failed: ${err.message}`);
    console.error(err);
  }
}

function updateSSHConfig() {
  // Read current sshd_config
  let sshdConfig = fs.readFileSync(SSHD_CONFIG_PATH, 'utf8');
  
  // Check if TrustedUserCAKeys directive already exists
  const trustedCAKeysRegex = /^\s*TrustedUserCAKeys\s+.+$/m;
  const trustedCAKeysExists = trustedCAKeysRegex.test(sshdConfig);
  
  if (trustedCAKeysExists) {
    // Update existing directive
    sshdConfig = sshdConfig.replace(
      trustedCAKeysRegex,
      `TrustedUserCAKeys ${TRUSTED_CA_PATH}`
    );
    log('Updated existing TrustedUserCAKeys directive');
  } else {
    // Add new directive
    sshdConfig += `\n# Trust user certificates signed by Vault CA\nTrustedUserCAKeys ${TRUSTED_CA_PATH}\n`;
    log('Added new TrustedUserCAKeys directive');
  }
  
  // Write updated config
  fs.writeFileSync(SSHD_CONFIG_PATH, sshdConfig);
  
  // Validate config
  try {
    execSync('sshd -t');
    log('SSH server configuration validated successfully');
  } catch (validateError) {
    error(`SSH server configuration validation failed: ${validateError.message}`);
    if (validateError.stdout) log(`stdout: ${validateError.stdout}`);
    if (validateError.stderr) error(`stderr: ${validateError.stderr}`);
    throw new Error('Invalid SSH server configuration');
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    error(`Unhandled error: ${err.message}`);
    console.error(err);
    process.exit(1);
  });
}
