// src/api/v1/agent/agent.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const getCommands = {
  params: Joi.object().keys({
    vmId: Joi.string().custom(objectId).required(),
  }),
};

const updateCommandResult = {
  params: Joi.object().keys({
    vmId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    commandId: Joi.string().custom(objectId).required(),
    status: Joi.string().valid('SUCCESS', 'ERROR').required(),
    message: Joi.string().required(),
    data: Joi.object().optional(),
  }),
};

module.exports = {
  getCommands,
  updateCommandResult,
};
