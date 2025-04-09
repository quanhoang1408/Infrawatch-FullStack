// src/api/v1/admin/provider.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const createProvider = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    type: Joi.string().valid('aws', 'azure', 'gcp', 'vmware').required(),
    credentials: Joi.object().required().when('type', {
      is: 'aws',
      then: Joi.object().keys({
        accessKeyId: Joi.string().required(),
        secretAccessKey: Joi.string().required(),
        region: Joi.string().required(),
      }),
      otherwise: Joi.object(),
    }),
    status: Joi.string().valid('active', 'inactive'),
  }),
};

const getProvider = {
  params: Joi.object().keys({
    providerId: Joi.string().custom(objectId).required(),
  }),
};

const updateProvider = {
  params: Joi.object().keys({
    providerId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      credentials: Joi.object(),
      status: Joi.string().valid('active', 'inactive'),
    })
    .min(1),
};

const deleteProvider = {
  params: Joi.object().keys({
    providerId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createProvider,
  getProvider,
  updateProvider,
  deleteProvider,
};