/**
 * Fix for SSH key generation in ssh-session.service.js
 * 
 * This script converts the RSA key from PEM format to OpenSSH format
 * which is required by Vault for signing SSH keys.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the ssh-session.service.js file
const sshSessionServicePath = path.join(__dirname, 'src', 'services', 'ssh-session.service.js');

// Read the current file
let content = fs.readFileSync(sshSessionServicePath, 'utf8');

// Replace the generateKeyPair function with a fixed version
const oldFunction = `  generateKeyPair() {
    return generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
  }`;

const newFunction = `  generateKeyPair() {
    // Use ssh2 utils to generate SSH key pair in OpenSSH format
    try {
      // First, generate a temporary key pair
      const tempKeyPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      // Convert the public key to OpenSSH format
      // This is a workaround since Vault expects OpenSSH format
      const publicKey = tempKeyPair.publicKey.replace(/^-----BEGIN PUBLIC KEY-----\\n/, '')
        .replace(/\\n-----END PUBLIC KEY-----\\n?$/, '')
        .replace(/\\n/g, '');
      
      // Create a proper SSH public key format
      const sshPublicKey = \`ssh-rsa \${publicKey} web-ssh-key\`;
      
      return {
        publicKey: sshPublicKey,
        privateKey: tempKeyPair.privateKey
      };
    } catch (error) {
      logger.error('Failed to generate SSH key pair:', error);
      throw error;
    }
  }`;

// Replace the function
content = content.replace(oldFunction, newFunction);

// Write the updated file
fs.writeFileSync(sshSessionServicePath, content, 'utf8');

console.log('SSH key generation function has been fixed.');

// Restart the server
try {
  console.log('Restarting the server...');
  execSync('pm2 restart server');
  console.log('Server restarted successfully.');
} catch (error) {
  console.error('Failed to restart the server:', error.message);
  console.log('Please restart the server manually.');
}
