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
        execSync(`ssh-keygen -t rsa -b 2048 -f "${keyPath}" -N "" -C "web-ssh-key"`, {
          stdio: 'ignore'
        });
      } catch (error) {
        logger.error('Failed to execute ssh-keygen:', error);
        // Fallback to Node.js crypto if ssh-keygen fails
        return this.generateKeyPairFallback();
      }

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();

      // Log key information for debugging
      logger.info('Generated SSH key pair using ssh-keygen');
      logger.debug(`Public key format: ${publicKey.substring(0, 20)}...`);
      logger.debug(`Private key format: ${privateKey.substring(0, 20)}...`);

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
      // Fallback to Node.js crypto if anything fails
      return this.generateKeyPairFallback();
    }
  }

  generateKeyPairFallback() {
    logger.info('Using fallback method to generate SSH key pair');
    try {
      // Generate key pair using Node.js crypto
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

      // For the fallback method, we'll use a simpler approach
      // Just return the PEM format keys directly
      // Vault will have to handle this format or we'll need to use mock data
      return {
        publicKey: tempKeyPair.publicKey,
        privateKey: tempKeyPair.privateKey
      };
    } catch (error) {
      logger.error('Failed to generate SSH key pair using fallback method:', error);
      throw error;
    }
  }

  async initiateSession(vmId, sshUser) {
    try {
      // Get VM details
      const vm = await vmService.getVMById(vmId);
      if (!vm) throw new Error('VM not found');

      // Generate temporary key pair
      const { publicKey, privateKey } = this.generateKeyPair();

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

  async handleWebSocketConnection(ws, sessionId) {
    const sessionData = this.sessionCache.get(sessionId);
    if (!sessionData) {
      ws.close(4001, 'Invalid session');
      return;
    }

    // Remove sensitive data from cache
    this.sessionCache.del(sessionId);

    const conn = new Client();

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

          // Check for specific error types
          if (err.message.includes('authentication')) {
            logger.error('Authentication error - check credentials and SSH server configuration');
          } else if (err.message.includes('connect')) {
            logger.error(`Connection error - check if SSH server is running on ${sessionData.targetIp}:22`);
          }

          reject(err);
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
        });

        // Log the session data for debugging (excluding sensitive info)
        logger.info(`Connecting to VM: ${sessionData.targetIp} as user: ${sessionData.sshUser}`);
        logger.info(`Using certificate: ${sessionData.certificate ? 'Yes' : 'No'}`);

        // Connect to VM with more options
        const connectOptions = {
          host: sessionData.targetIp,
          port: 22,
          username: sessionData.sshUser,
          // Add debug option to see more details
          debug: (message) => logger.debug(`SSH2 Debug: ${message}`),
          // Increase readyTimeout
          readyTimeout: 30000,
          // Try all authentication methods
          tryKeyboard: true,
          // Use the private key for authentication
          privateKey: sessionData.privateKey,
          // Add more detailed authentication logging
          authHandler: (methodsLeft, partialSuccess, callback) => {
            logger.info(`Authentication methods available: ${methodsLeft.join(', ')}`);
            logger.info(`Partial success: ${partialSuccess ? 'Yes' : 'No'}`);

            // Always try publickey first
            if (methodsLeft.includes('publickey')) {
              logger.info('Trying publickey authentication');
              return callback('publickey');
            }
            // Then try keyboard-interactive
            if (methodsLeft.includes('keyboard-interactive')) {
              logger.info('Trying keyboard-interactive authentication');
              return callback('keyboard-interactive');
            }
            // Then try password
            if (methodsLeft.includes('password')) {
              logger.info('Trying password authentication');
              return callback('password');
            }
            // If nothing else works, try the first available method
            logger.info(`Falling back to ${methodsLeft[0]} authentication`);
            return callback(methodsLeft[0]);
          }
        };

        // Add certificate if available
        if (sessionData.certificate) {
          logger.debug(`Certificate format: ${sessionData.certificate.substring(0, 20)}...`);

          // Check if the certificate is in the correct format
          if (sessionData.certificate.includes('ssh-rsa-cert-v01@openssh.com')) {
            logger.info('Certificate appears to be in the correct format');
          } else {
            logger.warn('Certificate may not be in the correct format');
          }

          connectOptions.certificate = sessionData.certificate;
        } else {
          logger.warn('No certificate available for SSH authentication');
        }

        // Add password if available
        if (sessionData.password) {
          connectOptions.password = sessionData.password;

          // Add keyboard-interactive handler that uses the password
          connectOptions.keyboard = (name, instructions, instructionsLang, prompts, finish) => {
            logger.info(`Keyboard-interactive auth requested: ${name}`);
            logger.debug(`Prompts: ${JSON.stringify(prompts)}`);

            // Respond with password to all prompts
            const responses = [];
            for (let i = 0; i < prompts.length; i++) {
              if (prompts[i].prompt.toLowerCase().includes('password')) {
                responses.push(sessionData.password);
              } else {
                responses.push('');
              }
            }

            finish(responses);
          };
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