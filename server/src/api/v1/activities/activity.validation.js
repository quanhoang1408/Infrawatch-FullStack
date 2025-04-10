// src/api/v1/activities/activity.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const getResourceActivities = {
  params: Joi.object().keys({
    resourceType: Joi.string().valid('vm', 'provider', 'user').required(),
    resourceId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(0),
  }),
};

const getUserActivities = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(0),
  }),
};

module.exports = {
  getResourceActivities,
  getUserActivities,
};