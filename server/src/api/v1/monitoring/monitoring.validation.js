// src/api/v1/monitoring/monitoring.validation.js
const Joi = require('joi');
const { objectId } = require('../../../utils/validation');

const sendMonitoringData = {
  params: Joi.object().keys({
    vmId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    timestamp: Joi.date().iso().default(() => new Date()),
    cpu: Joi.object().keys({
      usagePercent: Joi.number().min(0).max(100).required(),
    }).required(),
    memory: Joi.object().keys({
      totalMB: Joi.number().min(0).required(),
      usedMB: Joi.number().min(0).required(),
      usagePercent: Joi.number().min(0).max(100).required(),
    }).required(),
    disk: Joi.array().items(
      Joi.object().keys({
        path: Joi.string().required(),
        totalGB: Joi.number().min(0).required(),
        usedGB: Joi.number().min(0).required(),
        usagePercent: Joi.number().min(0).max(100).required(),
      })
    ).min(1).required(),
    network: Joi.object().keys({
      bytesSent: Joi.number().min(0).required(),
      bytesRecv: Joi.number().min(0).required(),
    }).required(),
  }),
};

const getMonitoring = {
  params: Joi.object().keys({
    vmId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    limit: Joi.number().integer().min(1).max(1000),
  }),
};

const queryMonitoring = {
  params: Joi.object().keys({
    vmId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    startTime: Joi.date().iso(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')),
    granularity: Joi.string().valid('raw', '1m', '5m', '15m', '1h', '1d').default('raw'),
  }),
};

const heartbeat = {
  params: Joi.object().keys({
    vmId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  sendMonitoringData,
  getMonitoring,
  queryMonitoring,
  heartbeat,
};