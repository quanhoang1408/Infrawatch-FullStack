// src/api/v1/index.js
const express = require('express');
const authRoutes = require('./auth/auth.routes');
const vmRoutes = require('./vm/vm.routes');
const adminRoutes = require('./admin');
const activityRoutes = require('./activities/activity.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vm', vmRoutes);
router.use('/admin', adminRoutes);
router.use('/activities', activityRoutes);

module.exports = router;