/**
 * OpenSSH Session Service
 *
 * This service uses the OpenSSH client directly instead of the ssh2 library
 * to establish SSH connections with certificate-based authentication.
 */

const crypto = require('crypto');
const NodeCache = require('node-cache');
const { spawn } = require('child_process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vaultSSHService = require('./vault-ssh.service');
const vmService = require('./vm.service');
const logger = require('../utils/logger');
const config = require('../config');

class OpenSSHSessionService {
  constructor() {
    // Cache for storing session data (TTL: 60 seconds)
    this.sessionCache = new NodeCache({ stdTTL: 60 });
    // Active sessions
    this.activeSessions = new Map();
    // Temporary directory for SSH keys and certificates
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openssh-'));

    // Create the temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    logger.info(`Created temporary directory for SSH keys: ${this.tempDir}`);

    // Clean up temp directory on exit
    process.on('exit', () => {
      try {
        this.cleanupTempDir();
      } catch (err) {
        logger.error(`Failed to clean up temp directory: ${err.message}`);
      }
    });
  }

  cleanupTempDir() {
    try {
      // Read all files in the temp directory
      const files = fs.readdirSync(this.tempDir);

      // Delete each file
      for (const file of files) {
        fs.unlinkSync(path.join(this.tempDir, file));
      }

      // Delete the directory
      fs.rmdirSync(this.tempDir);

      logger.info(`Cleaned up temporary directory: ${this.tempDir}`);
    } catch (err) {
      logger.error(`Failed to clean up temporary directory: ${err.message}`);
    }
  }

  generateKeyPair() {
    try {
      // Generate a unique ID for this key pair
      const keyId = crypto.randomUUID();
      const keyPath = path.join(this.tempDir, `key_${keyId}`);

      // Generate SSH key using ssh-keygen
      execSync(`ssh-keygen -t rsa -b 2048 -m PEM -f "${keyPath}" -N "" -C "web-ssh-key"`, {
        stdio: 'ignore'
      });

      logger.info('Successfully generated SSH key pair using ssh-keygen');

      // Read the generated keys
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();

      // Log key information for debugging
      logger.debug(`Public key format: ${publicKey.substring(0, 20)}...`);

      return {
        publicKey,
        privateKey,
        keyPath,
        keyId
      };
    } catch (error) {
      logger.error('Failed to generate SSH key pair:', error);
      throw error;
    }
  }

  async initiateSession(vmId, sshUser) {
    try {
      // Get VM details
      const vm = await vmService.getVMById(vmId);
      if (!vm) throw new Error('VM not found');

      // Generate temporary key pair
      const { publicKey, privateKey, keyPath, keyId } = this.generateKeyPair();

      // Get signed certificate from Vault
      const { certificate, serialNumber } = await vaultSSHService.signSSHKey(
        publicKey,
        sshUser
      );

      // Save certificate to file
      const certPath = `${keyPath}-cert.pub`;
      fs.writeFileSync(certPath, certificate);

      logger.info(`Saved certificate to ${certPath}`);

      // Generate session ID
      const sessionId = crypto.randomUUID();

      // Store session info
      this.sessionCache.set(sessionId, {
        vmId,
        targetIp: vm.publicIpAddress || vm.ipAddress,
        sshUser,
        keyPath,
        certPath,
        keyId,
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

    try {
      logger.info(`Connecting to VM: ${sessionData.targetIp} as user: ${sessionData.sshUser}`);
      logger.info(`Using certificate: ${sessionData.certPath}`);

      // Build SSH command
      const sshArgs = [
        '-i', sessionData.keyPath,
        '-o', `CertificateFile=${sessionData.certPath}`,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'LogLevel=DEBUG3', // Enable detailed logging
        '-o', 'ServerAliveInterval=30', // Keep connection alive
        '-o', 'ServerAliveCountMax=3', // Number of alive messages without response
        '-o', 'ConnectTimeout=30', // Connection timeout in seconds
        '-t', // Force pseudo-terminal allocation
        `${sessionData.sshUser}@${sessionData.targetIp}`
      ];

      logger.info(`SSH command: ssh ${sshArgs.join(' ')}`);

      // Spawn SSH process with pseudo-terminal allocation
      // Use the -tt option to force pseudo-terminal allocation even when stdin is not a terminal
      sshArgs.unshift('-tt');

      // We'll use regular child_process since node-pty requires compilation
      // and may not be available in all environments
      let ptyProcess = null;
      logger.info('Using regular child_process for SSH connection');

      // If node-pty is not available, use regular child_process
      const sshProcess = ptyProcess || spawn('ssh', sshArgs, {
        env: { ...process.env, TERM: 'xterm-256color' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Log whether we're using pty or regular process
      logger.info(`SSH process started: ${ptyProcess ? 'Using PTY' : 'Using regular process'}`);

      // Define a wrapper function to handle both pty and regular process
      const writeToProcess = (data) => {
        if (ptyProcess) {
          ptyProcess.write(data);
        } else if (sshProcess.stdin && sshProcess.stdin.writable) {
          sshProcess.stdin.write(data);
        }
      };

      // Store process for cleanup
      this.activeSessions.set(sessionId, {
        process: sshProcess,
        ws,
        keyPath: sessionData.keyPath,
        certPath: sessionData.certPath
      });

      // Set up data handling based on whether we're using pty or regular process
      if (ptyProcess) {
        // Handle pty data (combines stdout and stderr)
        ptyProcess.onData((data) => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(Buffer.from(data));
          }
        });

        // Handle pty exit
        ptyProcess.onExit(({ exitCode, signal }) => {
          logger.info(`SSH process exited with code ${exitCode} and signal ${signal}`);

          // Clean up key files
          this.cleanupSessionFiles(sessionData);

          // Close WebSocket if it's still open
          if (ws.readyState === 1) {
            ws.close(1000, `SSH process exited with code ${exitCode}`);
          }

          // Remove from active sessions
          this.activeSessions.delete(sessionId);
        });
      } else {
        // Handle SSH process stdout
        sshProcess.stdout.on('data', (data) => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(data);
          }
        });

        // Handle SSH process stderr
        sshProcess.stderr.on('data', (data) => {
          const stderr = data.toString();
          logger.debug(`SSH stderr: ${stderr}`);

          // Send stderr to client as well
          if (ws.readyState === 1) {
            ws.send(data);
          }
        });

        // Handle SSH process exit
        sshProcess.on('exit', (code, signal) => {
          logger.info(`SSH process exited with code ${code} and signal ${signal}`);

          // Clean up key files
          this.cleanupSessionFiles(sessionData);

          // Close WebSocket if it's still open
          if (ws.readyState === 1) {
            ws.close(1000, `SSH process exited with code ${code}`);
          }

          // Remove from active sessions
          this.activeSessions.delete(sessionId);
        });

        // Handle SSH process error
        sshProcess.on('error', (error) => {
          logger.error(`SSH process error: ${error.message}`);

          // Send error message to client
          if (ws.readyState === 1) {
            ws.send(Buffer.from(`\r\nError: ${error.message}\r\n`));
            ws.close(4002, error.message);
          }

          // Clean up key files
          this.cleanupSessionFiles(sessionData);

          // Remove from active sessions
          this.activeSessions.delete(sessionId);
        });
      }

      // Handle WebSocket messages (user input)
      ws.on('message', (data) => {
        writeToProcess(data);
      });

      // Handle WebSocket close
      ws.on('close', (code, reason) => {
        logger.info(`WebSocket closed with code ${code} and reason: ${reason || 'No reason provided'}`);

        // Add a small delay before terminating the SSH process
        // This gives the SSH process time to complete authentication
        setTimeout(() => {
          logger.info('Terminating SSH process after WebSocket close');

          // Terminate SSH process
          if (sshProcess.pid) {
            try {
              process.kill(sshProcess.pid);
            } catch (err) {
              logger.error(`Failed to kill SSH process: ${err.message}`);
            }
          }

          // Clean up key files
          this.cleanupSessionFiles(sessionData);

          // Remove from active sessions
          this.activeSessions.delete(sessionId);
        }, 1000); // 1 second delay
      });

      // Handle WebSocket error
      ws.on('error', (err) => {
        logger.error(`WebSocket error: ${err.message}`);
      });

    } catch (error) {
      logger.error('SSH connection error:', error);

      // Clean up key files
      this.cleanupSessionFiles(sessionData);

      // Send error message to client
      try {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message || 'SSH connection failed'
          }));
        }
      } catch (wsError) {
        logger.error('Failed to send error message to WebSocket:', wsError);
      }

      // Close the WebSocket with error code
      ws.close(4002, error.message || 'SSH connection failed');
    }
  }

  cleanupSessionFiles(sessionData) {
    try {
      // Delete private key
      if (sessionData.keyPath && fs.existsSync(sessionData.keyPath)) {
        fs.unlinkSync(sessionData.keyPath);
        logger.debug(`Deleted private key: ${sessionData.keyPath}`);
      }

      // Delete public key
      const pubKeyPath = `${sessionData.keyPath}.pub`;
      if (fs.existsSync(pubKeyPath)) {
        fs.unlinkSync(pubKeyPath);
        logger.debug(`Deleted public key: ${pubKeyPath}`);
      }

      // Delete certificate
      if (sessionData.certPath && fs.existsSync(sessionData.certPath)) {
        fs.unlinkSync(sessionData.certPath);
        logger.debug(`Deleted certificate: ${sessionData.certPath}`);
      }
    } catch (err) {
      logger.error(`Failed to clean up session files: ${err.message}`);
    }
  }

  terminateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        // Terminate SSH process
        if (session.process && session.process.pid) {
          try {
            process.kill(session.process.pid);
          } catch (err) {
            logger.error(`Failed to kill SSH process: ${err.message}`);
          }
        }

        // Close WebSocket if it's open
        if (session.ws && session.ws.readyState === 1) { // WebSocket.OPEN
          session.ws.close(1000, 'Session terminated');
        }

        // Clean up key files
        if (session.keyPath) {
          try {
            fs.unlinkSync(session.keyPath);
            fs.unlinkSync(`${session.keyPath}.pub`);
          } catch (err) {
            logger.error(`Failed to delete key files: ${err.message}`);
          }
        }

        if (session.certPath) {
          try {
            fs.unlinkSync(session.certPath);
          } catch (err) {
            logger.error(`Failed to delete certificate file: ${err.message}`);
          }
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

module.exports = new OpenSSHSessionService();
