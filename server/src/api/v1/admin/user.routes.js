// src/api/v1/admin/user.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const rbac = require('../../../middleware/rbac.middleware');
const userController = require('./user.controller');
const userValidation = require('./user.validation');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    auth(),
    rbac(['admin', 'superadmin']),
    userController.getUsers
  );

router
  .route('/:userId')
  .get(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(userValidation.getUser),
    userController.getUser
  )
  .patch(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    auth(),
    rbac(['admin', 'superadmin']),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

module.exports = router;
