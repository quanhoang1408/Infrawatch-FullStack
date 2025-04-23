const WebSocket = require('ws');
const sshSessionService = require('../services/ssh-session.service');
const openSSHSessionService = require('../services/openssh-session.service');
const logger = require('../utils/logger');

// Use OpenSSH service instead of SSH2 library
const useOpenSSH = process.env.USE_OPENSSH === 'true';
const sshService = useOpenSSH ? openSSHSessionService : sshSessionService;

if (useOpenSSH) {
  logger.info('Using OpenSSH for SSH connections');
} else {
  logger.info('Using SSH2 library for SSH connections');
}

function setupWSServer(server) {
  const wss = new WebSocket.Server({
    server,
    path: '/ws-ssh',
    // Handle protocol for session authentication
    handleProtocols: (protocols) => {
      if (!protocols || !protocols.length) {
        return false;
      }

      // Look for sessionId protocol
      for (const protocol of protocols) {
        if (protocol.startsWith('sessionId.')) {
          return protocol;
        }
      }

      return false;
    }
  });

  logger.info('WebSocket server for SSH initialized');

  wss.on('connection', (ws, req) => {
    try {
      // Extract session ID from protocol
      const protocol = ws.protocol;
      let sessionId;

      if (protocol && protocol.startsWith('sessionId.')) {
        sessionId = protocol.split('.')[1];
      }

      if (!sessionId) {
        // Fallback to header if protocol not available
        const protocols = req.headers['sec-websocket-protocol'];
        if (protocols) {
          const sessionProtocol = protocols.split(',')
            .map(p => p.trim())
            .find(p => p.startsWith('sessionId.'));

          if (sessionProtocol) {
            sessionId = sessionProtocol.split('.')[1];
          }
        }
      }

      if (!sessionId) {
        // Wait for auth message if no protocol
        logger.warn('WebSocket connection without session ID in protocol');
        ws.once('message', (data) => {
          try {
            const message = JSON.parse(data);
            if (message.type === 'auth' && message.sessionId) {
              sessionId = message.sessionId;
              logger.info(`WebSocket connection authenticated for session ${sessionId}`);
              sshService.handleWebSocketConnection(ws, sessionId);
            } else {
              logger.warn('Invalid authentication message');
              ws.close(4001, 'Authentication required');
            }
          } catch (error) {
            logger.error('Error parsing authentication message:', error);
            ws.close(4000, 'Invalid message format');
          }
        });

        // Close connection if no auth received
        setTimeout(() => {
          if (!sessionId) {
            logger.warn('Authentication timeout');
            ws.close(4000, 'Authentication timeout');
          }
        }, 5000);
      } else {
        logger.info(`WebSocket connection established for session ${sessionId}`);
        sshService.handleWebSocketConnection(ws, sessionId);
      }

      // Handle WebSocket close
      ws.on('close', (code, reason) => {
        if (sessionId) {
          logger.info(`WebSocket connection closed for session ${sessionId}: ${code} ${reason || 'No reason'}`);
          sshService.terminateSession(sessionId);
        }
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error${sessionId ? ` for session ${sessionId}` : ''}:`, error);
      });

      // Handle WebSocket messages for ping/pong
      ws.on('message', (data) => {
        try {
          // Try to parse as JSON
          const message = JSON.parse(data.toString());

          // Handle ping messages
          if (message.type === 'ping') {
            logger.debug(`Received ping from client${sessionId ? ` (session ${sessionId})` : ''}`);
            // Send pong response
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              logger.debug(`Sent pong to client${sessionId ? ` (session ${sessionId})` : ''}`);
            }
          }
        } catch (e) {
          // Not JSON or other error, ignore (probably binary data for SSH)
        }
      });
    } catch (error) {
      logger.error('Error handling WebSocket connection:', error);
      ws.close(4000, 'Internal server error');
    }
  });

  return wss;
}

module.exports = setupWSServer;