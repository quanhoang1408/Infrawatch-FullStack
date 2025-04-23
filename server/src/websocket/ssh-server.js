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
  // Create WebSocket server with more permissive options
  const wss = new WebSocket.Server({
    server,
    path: '/ws-ssh',
    // Allow connections from any origin
    verifyClient: (info, callback) => {
      // Log connection attempt details
      logger.info(`WebSocket connection attempt from ${info.req.socket.remoteAddress}`);
      logger.info(`Origin: ${info.origin || 'No origin provided'}`);
      logger.info(`Headers: ${JSON.stringify(info.req.headers)}`);

      // Accept all connections - we'll authenticate via protocol or message
      callback(true);
    },
    // Handle protocol for session authentication
    handleProtocols: (protocols, request) => {
      try {
        // Convert protocols to array if it's not already
        const protocolArray = Array.isArray(protocols) ? protocols :
                             (protocols instanceof Set) ? Array.from(protocols) :
                             (typeof protocols === 'string') ? [protocols] : [];

        logger.info(`WebSocket protocols received: ${JSON.stringify(protocolArray)}`);

        if (!protocolArray.length) {
          logger.warn('No protocols provided in WebSocket request');
          // Accept the connection anyway - we'll authenticate via message
          return true;
        }

        // Look for sessionId protocol
        for (const protocol of protocolArray) {
          if (typeof protocol === 'string' && protocol.startsWith('sessionId.')) {
            logger.info(`Found valid session protocol: ${protocol}`);
            return protocol;
          }
        }

        // If no valid protocol found, accept the connection anyway
        // We'll handle authentication via message
        logger.warn('No valid session protocol found, accepting connection for message-based auth');
        return true; // Accept the connection without a specific protocol
      } catch (error) {
        logger.error(`Error handling protocols: ${error.message}`);
        // Accept the connection anyway in case of error
        return true;
      }
    }
  });

  logger.info('WebSocket server for SSH initialized');

  wss.on('connection', (ws, req) => {
    try {
      // Log connection details
      logger.info(`New WebSocket connection from ${req.socket.remoteAddress}`);
      logger.info(`Headers: ${JSON.stringify({
        origin: req.headers.origin,
        host: req.headers.host,
        protocol: req.headers['sec-websocket-protocol']
      })}`);

      // Extract session ID from multiple sources
      let sessionId;

      // Try to get session ID from protocol
      try {
        const protocol = ws.protocol;
        logger.debug(`WebSocket protocol: ${typeof protocol} ${protocol}`);

        if (protocol && typeof protocol === 'string' && protocol.startsWith('sessionId.')) {
          sessionId = protocol.split('.')[1];
          logger.info(`Extracted session ID from protocol: ${sessionId}`);
        }
      } catch (error) {
        logger.error(`Error extracting session ID from protocol: ${error.message}`);
      }

      // If not found, try from header
      if (!sessionId) {
        const protocols = req.headers['sec-websocket-protocol'];
        if (protocols) {
          const sessionProtocol = protocols.split(',')
            .map(p => p.trim())
            .find(p => p.startsWith('sessionId.'));

          if (sessionProtocol) {
            sessionId = sessionProtocol.split('.')[1];
            logger.info(`Extracted session ID from header: ${sessionId}`);
          }
        }
      }

      // If still not found, try from URL query parameters
      if (!sessionId) {
        try {
          logger.debug(`Request URL: ${req.url}`);

          // Parse URL and query parameters manually to avoid URL parsing issues
          const urlParts = req.url.split('?');
          if (urlParts.length > 1) {
            const queryParams = new URLSearchParams(urlParts[1]);
            sessionId = queryParams.get('sessionId');
            if (sessionId) {
              logger.info(`Extracted session ID from URL query parameter: ${sessionId}`);
            }
          }
        } catch (error) {
          logger.error(`Error extracting session ID from URL: ${error.message}`);
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
        }, 15000); // Increased timeout to 15 seconds
      } else {
        logger.info(`WebSocket connection established for session ${sessionId}`);
        sshService.handleWebSocketConnection(ws, sessionId, req);
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

      // Handle WebSocket messages for ping/pong and authentication
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
          // Handle auth messages (for connections without protocol)
          else if (message.type === 'auth' && message.sessionId) {
            if (!sessionId) {
              // Set the session ID from the auth message
              sessionId = message.sessionId;
              logger.info(`WebSocket authenticated via message for session ${sessionId}`);

              // Handle the connection with the session ID
              sshService.handleWebSocketConnection(ws, sessionId, req);
            } else {
              logger.info(`Received duplicate auth message for session ${sessionId}, ignoring`);
            }
          }
          // Handle other message types
          else if (message.type) {
            logger.debug(`Received message of type ${message.type}${sessionId ? ` for session ${sessionId}` : ''}`);
          }
        } catch (e) {
          // Not JSON or other error, ignore (probably binary data for SSH)
          // Only log if it's not binary data (which would cause parse errors)
          if (data.length < 10) { // Small messages are likely not binary data
            logger.debug(`Received non-JSON message: ${data.toString().substring(0, 20)}...`);
          }
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