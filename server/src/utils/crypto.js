// src/utils/crypto.js
const crypto = require('crypto');
const config = require('../config');

const algorithm = 'aes-256-cbc';
// These should be loaded from environment variables through config
const secretKey = config.encryption.key; 
const iv = config.encryption.iv;

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Text to decrypt
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};