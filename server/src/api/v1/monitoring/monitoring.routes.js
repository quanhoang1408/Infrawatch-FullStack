// src/api/v1/monitoring/monitoring.routes.js
const express = require('express');
const { agentAuth } = require('../../../middleware/agent.middleware');
const auth = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validator.middleware');
const monitoringValidation = require('./monitoring.validation');
const monitoringController = require('./monitoring.controller');

const router = express.Router();

// Routes for agent to send data
router
  .route('/:vmId')
  .post(
    validate(monitoringValidation.sendMonitoringData),
    agentAuth,
    monitoringController.sendMonitoringData
  );

// Routes for user/admin to get monitoring data
router
  .route('/:vmId/data')
  .get(
    validate(monitoringValidation.getMonitoring),
    auth(),
    monitoringController.getMonitoringData
  );

// Route for agent heartbeat
router
  .route('/:vmId/heartbeat')
  .post(
    validate(monitoringValidation.heartbeat),
    agentAuth,
    monitoringController.heartbeat
  );

module.exports = router;