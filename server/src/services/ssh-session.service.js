const { Client } = require('ssh2');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const { generateKeyPairSync } = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vaultSSHService = require('./vault-ssh.service');
const vmService = require('./vm.service');
const logger = require('../utils/logger');
const config = require('../config');

class SSHSessionService {
  constructor() {
    // Cache for storing session data (TTL: 60 seconds)
    this.sessionCache = new NodeCache({ stdTTL: 60 });
    // Active sessions
    this.activeSessions = new Map();
  }

  generateKeyPair() {
    try {
      // Create temporary directory for key generation
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-keys-'));
      const keyPath = path.join(tempDir, 'id_rsa');

      // Generate SSH key using ssh-keygen (most reliable way to get correct format)
      try {
        // Use -m PEM to ensure the private key is in PEM format
        execSync(`ssh-keygen -t rsa -b 2048 -m PEM -f "${keyPath}" -N "" -C "web-ssh-key"`, {
          stdio: 'ignore'
        });

        logger.info('Successfully executed ssh-keygen command');
      } catch (error) {
        // If ssh-keygen fails, throw an error instead of using fallback
        // The fallback method using Node.js crypto has proven to be problematic with SSH certificates
        logger.error('Failed to execute ssh-keygen:', error);
        throw new Error('Failed to generate SSH key pair using ssh-keygen. This is required for certificate-based authentication.');
      }

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();

      // Log key information for debugging
      logger.info('Generated SSH key pair using ssh-keygen');
      logger.debug(`Public key format: ${publicKey.substring(0, 20)}...`);
      logger.debug(`Private key format: ${privateKey.substring(0, 20)}...`);

      // Verify the keys are in the correct format
      if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
        logger.error('Private key is not in PEM format, this will cause authentication issues');
        throw new Error('Generated private key is not in PEM format');
      }

      if (!publicKey.startsWith('ssh-rsa ')) {
        logger.error('Public key is not in OpenSSH format, this will cause signing issues');
        throw new Error('Generated public key is not in OpenSSH format');
      }

      // Clean up temporary files
      try {
        fs.unlinkSync(keyPath);
        fs.unlinkSync(`${keyPath}.pub`);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary SSH key files:', cleanupError);
      }

      return { publicKey, privateKey };
    } catch (error) {
      logger.error('Failed to generate SSH key pair:', error);
      throw error; // Don't use fallback, propagate the error
    }
  }

  // This method is kept for reference but should not be used
  // It has been proven to generate keys that are not compatible with SSH certificates
  generateKeyPairFallback() {
    logger.error('Fallback key generation method is disabled - it produces incompatible keys');
    throw new Error('SSH key generation fallback is disabled. Please ensure ssh-keygen is available.');
  }

  async initiateSession(vmId, sshUser) {
    try {
      // Get VM details
      const vm = await vmService.getVMById(vmId);
      if (!vm) throw new Error('VM not found');

      // Use existing key pair or generate temporary key pair
      let publicKey, privateKey;

      // Check if we should use a fixed key pair (for testing)
      if (process.env.USE_FIXED_KEY === 'true' && fs.existsSync(process.env.FIXED_KEY_PATH || '~/.ssh/id_rsa_infrawatch')) {
        try {
          const keyPath = process.env.FIXED_KEY_PATH || '~/.ssh/id_rsa_infrawatch';
          logger.info(`Using fixed key pair from ${keyPath}`);
          privateKey = fs.readFileSync(keyPath.replace(/^~/, os.homedir()), 'utf8');

          // Try to read public key if it exists
          const pubKeyPath = `${keyPath}.pub`;
          if (fs.existsSync(pubKeyPath.replace(/^~/, os.homedir()))) {
            publicKey = fs.readFileSync(pubKeyPath.replace(/^~/, os.homedir()), 'utf8').trim();
          } else {
            // Generate a temporary public key just for signing
            // This won't be used for authentication, just for getting a certificate
            const tempKeyPair = this.generateKeyPair();
            publicKey = tempKeyPair.publicKey;
          }
        } catch (keyError) {
          logger.error(`Failed to read fixed key pair: ${keyError.message}`);
          // Fall back to generating a temporary key pair
          const tempKeyPair = this.generateKeyPair();
          publicKey = tempKeyPair.publicKey;
          privateKey = tempKeyPair.privateKey;
        }
      } else {
        // Generate temporary key pair
        const tempKeyPair = this.generateKeyPair();
        publicKey = tempKeyPair.publicKey;
        privateKey = tempKeyPair.privateKey;
      }

      // Get signed certificate from Vault
      const { certificate, serialNumber } = await vaultSSHService.signSSHKey(
        publicKey,
        sshUser
      );

      // Generate session ID
      const sessionId = crypto.randomUUID();

      // Store session info
      this.sessionCache.set(sessionId, {
        vmId,
        targetIp: vm.publicIpAddress || vm.ipAddress,
        sshUser,
        certificate,
        privateKey,
        serialNumber,
        // Add default password for testing - this should be replaced with a secure method in production
        password: process.env.SSH_DEFAULT_PASSWORD || 'ubuntu'
      });

      return {
        sessionId,
        websocketUrl: `wss://${config.apiDomain}/ws-ssh`
      };
    } catch (error) {
      logger.error('Failed to initiate SSH session:', error);
      throw error;
    }
  }

  async handleWebSocketConnection(ws, sessionId, req) {
    const sessionData = this.sessionCache.get(sessionId);
    if (!sessionData) {
      ws.close(4001, 'Invalid session');
      return;
    }

    // Remove sensitive data from cache
    this.sessionCache.del(sessionId);

    let conn = new Client();

    try {
      await new Promise((resolve, reject) => {
        conn.on('ready', () => {
          // Clear connection timeout
          clearTimeout(timeout);
          // Request a pseudo-terminal with default size
          conn.shell({ term: 'xterm-color', rows: 24, cols: 80 }, (err, stream) => {
            if (err) reject(err);

            // Handle WebSocket messages
            ws.on('message', (data) => {
              // Data is already a Buffer or string, write directly to stream
              stream.write(data);
            });

            // Handle stream data
            stream.on('data', (data) => {
              // Send raw data to WebSocket if it's open
              if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(data);
              }
            });

            // Handle stream stderr
            stream.stderr.on('data', (data) => {
              if (ws.readyState === 1) {
                ws.send(data);
              }
            });

            // Handle stream close
            stream.on('close', () => {
              conn.end();
              ws.close();
            });

            resolve();
          });
        });

        conn.on('error', (err) => {
          logger.error('SSH connection error:', err);
          logger.error(`Error details: ${err.message}`);
          logger.error(`Error stack: ${err.stack}`);

          // Check for specific error types
          if (err.message.includes('authentication')) {
            logger.error('Authentication error - check credentials and SSH server configuration');
            logger.error(`VM IP: ${sessionData.targetIp}, User: ${sessionData.sshUser}`);

            // Log detailed information about the authentication attempt
            logger.error('Authentication details:');
            logger.error(`- Private key format: ${sessionData.privateKey ? sessionData.privateKey.substring(0, 20) + '...' : 'Not available'}`);
            logger.error(`- Certificate available: ${sessionData.certificate ? 'Yes' : 'No'}`);
            if (sessionData.certificate) {
              logger.error(`- Certificate format: ${sessionData.certificate.substring(0, 20)}...`);
            }

            // Log authentication methods tried
            logger.error('Authentication methods:');
            logger.error(`- Private key: ${sessionData.privateKey ? 'Yes' : 'No'}`);
            logger.error(`- Certificate: ${sessionData.certificate ? 'Yes' : 'No'}`);
            logger.error(`- Password: ${sessionData.password ? 'Yes' : 'No'}`);

            // Try to parse the error message for more details
            if (err.message.includes('illegal base64')) {
              logger.error('Base64 encoding error detected in key or certificate');
              logger.error('This usually indicates a malformed certificate or private key');
            }

            // Reject with detailed error
            reject(new Error(`Authentication failed for user ${sessionData.sshUser}@${sessionData.targetIp}: ${err.message}`));
          } else if (err.message.includes('connect')) {
            logger.error(`Connection error - check if SSH server is running on ${sessionData.targetIp}:22`);
            reject(new Error(`Failed to connect to ${sessionData.targetIp}:22: ${err.message}`));
          } else if (err.message.includes('certificate')) {
            logger.error(`Certificate error: ${err.message}`);
            logger.error('This may indicate an issue with the certificate format or validation');
            reject(new Error(`Certificate error: ${err.message}`));
          } else {
            // For other errors, log additional details and reject
            logger.error(`Unhandled SSH error: ${err.message}`);
            reject(err);
          }
        });

        // Handle connection timeout
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // 10 seconds timeout

        // Handle connection close
        conn.on('close', () => {
          logger.info('SSH connection closed');
        });

        // Add more detailed debugging
        conn.on('handshake', () => {
          logger.info('SSH handshake successful');
        });

        conn.on('banner', (message) => {
          logger.info(`SSH banner: ${message}`);
        });

        // Add more detailed authentication debugging
        conn.on('authentication', (ctx) => {
          logger.info(`Authentication method: ${ctx.method}`);
          if (ctx.username) {
            logger.info(`Authentication username: ${ctx.username}`);
          }
          if (ctx.method === 'publickey') {
            logger.info('Public key authentication attempt');
            if (ctx.signature) {
              logger.info('Signature provided with public key authentication');
            } else {
              logger.info('No signature provided with public key authentication (initial probe)');
            }
          }
        });

        // Log the session data for debugging (excluding sensitive info)
        logger.info(`Connecting to VM: ${sessionData.targetIp} as user: ${sessionData.sshUser}`);
        logger.info(`Using certificate: ${sessionData.certificate ? 'Yes' : 'No'}`);

        // Use certificate-based authentication
        logger.info(`Connecting to VM: ${sessionData.targetIp} as user: ${sessionData.sshUser}`);
        logger.info(`Using certificate: ${sessionData.certificate ? 'Yes' : 'No'}`);

        // Log the private key and certificate for debugging
        if (sessionData.privateKey) {
          logger.debug(`Private key (first 20 chars): ${sessionData.privateKey.substring(0, 20)}...`);
        } else {
          logger.error('No private key available');
        }

        if (sessionData.certificate) {
          logger.debug(`Certificate (first 20 chars): ${sessionData.certificate.substring(0, 20)}...`);
        } else {
          logger.warn('No certificate available, will use private key authentication');
        }

        // Create connection options with certificate-based authentication
        const connectOptions = {
          host: sessionData.targetIp,
          port: 22,
          username: sessionData.sshUser,
          // Use the private key for authentication
          // Ensure the private key is properly formatted
          privateKey: sessionData.privateKey.trim(),  // Trim any extra whitespace
          // Increase readyTimeout
          readyTimeout: 30000,
          // Add detailed debugging
          debug: (message) => {
            logger.debug(`SSH2 Debug: ${message}`);
            // Log specific authentication-related messages with higher visibility
            if (message.includes('Authentication method')) {
              logger.info(`SSH Authentication: ${message}`);
            }
            if (message.includes('publickey')) {
              logger.info(`SSH Publickey: ${message}`);
            }
          }
        };

        // Add certificate if available and not disabled for testing
        const disableCertAuth = process.env.DISABLE_CERT_AUTH === 'true';

        if (sessionData.certificate && !disableCertAuth) {
          // Ensure certificate is in the correct format
          if (sessionData.certificate.startsWith('ssh-rsa-cert-v01@openssh.com ')) {
            // Important: Make sure the certificate is properly formatted
            // The ssh2 library is very sensitive to the exact format
            const certParts = sessionData.certificate.split(' ');
            if (certParts.length >= 2) {
              // Reconstruct the certificate to ensure proper format
              // This ensures we have exactly the format: type base64data [comment]
              const certType = certParts[0];
              const certData = certParts[1];
              const certComment = certParts.length > 2 ? certParts.slice(2).join(' ') : '';

              // Reconstruct with proper spacing
              const formattedCert = certComment ?
                `${certType} ${certData} ${certComment}` :
                `${certType} ${certData}`;

              connectOptions.certificate = formattedCert;
              logger.info('Using certificate-based authentication');
              logger.debug(`Certificate full content: ${formattedCert}`);

              // Set specific authentication methods and order
              // This ensures we try certificate auth first, then key, then password
              connectOptions.authHandler = ['publickey', 'password'];

              logger.info('Authentication methods set to: publickey, password');
            } else {
              logger.error('Certificate has invalid structure (not enough parts)');
              logger.error(`Certificate: ${sessionData.certificate}`);
            }
          } else {
            logger.error('Certificate has invalid format, not using it for authentication');
            logger.error(`Certificate format: ${sessionData.certificate.substring(0, 30)}...`);
          }
        } else {
          if (disableCertAuth) {
            logger.info('Certificate authentication disabled for testing');
          } else {
            logger.info('Using private key authentication without certificate');
          }
        }

        // Log full private key for debugging
        logger.debug(`Private key full content: ${sessionData.privateKey}`);

        // Try password authentication as fallback or primary method
        const usePasswordAuth = process.env.USE_PASSWORD_AUTH === 'true';

        if (sessionData.password) {
          connectOptions.password = sessionData.password;

          if (usePasswordAuth) {
            // If password auth is forced, remove other auth methods
            delete connectOptions.privateKey;
            delete connectOptions.certificate;
            logger.info('Using password-only authentication (forced by environment variable)');
          } else {
            logger.info('Added password as fallback authentication method');
          }
        }

        // Connect with the options
        conn.connect(connectOptions);
      });

      // Store active session
      this.activeSessions.set(sessionId, { conn, ws });

    } catch (error) {
      logger.error('SSH connection error:', error);
      logger.error(`Error stack: ${error.stack}`);

      // Provide a more user-friendly error message
      let errorMessage = 'SSH connection failed';

      if (error.message.includes('authentication')) {
        errorMessage = 'Authentication failed. Please check your credentials.';
      } else if (error.message.includes('connect')) {
        errorMessage = `Failed to connect to ${sessionData.targetIp}. Please check if the VM is running and accessible.`;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timed out. Please check your network and VM status.';
      } else {
        errorMessage = error.message || 'SSH connection failed';
      }

      // Send error message to client
      try {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(JSON.stringify({
            type: 'error',
            message: errorMessage
          }));
        }
      } catch (wsError) {
        logger.error('Failed to send error message to WebSocket:', wsError);
      }

      // Close the WebSocket with error code
      ws.close(4002, errorMessage);
    }
  }

  terminateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        // Close SSH connection
        if (session.conn) {
          session.conn.end();
        }

        // Close WebSocket if it's open
        if (session.ws && session.ws.readyState === 1) { // WebSocket.OPEN
          session.ws.close(1000, 'Session terminated');
        }
      } catch (error) {
        logger.error(`Error terminating session ${sessionId}:`, error);
      } finally {
        // Remove from active sessions
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

module.exports = new SSHSessionService();