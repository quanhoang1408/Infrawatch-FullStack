// src/api/v1/vm/vm.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const rbac = require('../../../middleware/rbac.middleware');
const vmController = require('./vm.controller');
const vmValidation = require('./vm.validation');

const router = express.Router();

router
  .route('/')  // This becomes /vms because of how it's mounted
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

router
  .route('/:vmId/start')
  .post(
    auth(),
    validate(vmValidation.vmAction),
    vmController.startVM
  );

router
  .route('/:vmId/stop')
  .post(
    auth(),
    validate(vmValidation.vmAction),
    vmController.stopVM
  );

router
  .route('/:vmId/reboot')
  .post(
    auth(),
    validate(vmValidation.vmAction),
    vmController.rebootVM
  );

router
  .route('/:vmId/ssh-key/update')
  .post(
    auth(),
    rbac(['admin']),
    validate(vmValidation.updateSSHKey),
    vmController.updateSSHKey
  );

module.exports = router;
