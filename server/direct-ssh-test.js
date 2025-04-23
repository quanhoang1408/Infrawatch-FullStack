/**
 * Direct SSH test using child_process
 * 
 * This script tests SSH connection directly using child_process.spawn
 * without going through WebSocket
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const vaultSSHService = require('./src/services/vault-ssh.service');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration - update these values
const VM_IP = process.env.VM_IP || '54.197.5.26';
const SSH_USER = process.env.SSH_USER || 'ubuntu';

async function main() {
  try {
    log('Starting direct SSH test');
    log(`Target VM: ${VM_IP}, User: ${SSH_USER}`);
    
    // Step 1: Create temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-direct-'));
    log(`Created temporary directory: ${tempDir}`);
    
    // Step 2: Generate SSH key pair
    const keyPath = path.join(tempDir, 'id_rsa');
    execSync(`ssh-keygen -t rsa -b 2048 -m PEM -f "${keyPath}" -N "" -C "direct-ssh-test"`, {
      stdio: 'ignore'
    });
    log(`Generated SSH key pair at ${keyPath}`);
    
    // Step 3: Read the public key
    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();
    log(`Public key: ${publicKey.substring(0, 40)}...`);
    
    // Step 4: Sign the public key with Vault
    log('Signing public key with Vault...');
    const { certificate } = await vaultSSHService.signSSHKey(publicKey, SSH_USER);
    
    if (!certificate) {
      throw new Error('Failed to get certificate from Vault');
    }
    
    // Step 5: Save the certificate
    const certPath = `${keyPath}-cert.pub`;
    fs.writeFileSync(certPath, certificate);
    log(`Saved certificate to ${certPath}`);
    
    // Step 6: Test SSH connection
    log('Testing SSH connection...');
    
    // Build SSH command
    const sshArgs = [
      '-tt', // Force pseudo-terminal allocation
      '-i', keyPath,
      '-o', `CertificateFile=${certPath}`,
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
      '-o', 'ConnectTimeout=30',
      '-v', // Verbose output
      `${SSH_USER}@${VM_IP}`,
      'echo "Connection test successful" && sleep 5 && echo "Test complete"'
    ];
    
    log(`SSH command: ssh ${sshArgs.join(' ')}`);
    
    // Spawn SSH process
    const sshProcess = spawn('ssh', sshArgs, {
      stdio: 'inherit' // This will show output directly in the console
    });
    
    // Handle process exit
    sshProcess.on('exit', (code, signal) => {
      log(`SSH process exited with code ${code} and signal ${signal}`);
      
      // Clean up
      try {
        fs.unlinkSync(keyPath);
        fs.unlinkSync(`${keyPath}.pub`);
        fs.unlinkSync(certPath);
        fs.rmdirSync(tempDir);
        log('Cleaned up temporary files');
      } catch (cleanupError) {
        error(`Failed to clean up: ${cleanupError.message}`);
      }
      
      if (code === 0) {
        log('SSH connection test successful');
      } else {
        error(`SSH connection test failed with code ${code}`);
      }
    });
    
    // Handle process error
    sshProcess.on('error', (err) => {
      error(`SSH process error: ${err.message}`);
      
      // Clean up
      try {
        fs.unlinkSync(keyPath);
        fs.unlinkSync(`${keyPath}.pub`);
        fs.unlinkSync(certPath);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        error(`Failed to clean up: ${cleanupError.message}`);
      }
    });
    
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

// Run the test
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
});
