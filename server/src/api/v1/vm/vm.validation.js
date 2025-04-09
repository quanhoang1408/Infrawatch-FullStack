// src/api/v1/vm/vm.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const getVM = {
  params: Joi.object().keys({
    vmId: Joi.string().custom(objectId).required(),
  }),
};

const syncVMs = {
  query: Joi.object().keys({
    providerId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  getVM,
  syncVMs,
};