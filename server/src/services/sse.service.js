const logger = require('../utils/logger');

class SSEService {
  constructor() {
    this.clients = new Map(); // userId -> Set of response objects
  }

  /**
   * Add a new SSE client connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  addClient(userId, res) {
    try {
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable Nginx buffering
      });

      // Initialize set if doesn't exist
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }

      // Add this connection to user's set
      this.clients.get(userId).add(res);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(': ping\n\n');
      }, 30000); // Send ping every 30 seconds

      // Cleanup on connection close
      res.on('close', () => {
        clearInterval(keepAlive);
        this.removeClient(userId, res);
        logger.debug(`SSE connection closed for user ${userId}`);
      });

      logger.debug(`New SSE connection established for user ${userId}`);
    } catch (error) {
      logger.error(`Error establishing SSE connection for user ${userId}:`, error);
      res.end();
    }
  }

  /**
   * Remove a client connection
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  removeClient(userId, res) {
    try {
      const userConnections = this.clients.get(userId);
      if (userConnections) {
        userConnections.delete(res);
        // Remove user entry if no more connections
        if (userConnections.size === 0) {
          this.clients.delete(userId);
        }
      }
    } catch (error) {
      logger.error(`Error removing SSE client for user ${userId}:`, error);
    }
  }

  /**
   * Send event to specific user (all connections)
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  sendEventToUser(userId, event, data) {
    try {
      const userConnections = this.clients.get(userId);
      if (userConnections) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        userConnections.forEach(client => {
          try {
            client.write(payload);
          } catch (error) {
            logger.error(`Error sending event to client:`, error);
            this.removeClient(userId, client);
          }
        });
        logger.debug(`Event ${event} sent to user ${userId}`);
      }
    } catch (error) {
      logger.error(`Error sending event to user ${userId}:`, error);
    }
  }

  /**
   * Broadcast event to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcastEvent(event, data) {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      this.clients.forEach((connections, userId) => {
        connections.forEach(client => {
          try {
            client.write(payload);
          } catch (error) {
            logger.error(`Error broadcasting to client:`, error);
            this.removeClient(userId, client);
          }
        });
      });
      logger.debug(`Event ${event} broadcasted to all users`);
    } catch (error) {
      logger.error(`Error broadcasting event:`, error);
    }
  }

  /**
   * Get number of connected clients for a user
   * @param {string} userId - User ID
   * @returns {number} Number of connections
   */
  getConnectionCount(userId) {
    return this.clients.get(userId)?.size || 0;
  }

  /**
   * Get total number of connected clients
   * @returns {number} Total number of connections
   */
  getTotalConnections() {
    let total = 0;
    this.clients.forEach(connections => {
      total += connections.size;
    });
    return total;
  }
}

// Export singleton instance
module.exports = new SSEService();
