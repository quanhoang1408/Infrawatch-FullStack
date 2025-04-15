const { VM } = require('../models');
const { AGENT_TIMEOUT_SECONDS = 90 } = process.env;

/**
 * Mark agents as disconnected if they haven't sent a heartbeat recently
 */
const checkStaleAgents = async () => {
  const staleThreshold = new Date();
  staleThreshold.setSeconds(staleThreshold.getSeconds() - AGENT_TIMEOUT_SECONDS);

  console.log(`[Job] Checking for agents not seen since: ${staleThreshold.toISOString()}`);

  const result = await VM.updateMany(
    {
      agentConnected: true,
      lastSeenAt: { $lt: staleThreshold }
    },
    {
      $set: { agentConnected: false }
    }
  );

  console.log(`[Job] Updated ${result.modifiedCount} stale agents`);
};

module.exports = {
  checkStaleAgents
};
