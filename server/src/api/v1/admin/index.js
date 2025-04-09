// src/api/v1/admin/index.js
const express = require('express');
const providerRoutes = require('./provider.routes');

const router = express.Router();

router.use('/providers', providerRoutes);

module.exports = router;