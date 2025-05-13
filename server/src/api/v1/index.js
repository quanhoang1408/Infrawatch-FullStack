// src/api/v1/index.js
const express = require('express');
const authRoutes = require('./auth/auth.routes');
const vmRoutes = require('./vm/vm.routes');
const adminRoutes = require('./admin');
const activityRoutes = require('./activities/activity.routes');
const monitoringRoute = require('./monitoring/monitoring.routes');
const eventsRoutes = require('./events/events.routes');
const agentRoutes = require('./agent/agent.routes');
const terminalRoutes = require('./terminal/terminal.routes');
const vaultRoutes = require('./vault/vault.routes');
const userRoutes = require('./users/user.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vm', vmRoutes);
router.use('/admin', adminRoutes);
router.use('/activities', activityRoutes);
router.use('/monitoring', monitoringRoute);
router.use('/events', eventsRoutes);
router.use('/agent', agentRoutes);
router.use('/terminal', terminalRoutes);
router.use('/vault', vaultRoutes);
router.use('/users', userRoutes);

module.exports = router;