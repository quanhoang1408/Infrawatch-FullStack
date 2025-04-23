/**
 * Test script for OpenSSH service
 *
 * This script tests the OpenSSH service by:
 * 1. Generating a key pair
 * 2. Signing the public key with Vault
 * 3. Saving the private key and certificate to files
 * 4. Attempting to connect to a VM using OpenSSH
 */

const openSSHSessionService = require('./src/services/openssh-session.service');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration - update these values
const VM_IP = process.env.VM_IP || '54.197.5.26';
const SSH_USER = process.env.SSH_USER || 'ubuntu';

async function main() {
  try {
    log('Starting OpenSSH service test');
    log(`Target VM: ${VM_IP}, User: ${SSH_USER}`);

    // Step 1: Generate key pair
    log('Generating SSH key pair...');
    const { publicKey, privateKey, keyPath } = openSSHSessionService.generateKeyPair();

    log(`Key pair generated successfully`);
    log(`Private key path: ${keyPath}`);
    log(`Public key path: ${keyPath}.pub`);

    // Step 2: Sign public key with Vault
    log('Signing public key with Vault...');
    const vaultSSHService = require('./src/services/vault-ssh.service');
    const { certificate, serialNumber } = await vaultSSHService.signSSHKey(publicKey, SSH_USER);

    if (!certificate) {
      throw new Error('Failed to get certificate from Vault');
    }

    log(`Certificate received with serial number: ${serialNumber}`);

    // Step 3: Save certificate to file
    const certPath = `${keyPath}-cert.pub`;
    fs.writeFileSync(certPath, certificate);
    log(`Certificate saved to: ${certPath}`);

    // Step 4: Test SSH connection using OpenSSH
    log('Testing SSH connection using OpenSSH...');

    // Build SSH command
    const sshArgs = [
      '-i', keyPath,
      '-o', `CertificateFile=${certPath}`,
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-v', // Verbose output
      `${SSH_USER}@${VM_IP}`,
      'echo "Connection test successful"'
    ];

    log(`SSH command: ssh ${sshArgs.join(' ')}`);

    // Spawn SSH process
    const sshProcess = spawn('ssh', sshArgs);

    // Handle SSH process stdout
    sshProcess.stdout.on('data', (data) => {
      log(`SSH stdout: ${data.toString().trim()}`);
    });

    // Handle SSH process stderr
    sshProcess.stderr.on('data', (data) => {
      log(`SSH stderr: ${data.toString().trim()}`);
    });

    // Handle SSH process exit
    sshProcess.on('exit', (code, signal) => {
      if (code === 0) {
        log(`SSH connection successful (exit code: ${code})`);
      } else {
        error(`SSH connection failed (exit code: ${code}, signal: ${signal})`);
      }

      // Clean up key files
      try {
        fs.unlinkSync(keyPath);
        fs.unlinkSync(`${keyPath}.pub`);
        fs.unlinkSync(certPath);
        log('Cleaned up key files');
      } catch (cleanupError) {
        error(`Failed to clean up key files: ${cleanupError.message}`);
      }
    });

    // Handle SSH process error
    sshProcess.on('error', (err) => {
      error(`SSH process error: ${err.message}`);
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
