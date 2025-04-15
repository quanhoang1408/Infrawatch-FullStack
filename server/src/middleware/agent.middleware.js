// src/middleware/agent.middleware.js
const VM = require('../models/vm.model');
const { ApiError } = require('../utils/errors');

/**
 * Middleware to authenticate agent token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const agentAuth = async (req, res, next) => {
  try {
    // Get token from header
    const agentToken = req.header('X-Agent-Token');
    if (!agentToken) {
      throw new ApiError(401, 'Agent token is required');
    }

    // Get vmId from params
    const { vmId } = req.params;
    if (!vmId) {
      throw new ApiError(400, 'VM ID is required');
    }

    // Find VM by ID and verify token
    const vm = await VM.findById(vmId);
    if (!vm) {
      throw new ApiError(404, 'VM not found');
    }

    // Authenticate token
    if (vm.agentToken !== agentToken) {
      throw new ApiError(401, 'Invalid agent token');
    }

    // Attach VM to request for use in controller
    req.vm = vm;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  agentAuth,
};