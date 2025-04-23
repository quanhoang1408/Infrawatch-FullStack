/**
 * Debug script to check VM configuration for SSH certificate authentication
 * 
 * This script:
 * 1. Gets the Vault CA public key
 * 2. Connects to the VM using password authentication
 * 3. Checks if the VM is configured to trust the Vault CA
 * 4. Provides detailed information about the VM's SSH configuration
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const vaultSSHService = require('./src/services/vault-ssh.service');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration - update these values
const VM_IP = process.env.VM_IP || '54.197.5.26';
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const SSH_PASSWORD = process.env.SSH_PASSWORD || '';

async function main() {
  try {
    log('Starting VM configuration debug');
    log(`Target VM: ${VM_IP}, User: ${SSH_USER}`);
    
    // Step 1: Get Vault CA public key
    log('Getting Vault CA public key...');
    const caPublicKey = await vaultSSHService.getCAPublicKey();
    
    if (!caPublicKey) {
      throw new Error('Failed to get Vault CA public key');
    }
    
    log(`Vault CA public key: ${caPublicKey}`);
    
    // Save CA public key to debug directory for manual testing
    const debugDir = path.join(__dirname, 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    
    fs.writeFileSync(path.join(debugDir, 'vault_ca.pub'), caPublicKey);
    log(`CA public key saved to debug directory for manual testing`);
    
    // Step 2: Check if VM has the CA public key in trusted keys
    if (!SSH_PASSWORD) {
      log('No password provided, skipping VM configuration check');
      log('To check VM configuration, set SSH_PASSWORD environment variable');
      return;
    }
    
    log('Checking if VM trusts the Vault CA...');
    await checkVMTrustsCA(caPublicKey);
    
    log('VM configuration debug completed');
  } catch (err) {
    error(`Debug failed: ${err.message}`);
    console.error(err);
  }
}

async function checkVMTrustsCA(caPublicKey) {
  return new Promise((resolve, reject) => {
    // Connect to VM using password authentication
    const conn = new Client();
    
    conn.on('ready', () => {
      log('Connected to VM');
      
      // Check for CA public key in trusted keys file
      const checkCommands = [
        // Check standard location
        `grep -F "${caPublicKey.substring(0, 40)}" /etc/ssh/trusted-user-ca-keys.pem 2>/dev/null || echo "Not found in standard location"`,
        // Check alternative location
        `grep -F "${caPublicKey.substring(0, 40)}" /etc/ssh/trusted-user-ca-keys.d/vault-ca.pub 2>/dev/null || echo "Not found in alternative location"`,
        // Check sshd_config for TrustedUserCAKeys directive
        `grep -E "TrustedUserCAKeys" /etc/ssh/sshd_config`,
        // Check if certificate authentication is enabled
        `grep -E "^\\s*PubkeyAuthentication" /etc/ssh/sshd_config || echo "PubkeyAuthentication not explicitly set (defaults to yes)"`,
        // Check authorized principals
        `ls -la /etc/ssh/auth_principals 2>/dev/null || echo "No auth_principals directory found"`,
        // Check if user has authorized_keys file
        `ls -la ~/.ssh/authorized_keys 2>/dev/null || echo "No authorized_keys file found"`,
        // Check SSH server version
        `ssh -V 2>&1`
      ];
      
      // Execute each command and collect results
      const results = {};
      let completedCommands = 0;
      
      checkCommands.forEach((cmd, index) => {
        conn.exec(cmd, (err, stream) => {
          if (err) {
            results[`command_${index}`] = { error: err.message };
            checkComplete();
            return;
          }
          
          let output = '';
          stream.on('data', (data) => {
            output += data.toString();
          });
          
          stream.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          stream.on('close', (code) => {
            results[`command_${index}`] = { 
              output: output.trim(),
              exitCode: code
            };
            checkComplete();
          });
        });
      });
      
      function checkComplete() {
        completedCommands++;
        if (completedCommands === checkCommands.length) {
          // All commands completed, analyze results
          log('VM Configuration Results:');
          
          // Check standard trusted keys file
          if (results.command_0.output === 'Not found in standard location') {
            log('- Vault CA public key is NOT in the standard trusted keys file (/etc/ssh/trusted-user-ca-keys.pem)');
          } else {
            log('- Vault CA public key is in the standard trusted keys file');
          }
          
          // Check alternative trusted keys file
          if (results.command_1.output === 'Not found in alternative location') {
            log('- Vault CA public key is NOT in the alternative trusted keys file (/etc/ssh/trusted-user-ca-keys.d/vault-ca.pub)');
          } else {
            log('- Vault CA public key is in the alternative trusted keys file');
          }
          
          // Check TrustedUserCAKeys directive
          if (results.command_2.output) {
            log(`- TrustedUserCAKeys directive found in sshd_config: ${results.command_2.output.trim()}`);
          } else {
            log('- TrustedUserCAKeys directive NOT found in sshd_config');
            log('  This is required for certificate authentication to work');
          }
          
          // Check PubkeyAuthentication
          log(`- PubkeyAuthentication: ${results.command_3.output}`);
          
          // Check authorized principals
          log(`- Authorized principals: ${results.command_4.output}`);
          
          // Check authorized_keys
          log(`- Authorized keys: ${results.command_5.output}`);
          
          // Check SSH version
          log(`- SSH version: ${results.command_6.output}`);
          
          // Provide recommendations
          log('\nRecommendations:');
          
          if (results.command_0.output === 'Not found in standard location' && 
              results.command_1.output === 'Not found in alternative location') {
            log('1. Add the Vault CA public key to /etc/ssh/trusted-user-ca-keys.pem:');
            log(`   sudo bash -c 'echo "${caPublicKey}" > /etc/ssh/trusted-user-ca-keys.pem'`);
            log('   sudo chmod 644 /etc/ssh/trusted-user-ca-keys.pem');
          }
          
          if (!results.command_2.output) {
            log('2. Add TrustedUserCAKeys directive to /etc/ssh/sshd_config:');
            log('   sudo bash -c \'echo "TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys.pem" >> /etc/ssh/sshd_config\'');
            log('   sudo systemctl restart sshd');
          }
          
          conn.end();
          resolve();
        }
      }
    });
    
    conn.on('error', (err) => {
      error(`Connection error: ${err.message}`);
      reject(err);
    });
    
    // Connect with password authentication
    conn.connect({
      host: VM_IP,
      port: 22,
      username: SSH_USER,
      password: SSH_PASSWORD,
      readyTimeout: 30000
    });
  });
}

// Create debug directory if it doesn't exist
const debugDir = path.join(__dirname, 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir);
}

// Run the debug
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
