const express = require('express');
const v1Routes = require('./v1');

const router = express.Router();

// Route cho API version 1
router.use('/v1', v1Routes);

module.exports = router;