const httpStatus = require('http-status');
const sseService = require('../../../services/sse.service');
const logger = require('../../../utils/logger');
const { ApiError } = require('../../../utils/errors');

/**
 * Subscribe to SSE events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const subscribeToEvents = (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    const userId = req.user._id.toString();
    
    // Optional: Check if user has too many connections
    const currentConnections = sseService.getConnectionCount(userId);
    if (currentConnections >= 5) { // Limit to 5 connections per user
      throw new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many connections');
    }

    // Set timeout for the connection
    req.setTimeout(0); // Disable timeout

    sseService.addClient(userId, res);

    // Send initial connection success event
    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    logger.info(`SSE subscription established for user ${userId}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get SSE stats (admin only)
 */
const getSSEStats = (req, res) => {
  const stats = {
    totalConnections: sseService.getTotalConnections(),
    activeUsers: sseService.clients.size,
  };
  res.json(stats);
};

module.exports = {
  subscribeToEvents,
  getSSEStats
};
