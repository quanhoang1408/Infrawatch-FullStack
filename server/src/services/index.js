// src/services/index.js
const authService = require('./auth.service');
const vmService = require('./vm.service');
const providerService = require('./provider.service');
const activityService = require('./activity.service');
const monitoringService = require('./monitoring.service');
const agentService = require('./agent.service');
// Import additional services as needed

module.exports = {
  auth: authService,
  vm: vmService,
  provider: providerService,
  activity: activityService,
  monitoring: monitoringService,
  agent: agentService,
};
