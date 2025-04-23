/**
 * Test script to validate SSH key and certificate formats
 * 
 * This script helps diagnose issues with SSH key formats by:
 * 1. Generating a new SSH key pair
 * 2. Signing it with Vault
 * 3. Validating the formats of both the key and certificate
 * 4. Testing if the ssh2 library can parse them correctly
 */

const { Client } = require('ssh2');
const { parseKey } = require('ssh2').utils;
const { generateKeyPairSync } = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vaultSSHService = require('./src/services/vault-ssh.service');

// Configure logging
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

async function main() {
  try {
    log('Starting SSH key format test');
    
    // Step 1: Generate SSH key pair using ssh-keygen
    log('Generating SSH key pair using ssh-keygen...');
    const { privateKey: sshKeygenPrivateKey, publicKey: sshKeygenPublicKey } = await generateSshKeygenKeyPair();
    
    log('Testing ssh-keygen generated keys with ssh2 library...');
    testKeyWithSsh2(sshKeygenPrivateKey, sshKeygenPublicKey);
    
    // Step 2: Generate SSH key pair using Node.js crypto
    log('Generating SSH key pair using Node.js crypto...');
    const { privateKey: cryptoPrivateKey, publicKey: cryptoPublicKey } = generateCryptoKeyPair();
    
    log('Testing Node.js crypto generated keys with ssh2 library...');
    testKeyWithSsh2(cryptoPrivateKey, cryptoPublicKey);
    
    // Step 3: Sign the keys with Vault
    log('Signing ssh-keygen public key with Vault...');
    const { certificate: sshKeygenCert } = await vaultSSHService.signSSHKey(sshKeygenPublicKey, 'ubuntu');
    
    log('Signing Node.js crypto public key with Vault...');
    const { certificate: cryptoCert } = await vaultSSHService.signSSHKey(cryptoPublicKey, 'ubuntu');
    
    // Step 4: Test certificates with ssh2
    if (sshKeygenCert) {
      log('Testing ssh-keygen certificate with ssh2 library...');
      testCertificateWithSsh2(sshKeygenPrivateKey, sshKeygenCert);
    } else {
      error('No certificate returned for ssh-keygen key');
    }
    
    if (cryptoCert) {
      log('Testing Node.js crypto certificate with ssh2 library...');
      testCertificateWithSsh2(cryptoPrivateKey, cryptoCert);
    } else {
      error('No certificate returned for Node.js crypto key');
    }
    
    log('SSH key format test completed');
  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
  }
}

async function generateSshKeygenKeyPair() {
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
    throw new Error(`Failed to generate SSH key pair using ssh-keygen: ${error.message}`);
  }
}

function generateCryptoKeyPair() {
  try {
    // Generate key pair using Node.js crypto
    const tempKeyPair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs1', // Use pkcs1 format for better compatibility with SSH
        format: 'pem'
      }
    });
    
    // Convert the public key to OpenSSH format
    const publicKeyLines = tempKeyPair.publicKey
      .replace('-----BEGIN PUBLIC KEY-----\n', '')
      .replace('\n-----END PUBLIC KEY-----\n', '')
      .replace(/\n/g, '');
    
    const sshPublicKey = `ssh-rsa ${publicKeyLines} test-key`;
    
    log(`Node.js crypto key pair generated successfully`);
    log(`Private key format: ${tempKeyPair.privateKey.substring(0, 40)}...`);
    log(`Public key format: ${sshPublicKey.substring(0, 40)}...`);
    
    return {
      privateKey: tempKeyPair.privateKey,
      publicKey: sshPublicKey
    };
  } catch (error) {
    throw new Error(`Failed to generate SSH key pair using Node.js crypto: ${error.message}`);
  }
}

function testKeyWithSsh2(privateKey, publicKey) {
  try {
    // Test parsing private key
    const parsedPrivateKey = parseKey(privateKey);
    if (parsedPrivateKey instanceof Error) {
      error(`Failed to parse private key: ${parsedPrivateKey.message}`);
    } else {
      log('Private key parsed successfully by ssh2');
      log(`Key type: ${parsedPrivateKey.type}`);
      log(`Is private key: ${parsedPrivateKey.isPrivateKey() ? 'Yes' : 'No'}`);
    }
    
    // Test parsing public key
    const parsedPublicKey = parseKey(publicKey);
    if (parsedPublicKey instanceof Error) {
      error(`Failed to parse public key: ${parsedPublicKey.message}`);
    } else {
      log('Public key parsed successfully by ssh2');
      log(`Key type: ${parsedPublicKey.type}`);
      log(`Is private key: ${parsedPublicKey.isPrivateKey() ? 'Yes' : 'No'}`);
    }
  } catch (err) {
    error(`Error testing key with ssh2: ${err.message}`);
  }
}

function testCertificateWithSsh2(privateKey, certificate) {
  try {
    log(`Testing certificate: ${certificate.substring(0, 40)}...`);
    
    // Test parsing certificate
    const parsedCert = parseKey(certificate);
    if (parsedCert instanceof Error) {
      error(`Failed to parse certificate: ${parsedCert.message}`);
      
      // Check for common issues
      if (certificate.includes(' ')) {
        const parts = certificate.split(' ');
        log(`Certificate has ${parts.length} parts`);
        if (parts.length >= 2) {
          const base64Part = parts[1];
          const base64Regex = /^[A-Za-z0-9+/=]+$/;
          if (!base64Regex.test(base64Part)) {
            error('Certificate contains non-base64 characters in the data section');
          }
        }
      }
    } else {
      log('Certificate parsed successfully by ssh2');
      log(`Certificate type: ${parsedCert.type}`);
    }
    
    // Test creating a client with the key and certificate
    try {
      const conn = new Client();
      const connectOptions = {
        host: 'localhost', // Not actually connecting, just testing parsing
        port: 22,
        username: 'test',
        privateKey: privateKey,
        certificate: certificate,
        // Don't actually try to connect
        readyTimeout: 1,
        hostVerifier: () => false
      };
      
      // Just test if the client can be created without errors
      conn.on('error', () => {});
      conn.on('ready', () => {});
      
      // This will throw an error if the key or certificate format is invalid
      conn.connect(connectOptions);
      
      log('Client created successfully with private key and certificate');
    } catch (clientErr) {
      error(`Failed to create SSH client: ${clientErr.message}`);
    }
  } catch (err) {
    error(`Error testing certificate with ssh2: ${err.message}`);
  }
}

// Run the test
main().catch(err => {
  error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
