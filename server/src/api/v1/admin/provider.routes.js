// src/api/v1/admin/provider.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const rbac = require('../../../middleware/rbac.middleware');
const providerController = require('./provider.controller');
const providerValidation = require('./provider.validation');

const router = express.Router();

router
  .route('/')
  .post(
    auth(['admin']),
    validate(providerValidation.createProvider),
    providerController.createProvider
  )
  .get(
    auth(['admin']),
    providerController.getProviders
  );

router
  .route('/:providerId')
  .get(
    auth(['admin']),
    validate(providerValidation.getProvider),
    providerController.getProvider
  )
  .patch(
    auth(['admin']),
    validate(providerValidation.updateProvider),
    providerController.updateProvider
  )
  .delete(
    auth(['admin']),
    validate(providerValidation.deleteProvider),
    providerController.deleteProvider
  );

module.exports = router;