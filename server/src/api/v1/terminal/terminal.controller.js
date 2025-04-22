const asyncHandler = require('express-async-handler');
const sshSessionService = require('../../../services/ssh-session.service');
const logger = require('../../../utils/logger');

const initiateSession = asyncHandler(async (req, res) => {
  const { vmId } = req.params;
  const { sshUser = 'ubuntu' } = req.body;

  if (!vmId) {
    res.status(400);
    throw new Error('VM ID is required');
  }

  logger.info(`Initiating terminal session for VM ${vmId} with user ${sshUser}`);

  try {
    const sessionInfo = await sshSessionService.initiateSession(vmId, sshUser);
    res.json(sessionInfo);
  } catch (error) {
    logger.error(`Error initiating terminal session for VM ${vmId}:`, error);
    res.status(500);
    throw new Error(error.message || 'Failed to initiate terminal session');
  }
});

module.exports = {
  initiateSession
};