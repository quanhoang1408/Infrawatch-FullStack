const { Client } = require('ssh2');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const { generateKeyPairSync } = require('crypto');
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
        serialNumber
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

        // Connect to VM
        conn.connect({
          host: sessionData.targetIp,
          port: 22,
          username: sessionData.sshUser,
          privateKey: sessionData.privateKey,
          certificate: sessionData.certificate
        });
      });

      // Store active session
      this.activeSessions.set(sessionId, { conn, ws });

    } catch (error) {
      logger.error('SSH connection error:', error);
      const errorMessage = error.message || 'SSH connection failed';
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