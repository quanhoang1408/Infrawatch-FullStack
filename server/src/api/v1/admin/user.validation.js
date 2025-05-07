// src/api/v1/admin/user.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('user', 'admin', 'superadmin').default('user'),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().min(8),
    name: Joi.string(),
    role: Joi.string().valid('user', 'admin', 'superadmin'),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
  }).min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
};
