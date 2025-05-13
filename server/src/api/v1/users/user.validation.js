// src/api/v1/users/user.validation.js
const Joi = require('joi');

const updateProfile = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

module.exports = {
  updateProfile,
};
