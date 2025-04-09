// src/utils/validation.js
const mongoose = require('mongoose');

/**
 * Custom validation for MongoDB ObjectId
 * @param {string} value - Value to validate
 * @param {Object} helpers - Joi helpers
 * @returns {string|Object} Value or error
 */
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

module.exports = {
  objectId,
};