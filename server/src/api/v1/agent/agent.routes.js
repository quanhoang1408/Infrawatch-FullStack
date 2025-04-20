// src/api/v1/agent/agent.routes.js
const express = require('express');
const { agentAuth } = require('../../../middleware/agent.middleware');
const validate = require('../../../middleware/validator.middleware');
const agentController = require('./agent.controller');
const agentValidation = require('./agent.validation');

const router = express.Router();

// Route for agent to get pending commands
router
  .route('/:vmId/commands')
  .get(
    validate(agentValidation.getCommands),
    agentAuth,
    agentController.getCommands
  );

// Route for agent to update command result
router
  .route('/:vmId/command_result')
  .post(
    validate(agentValidation.updateCommandResult),
    agentAuth,
    agentController.updateCommandResult
  );

module.exports = router;
