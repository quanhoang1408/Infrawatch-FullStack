// src/api/v1/events/events.routes.js
const express = require('express');
const auth = require('../../../middleware/auth.middleware');
const rbac = require('../../../middleware/rbac.middleware');
const eventsController = require('./events.controller');

const router = express.Router();

router
  .route('/subscribe')
  .get(auth(), eventsController.subscribeToEvents);

router
  .route('/stats')
  .get(
    auth(),
    rbac(['admin']),
    eventsController.getSSEStats
  );

module.exports = router;
