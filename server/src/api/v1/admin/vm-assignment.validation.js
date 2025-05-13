// src/api/v1/admin/vm-assignment.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const assignVM = {
  body: Joi.object().keys({
    vmId: Joi.string().custom(objectId).required(),
    userId: Joi.string().custom(objectId).required(),
  }),
};

const unassignVM = {
  body: Joi.object().keys({
    vmId: Joi.string().custom(objectId).required(),
    userId: Joi.string().custom(objectId).required(),
  }),
};

const getAssignments = {
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    vmId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  assignVM,
  unassignVM,
  getAssignments,
};
