// src/api/v1/users/user.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const userController = require('./user.controller');
const userValidation = require('./user.validation');

const router = express.Router();

router
  .route('/profile')
  .get(
    auth(),
    userController.getProfile
  )
  .patch(
    auth(),
    validate(userValidation.updateProfile),
    userController.updateProfile
  );

module.exports = router;
