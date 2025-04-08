// src/api/v1/auth/auth.routes.js
const express = require('express');
const validate = require('../../../middleware/validator.middleware');
const auth = require('../../../middleware/auth.middleware');
const authValidation = require('./auth.validation');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-tokens', validate(authValidation.refreshToken), authController.refreshTokens);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.get('/me', auth(), authController.getMe);

module.exports = router;