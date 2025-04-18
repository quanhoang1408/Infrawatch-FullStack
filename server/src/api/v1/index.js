// src/api/v1/index.js
const express = require('express');
const authRoutes = require('./auth/auth.routes');
const vmRoutes = require('./vm/vm.routes');
const adminRoutes = require('./admin');
const activityRoutes = require('./activities/activity.routes');
const monitoringRoute = require('./monitoring/monitoring.routes');
const eventsRoutes = require('./events/events.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vm', vmRoutes);
router.use('/admin', adminRoutes);
router.use('/activities', activityRoutes);
router.use('/monitoring', monitoringRoute);
router.use('/events', eventsRoutes);

module.exports = router;