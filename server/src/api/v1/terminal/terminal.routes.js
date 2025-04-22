const express = require('express');
const auth = require('../../../middleware/auth.middleware');
const { initiateSession } = require('./terminal.controller');

const router = express.Router();

router.post('/:vmId/session', auth(), initiateSession);

module.exports = router;