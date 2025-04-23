// src/api/v1/vault/vault.routes.js
const express = require('express');
const vaultController = require('./vault.controller');

const router = express.Router();

// Route to get Vault CA public key
router.get('/ca-key', vaultController.getCAPublicKey);

module.exports = router;
