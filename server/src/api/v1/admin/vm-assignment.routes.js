// src/api/v1/admin/vm-assignment.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const rbac = require('../../../middleware/rbac.middleware');
const vmAssignmentController = require('./vm-assignment.controller');
const vmAssignmentValidation = require('./vm-assignment.validation');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(vmAssignmentValidation.assignVM),
    vmAssignmentController.assignVM
  )
  .get(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(vmAssignmentValidation.getAssignments),
    vmAssignmentController.getAssignments
  );

router
  .route('/unassign')
  .post(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(vmAssignmentValidation.unassignVM),
    vmAssignmentController.unassignVM
  );

router
  .route('/user/:userId')
  .get(
    auth(),
    rbac(['admin', 'superadmin']),
    vmAssignmentController.getVMsAssignedToUser
  );

router
  .route('/vm/:vmId')
  .get(
    auth(),
    rbac(['admin', 'superadmin']),
    vmAssignmentController.getUsersAssignedToVM
  );

module.exports = router;
