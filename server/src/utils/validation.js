// src/utils/validation.js
const mongoose = require('mongoose');

/**
 * Custom validation for MongoDB ObjectId
 * @param {string} value - Value to check
 * @param {Object} helpers - Joi helpers
 * @returns {string|Object} - Valid value or error
 */
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('{{#label}} must be a valid MongoDB ObjectId');
  }
  return value;
};

/**
 * Custom validation for password
 * @param {string} value - Value to check
 * @param {Object} helpers - Joi helpers
 * @returns {string|Object} - Valid value or error
 */
const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

module.exports = {
  objectId,
  password,
};