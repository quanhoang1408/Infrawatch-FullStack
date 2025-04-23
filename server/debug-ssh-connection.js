/**
 * Debug script to test SSH connection with certificate
 * 
 * This script:
 * 1. Generates a new SSH key pair using ssh-keygen
 * 2. Signs the public key with Vault
 * 3. Attempts to connect to the VM using the private key and certificate
 * 4. Provides detailed debugging information
 */

const { Client } = require('ssh2');
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
const SSH_PASSWORD = process.env.SSH_PASSWORD || '';

async function main() {
  try {
    log('Starting SSH connection debug test');
    log(`Target VM: ${VM_IP}, User: ${SSH_USER}`);
    
    // Step 1: Generate SSH key pair using ssh-keygen
    log('Generating SSH key pair using ssh-keygen...');
    const { privateKey, publicKey } = await generateSshKeyPair();
    
    // Step 2: Sign the public key with Vault
    log('Signing public key with Vault...');
    const { certificate } = await vaultSSHService.signSSHKey(publicKey, SSH_USER);
    
    if (!certificate) {
      error('Failed to get certificate from Vault');
      process.exit(1);
    }
    
    log(`Certificate received: ${certificate.substring(0, 50)}...`);
    
    // Step 3: Validate the certificate
    log('Validating certificate...');
    validateCertificate(certificate);
    
    // Step 4: Test SSH connection
    log('Testing SSH connection with certificate...');
    await testConnection({
      host: VM_IP,
      port: 22,
      username: SSH_USER,
      privateKey: privateKey,
      certificate: certificate,
      debug: true,
      readyTimeout: 30000
    });
    
    log('SSH connection test completed');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

async function generateSshKeyPair() {
  try {
    // Create temporary directory for key generation
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-debug-'));
    const keyPath = path.join(tempDir, 'id_rsa');
    
    // Generate SSH key using ssh-keygen
    execSync(`ssh-keygen -t rsa -b 2048 -m PEM -f "${keyPath}" -N "" -C "debug-key"`, {
      stdio: 'ignore'
    });
    
    // Read the generated keys
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();
    
    log(`SSH key pair generated successfully`);
    log(`Private key format: ${privateKey.substring(0, 40)}...`);
    log(`Public key format: ${publicKey.substring(0, 40)}...`);
    
    // Save keys to debug directory for manual testing
    const debugDir = path.join(__dirname, 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    
    fs.writeFileSync(path.join(debugDir, 'debug_key'), privateKey);
    fs.writeFileSync(path.join(debugDir, 'debug_key.pub'), publicKey);
    log(`Keys saved to debug directory for manual testing`);
    
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

function validateCertificate(certificate) {
  try {
    // Create a temporary file to test the certificate
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-cert-debug-'));
    const certPath = path.join(tempDir, 'test-cert.pub');
    
    // Write certificate to file
    fs.writeFileSync(certPath, certificate);
    
    // Try to validate the certificate
    try {
      const output = execSync(`ssh-keygen -L -f "${certPath}"`, { encoding: 'utf8' });
      log('Certificate validated successfully with ssh-keygen');
      log(`Certificate details:\n${output}`);
      
      // Save certificate to debug directory for manual testing
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir);
      }
      
      fs.writeFileSync(path.join(debugDir, 'debug_cert.pub'), certificate);
      log(`Certificate saved to debug directory for manual testing`);
      
    } catch (validateError) {
      error(`Certificate validation failed: ${validateError.message}`);
      if (validateError.stdout) log(`Validation stdout: ${validateError.stdout}`);
      if (validateError.stderr) error(`Validation stderr: ${validateError.stderr}`);
      throw new Error('Certificate validation failed');
    } finally {
      // Clean up
      try {
        fs.unlinkSync(certPath);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        log(`Warning: Failed to clean up temporary certificate file: ${cleanupError.message}`);
      }
    }
  } catch (err) {
    error(`Failed to validate certificate: ${err.message}`);
    throw err;
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
      error(`Connection error: ${err.message}`);
      error(`Error stack: ${err.stack}`);
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
      if (ctx.method === 'publickey') {
        log(`Public key authentication attempt`);
        if (ctx.signature) {
          log('Signature provided with public key authentication');
        } else {
          log('No signature provided with public key authentication (initial probe)');
        }
      }
    });
    
    // Log connection options (excluding sensitive data)
    log('Connecting with options:');
    log(`- Host: ${options.host}`);
    log(`- Port: ${options.port}`);
    log(`- Username: ${options.username}`);
    log(`- Using private key: ${options.privateKey ? 'Yes' : 'No'}`);
    log(`- Using certificate: ${options.certificate ? 'Yes' : 'No'}`);
    log(`- Using password: ${options.password ? 'Yes' : 'No'}`);
    
    // Add debug handler if requested
    if (options.debug) {
      options.debug = (message) => {
        log(`SSH2 Debug: ${message}`);
      };
    }
    
    // Connect with the options
    conn.connect(options);
  });
}

// Create debug directory if it doesn't exist
const debugDir = path.join(__dirname, 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir);
}

// Run the test
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
