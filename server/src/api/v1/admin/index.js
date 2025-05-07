// src/api/v1/admin/index.js
const express = require('express');
const providerRoutes = require('./provider.routes');
const vmAssignmentRoutes = require('./vm-assignment.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

router.use('/providers', providerRoutes);
router.use('/vm-assignments', vmAssignmentRoutes);
router.use('/users', userRoutes);

module.exports = router;