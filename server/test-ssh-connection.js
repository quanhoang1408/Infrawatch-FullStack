/**
 * Test script to try different SSH connection methods
 * 
 * This script attempts to connect to a VM using different authentication methods:
 * 1. Certificate-based authentication
 * 2. Private key authentication
 * 3. Password authentication
 */

const { Client } = require('ssh2');
const { generateKeyPairSync } = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vaultSSHService = require('./src/services/vault-ssh.service');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Configuration - update these values
const VM_IP = process.env.VM_IP || '54.197.5.26'; // Default to the IP in the error logs
const SSH_USER = process.env.SSH_USER || 'ubuntu';
const SSH_PASSWORD = process.env.SSH_PASSWORD || 'ubuntu';

async function main() {
  try {
    log('Starting SSH connection test');
    log(`Target VM: ${VM_IP}, User: ${SSH_USER}`);
    
    // Step 1: Generate SSH key pair
    log('Generating SSH key pair...');
    const { privateKey, publicKey } = await generateSshKeyPair();
    
    // Step 2: Sign the key with Vault
    log('Signing public key with Vault...');
    const { certificate } = await vaultSSHService.signSSHKey(publicKey, SSH_USER);
    
    // Step 3: Test different connection methods
    if (certificate) {
      log('Testing certificate-based authentication...');
      await testConnection({
        host: VM_IP,
        port: 22,
        username: SSH_USER,
        privateKey: privateKey,
        certificate: certificate,
        readyTimeout: 30000,
        debug: message => log(`SSH2 Debug: ${message}`)
      });
    } else {
      log('No certificate available, skipping certificate-based authentication test');
    }
    
    log('Testing private key authentication (without certificate)...');
    await testConnection({
      host: VM_IP,
      port: 22,
      username: SSH_USER,
      privateKey: privateKey,
      readyTimeout: 30000,
      debug: message => log(`SSH2 Debug: ${message}`)
    });
    
    if (SSH_PASSWORD) {
      log('Testing password authentication...');
      await testConnection({
        host: VM_IP,
        port: 22,
        username: SSH_USER,
        password: SSH_PASSWORD,
        readyTimeout: 30000,
        debug: message => log(`SSH2 Debug: ${message}`)
      });
    } else {
      log('No password provided, skipping password authentication test');
    }
    
    log('SSH connection test completed');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
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
    log(`Private key format: ${privateKey.substring(0, 40)}...`);
    log(`Public key format: ${publicKey.substring(0, 40)}...`);
    
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

async function testConnection(options) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let connected = false;
    
    // Set up timeout
    const timeout = setTimeout(() => {
      if (!connected) {
        conn.end();
        reject(new Error('Connection timeout'));
      }
    }, options.readyTimeout || 30000);
    
    conn.on('ready', () => {
      connected = true;
      clearTimeout(timeout);
      log('Connection successful!');
      
      // Execute a simple command to verify the connection
      conn.exec('echo "Connection test successful"', (err, stream) => {
        if (err) {
          conn.end();
          return reject(new Error(`Failed to execute command: ${err.message}`));
        }
        
        let output = '';
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.on('close', (code) => {
          log(`Command output: ${output.trim()}`);
          log(`Command exited with code ${code}`);
          conn.end();
          resolve();
        });
      });
    });
    
    conn.on('error', (err) => {
      clearTimeout(timeout);
      log(`Connection error: ${err.message}`);
      reject(err);
    });
    
    conn.on('handshake', () => {
      log('SSH handshake successful');
    });
    
    conn.on('banner', (message) => {
      log(`SSH banner: ${message}`);
    });
    
    // Add more detailed authentication debugging
    conn.on('authentication', (ctx) => {
      log(`Authentication method: ${ctx.method}`);
    });
    
    // Log connection options (excluding sensitive data)
    log('Connecting with options:');
    log(`- Host: ${options.host}`);
    log(`- Port: ${options.port}`);
    log(`- Username: ${options.username}`);
    log(`- Using private key: ${options.privateKey ? 'Yes' : 'No'}`);
    log(`- Using certificate: ${options.certificate ? 'Yes' : 'No'}`);
    log(`- Using password: ${options.password ? 'Yes' : 'No'}`);
    
    // Connect with the options
    conn.connect(options);
  });
}

// Run the test
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
