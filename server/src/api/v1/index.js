// src/api/v1/index.js
const express = require('express');
const authRoutes = require('./auth/auth.routes');
const vmRoutes = require('./vm/vm.routes');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vm', vmRoutes);
router.use('/admin', adminRoutes);

module.exports = router;