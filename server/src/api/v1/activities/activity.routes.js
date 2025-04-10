// src/api/v1/activities/activity.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const activityController = require('./activity.controller');
const activityValidation = require('./activity.validation');

const router = express.Router();

router
  .route('/me')
  .get(
    auth(),
    validate(activityValidation.getUserActivities),
    activityController.getUserActivities
  );

router
  .route('/:resourceType/:resourceId')
  .get(
    auth(),
    validate(activityValidation.getResourceActivities),
    activityController.getResourceActivities
  );

module.exports = router;