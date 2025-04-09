// src/api/v1/vm/vm.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const vmController = require('./vm.controller');
const vmValidation = require('./vm.validation');

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    vmController.getVMs
  );

router
  .route('/sync')
  .post(
    auth(),
    validate(vmValidation.syncVMs),
    vmController.syncVMs
  );

router
  .route('/:vmId')
  .get(
    auth(),
    validate(vmValidation.getVM),
    vmController.getVM
  );

module.exports = router;