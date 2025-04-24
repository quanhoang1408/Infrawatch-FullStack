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

  async handleWebSocketConnection(ws, sessionId, req) {
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
        '-o', 'SendEnv=TERM', // Send terminal environment
        '-tt', // Force pseudo-terminal allocation (double -t for non-interactive stdin)
        `${sessionData.sshUser}@${sessionData.targetIp}`
      ];

      logger.info(`SSH command: ssh ${sshArgs.join(' ')}`);

      // Add environment variables for better terminal support
      const sshEnv = {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1', // Force color output
        COLORTERM: 'truecolor', // Enable true color support
        LANG: 'en_US.UTF-8', // Set locale for proper character handling
        LC_ALL: 'en_US.UTF-8'
      };

      // We'll use regular child_process since node-pty requires compilation
      // and may not be available in all environments
      let ptyProcess = null;
      logger.info('Using regular child_process for SSH connection');

      // Use regular child_process with improved configuration
      const sshProcess = spawn('ssh', sshArgs, {
        env: sshEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false, // Don't use shell to avoid issues with output
        windowsHide: true // Hide the console window on Windows
      });

      // Check if process started successfully
      if (!sshProcess || !sshProcess.pid) {
        const error = new Error('Failed to start SSH process');
        logger.error(error.message);
        throw error;
      }

      // Log process details
      logger.info(`SSH process started with PID: ${sshProcess.pid}`);
      logger.info('Waiting for initial output from SSH process...');

      // Set up error handler for the process itself
      sshProcess.on('error', (error) => {
        logger.error(`SSH process error: ${error.message}`);
        // Try to send error to client
        if (ws.readyState === 1) {
          try {
            ws.send(JSON.stringify({
              type: 'data',
              data: `\r\nSSH process error: ${error.message}\r\n`
            }));
          } catch (wsError) {
            logger.error(`Failed to send process error to WebSocket: ${wsError.message}`);
          }
        }
      });

      // Log whether we're using pty or regular process
      logger.info(`SSH process started: ${ptyProcess ? 'Using PTY' : 'Using regular process'}`);

      // Define a wrapper function to handle both pty and regular process
      const writeToProcess = (data) => {
        if (ptyProcess) {
          ptyProcess.write(data);
          logger.debug(`Data written to pty process: ${data.toString().replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);
        } else if (sshProcess.stdin && sshProcess.stdin.writable) {
          const result = sshProcess.stdin.write(data);
          logger.debug(`Data written to SSH process stdin: ${data.toString().replace(/\r/g, '\\r').replace(/\n/g, '\\n')}`);
          logger.debug(`Write result: ${result}`);

          // If buffer is full, wait for drain event
          if (!result) {
            logger.warn('SSH process stdin buffer is full, waiting for drain');
            sshProcess.stdin.once('drain', () => {
              logger.debug('SSH process stdin drained, can write more data');
            });
          }
        } else {
          logger.error('Cannot write to SSH process: stdin not available or not writable');
          // Try to send error message to client
          try {
            ws.send(JSON.stringify({
              type: 'data',
              data: '\r\nError: Cannot write to SSH process (stdin not available)\r\n'
            }));
          } catch (wsError) {
            logger.error(`Failed to send error to WebSocket: ${wsError.message}`);
          }
        }
      };

      // Store process for cleanup
      this.activeSessions.set(sessionId, {
        process: sshProcess,
        ws,
        keyPath: sessionData.keyPath,
        certPath: sessionData.certPath
      });

      // No need for test command

      // Set up data handling based on whether we're using pty or regular process
      if (ptyProcess) {
        // Handle pty data (combines stdout and stderr)
        ptyProcess.onData((data) => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            // Convert to string and send as JSON
            const dataStr = data.toString('utf8');
            ws.send(JSON.stringify({
              type: 'data',
              data: dataStr
            }));
            logger.info(`PTY data sent as JSON (${dataStr.length} bytes)`);
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
        // Check if stdout and stderr are available
        if (!sshProcess.stdout) {
          logger.error('SSH process stdout is not available');
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({
              type: 'data',
              data: '\r\nError: SSH process stdout is not available\r\n'
            }));
          }
        }

        if (!sshProcess.stderr) {
          logger.error('SSH process stderr is not available');
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({
              type: 'data',
              data: '\r\nError: SSH process stderr is not available\r\n'
            }));
          }
        }

        // Log initial state
        logger.info(`SSH process initial state: PID=${sshProcess.pid}, killed=${sshProcess.killed}, exitCode=${sshProcess.exitCode}`);

        // Send a direct message to client to confirm handler setup
        if (ws.readyState === 1) {
          try {
            ws.send(JSON.stringify({
              type: 'data',
              data: '\r\nSSH connection established. Terminal ready.\r\n'
            }));
            logger.info('Sent initial connection message to client');
          } catch (msgError) {
            logger.error(`Failed to send initial message: ${msgError.message}`);
          }
        }
        // Handle SSH process stdout
        sshProcess.stdout.on('data', (data) => {
          // Always log stdout data regardless of WebSocket state
          const dataStr = data.toString('utf8');
          logger.info(`SSH stdout data received (${dataStr.length} bytes): ${dataStr.substring(0, 100)}${dataStr.length > 100 ? '...' : ''}`);

          // Log raw buffer data for debugging
          logger.info(`Raw buffer data: ${Buffer.from(data).toString('hex').substring(0, 100)}`);

          if (ws.readyState === 1) { // WebSocket.OPEN
            try {
              // Try direct string send first
              try {
                // Send as JSON only to avoid duplicate output
                const jsonData = JSON.stringify({
                  type: 'data',
                  data: dataStr
                });

                ws.send(jsonData);
                logger.info('Data sent as JSON');
              } catch (directError) {
                logger.error(`Error sending direct data: ${directError.message}`);

                // Fall back to JSON only
                const jsonData = JSON.stringify({
                  type: 'data',
                  data: dataStr
                });

                logger.info(`Sending JSON data to client: ${jsonData.substring(0, 100)}${jsonData.length > 100 ? '...' : ''}`);
                ws.send(jsonData);
                logger.info('JSON data sent successfully');
              }
            } catch (error) {
              logger.error(`Error sending stdout data: ${error.message}`);
              // Last resort - try to send a simple text message
              try {
                ws.send(JSON.stringify({
                  type: 'data',
                  data: 'Output received but could not be displayed. Check server logs.'
                }));
              } catch (finalError) {
                logger.error(`Final error sending data: ${finalError.message}`);
              }
            }
          } else {
            logger.warn(`Cannot send stdout data: WebSocket not open (readyState: ${ws.readyState})`);
          }
        });

        // Handle SSH process stderr
        sshProcess.stderr.on('data', (data) => {
          const stderr = data.toString();
          logger.info(`SSH stderr (${stderr.length} bytes): ${stderr.substring(0, 100)}${stderr.length > 100 ? '...' : ''}`);

          // Send stderr to client as well
          if (ws.readyState === 1) {
            try {
              // Try direct string send first
              try {
                // Send as JSON only to avoid duplicate output
                const jsonData = JSON.stringify({
                  type: 'data',
                  data: stderr
                });

                ws.send(jsonData);
                logger.info('Stderr data sent as JSON');
              } catch (directError) {
                logger.error(`Error sending direct stderr data: ${directError.message}`);

                // Fall back to JSON only
                const jsonData = JSON.stringify({
                  type: 'data',
                  data: stderr
                });

                logger.info(`Sending stderr JSON data to client: ${jsonData.substring(0, 100)}${jsonData.length > 100 ? '...' : ''}`);
                ws.send(jsonData);
                logger.info('Stderr JSON data sent successfully');
              }
            } catch (error) {
              logger.error(`Error sending stderr data: ${error.message}`);
              // Last resort - try to send a simple text message
              try {
                ws.send(JSON.stringify({
                  type: 'data',
                  data: 'Stderr output received but could not be displayed. Check server logs.'
                }));
              } catch (finalError) {
                logger.error(`Final error sending stderr data: ${finalError.message}`);
              }
            }
          } else {
            logger.warn(`Cannot send stderr data: WebSocket not open (readyState: ${ws.readyState})`);
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
            ws.send(JSON.stringify({
              type: 'data',
              data: `\r\nError: ${error.message}\r\n`
            }));
            logger.info('Error message sent to client as JSON');
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
        try {
          // Log raw message data for debugging
          const rawData = data.toString();
          logger.debug(`Raw WebSocket message received (${rawData.length} bytes): ${rawData.substring(0, 100)}${rawData.length > 100 ? '...' : ''}`);

          // First try to parse as JSON
          try {
            const jsonData = JSON.parse(rawData);
            logger.debug(`Parsed message as JSON: ${JSON.stringify(jsonData).substring(0, 100)}`);

            if (jsonData.type === 'ping') {
              // Handle ping message
              logger.debug('Received ping message');
              if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                logger.debug('Sent pong response to client');
              }
              return;
            } else if (jsonData.type === 'input') {
              // Handle input data from client
              const commandStr = jsonData.data.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
              logger.info(`Received command: ${commandStr}`);

              // Check if it's a simple command that we can execute directly
              logger.info(`Checking if command is simple: ${jsonData.data}`);
              if (jsonData.data.includes('\r')) {
                const cmd = jsonData.data.replace('\r', '').trim();
                logger.info(`Extracted command: '${cmd}'`);

                // For simple commands, try executing directly and sending result
                // Exclude interactive commands like nano, vim, etc.
                if (['ls', 'pwd', 'whoami', 'hostname', 'date', 'echo', 'cat', 'ps', 'free', 'df', 'du', 'uname', 'id', 'uptime', 'w', 'who', 'last', 'netstat', 'ifconfig', 'ip'].some(c => cmd.startsWith(c)) &&
                    !['nano', 'vim', 'vi', 'emacs', 'less', 'more', 'top', 'htop', 'tail -f'].some(c => cmd.startsWith(c))) {
                  logger.info(`Detected simple command: ${cmd}`);
                  try {
                    // Still send the command to the SSH process
                    logger.debug(`Writing command to SSH process: ${commandStr}`);
                    writeToProcess(Buffer.from(jsonData.data));
                    logger.debug('Command written to SSH process successfully');

                    // But also execute locally as a fallback
                    const { exec } = require('child_process');
                    logger.info(`Executing command directly as fallback: ${cmd}`);

                    // Log the command and parameters for debugging
                    logger.info(`SSH command: ssh -i ${sessionData.keyPath} -o CertificateFile=${sessionData.certPath} -o StrictHostKeyChecking=no ${sessionData.sshUser}@${sessionData.targetIp} "${cmd}"`);

                    // Execute the command with a timeout
                    exec(`ssh -i ${sessionData.keyPath} -o CertificateFile=${sessionData.certPath} -o StrictHostKeyChecking=no ${sessionData.sshUser}@${sessionData.targetIp} "${cmd}"`,
                      { timeout: 10000 }, (error, stdout, stderr) => {
                        if (error) {
                          logger.error(`Error executing command directly: ${error.message}`);
                          // Send error message to client
                          if (ws.readyState === 1) {
                            try {
                              ws.send(JSON.stringify({
                                type: 'data',
                                data: `Error executing command: ${error.message}\r\n`
                              }));
                              logger.info('Error message sent to client');
                            } catch (sendError) {
                              logger.error(`Error sending error message: ${sendError.message}`);
                            }
                          }
                          return;
                        }

                        if (stdout) {
                          logger.info(`Direct command stdout: ${stdout}`);
                          // Send the result to the client
                          if (ws.readyState === 1) {
                            try {
                              // Send as JSON only to avoid duplicate output
                              ws.send(JSON.stringify({
                                type: 'data',
                                data: stdout + '\r\n'
                              }));
                              logger.info('Direct command result sent to client as JSON');
                            } catch (sendError) {
                              logger.error(`Error sending direct command result: ${sendError.message}`);
                            }
                          }
                        } else {
                          logger.warn('Command executed successfully but returned no stdout');
                          // Send a message to the client indicating no output
                          if (ws.readyState === 1) {
                            try {
                              ws.send(JSON.stringify({
                                type: 'data',
                                data: 'Command executed successfully but returned no output\r\n'
                              }));
                            } catch (sendError) {
                              logger.error(`Error sending no-output message: ${sendError.message}`);
                            }
                          }
                        }

                        if (stderr) {
                          logger.info(`Direct command stderr: ${stderr}`);
                          // Send stderr to client as well
                          if (ws.readyState === 1) {
                            try {
                              // Send as JSON only to avoid duplicate output
                              ws.send(JSON.stringify({
                                type: 'data',
                                data: stderr + '\r\n'
                              }));
                              logger.info('Direct command stderr sent to client as JSON');
                            } catch (sendError) {
                              logger.error(`Error sending direct command stderr: ${sendError.message}`);
                            }
                          }
                        }
                    });
                  } catch (execError) {
                    logger.error(`Error setting up direct command execution: ${execError.message}`);
                    // Send error message to client
                    if (ws.readyState === 1) {
                      try {
                        ws.send(JSON.stringify({
                          type: 'data',
                          data: `Error executing command: ${execError.message}\r\n`
                        }));
                        logger.info('Error message sent to client');
                      } catch (sendError) {
                        logger.error(`Error sending error message: ${sendError.message}`);
                      }
                    }
                  }
                } else {
                  // For complex commands, just send to SSH process
                  logger.debug(`Writing command to SSH process: ${commandStr}`);
                  writeToProcess(Buffer.from(jsonData.data));
                  logger.debug('Command written to SSH process successfully');

                  // For interactive commands, send a message to the client
                  if (['nano', 'vim', 'vi', 'emacs', 'less', 'more', 'top', 'htop'].some(c => cmd.startsWith(c))) {
                    logger.info(`Detected interactive command: ${cmd}`);
                    // Send a message to the client
                    if (ws.readyState === 1) {
                      try {
                        ws.send(JSON.stringify({
                          type: 'data',
                          data: '\r\nInteractive command detected. Some features may not work properly.\r\n'
                        }));
                      } catch (sendError) {
                        logger.error(`Error sending interactive command message: ${sendError.message}`);
                      }
                    }
                  }
                }
              } else {
                // Not a complete command, just forward to SSH process
                logger.debug(`Writing input to SSH process: ${commandStr}`);
                writeToProcess(Buffer.from(jsonData.data));
                logger.debug('Input written to SSH process successfully');
              }
              return;
            }
          } catch (jsonError) {
            // Not JSON, handle as raw data
            logger.debug(`Not valid JSON, handling as raw data: ${jsonError.message}`);
          }

          // Handle as raw data
          if (typeof data === 'string' || data instanceof Buffer) {
            const dataStr = data.toString();
            // Log the command (but not every keystroke)
            if (dataStr.includes('\r')) {
              logger.info(`Received raw command: ${dataStr.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}`);
            } else {
              logger.debug(`Received raw data: ${dataStr.length} bytes`);
            }

            // Write to the SSH process
            logger.debug(`Writing raw data to SSH process: ${dataStr.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}`);
            writeToProcess(data);
            logger.debug('Raw data written to SSH process successfully');
            return;
          }
        } catch (e) {
          logger.error(`Error handling message: ${e.message}`);
          // Try one last time to write the data
          try {
            logger.debug('Attempting last-resort write to process');
            writeToProcess(data);
            logger.debug('Last-resort write successful');
          } catch (writeError) {
            logger.error(`Failed to write to process: ${writeError.message}`);
          }
        }
      });

      // Handle WebSocket close
      ws.on('close', (code, reason) => {
        logger.info(`WebSocket closed with code ${code} and reason: ${reason || 'No reason provided'}`);

        // If this is an abnormal closure (1006), log more details
        if (code === 1006) {
          logger.warn('Abnormal WebSocket closure (1006) - this may indicate network issues');
          logger.warn('Client IP: ' + req.socket.remoteAddress);
          logger.warn('Headers: ' + JSON.stringify(req.headers));
        }

        // Add a small delay before terminating the SSH process
        // This gives the SSH process time to complete authentication
        setTimeout(() => {
          logger.info('Terminating SSH process after WebSocket close');

          // Check if the process is still running
          let isRunning = false;
          try {
            // Sending signal 0 doesn't kill the process but checks if it exists
            process.kill(sshProcess.pid, 0);
            isRunning = true;
          } catch (e) {
            // Process doesn't exist
            isRunning = false;
          }

          // Only try to kill if it's running
          if (isRunning && sshProcess.pid) {
            try {
              // Try SIGTERM first
              process.kill(sshProcess.pid, 'SIGTERM');
              logger.info(`Sent SIGTERM to SSH process ${sshProcess.pid}`);

              // If it's still running after 500ms, try SIGKILL
              setTimeout(() => {
                try {
                  process.kill(sshProcess.pid, 0); // Check if still running
                  logger.warn(`SSH process ${sshProcess.pid} still running after SIGTERM, sending SIGKILL`);
                  process.kill(sshProcess.pid, 'SIGKILL');
                } catch (e) {
                  // Process already terminated
                  logger.info(`SSH process ${sshProcess.pid} already terminated`);
                }
              }, 500);
            } catch (err) {
              logger.error(`Failed to kill SSH process: ${err.message}`);
            }
          } else {
            logger.info(`SSH process ${sshProcess.pid} is not running`);
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
