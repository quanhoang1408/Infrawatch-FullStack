const httpStatus = require('http-status');
const { ApiError } = require('../utils/errors');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Convert error to ApiError if needed
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

/**
 * Error handler
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  // Ensure statusCode is a valid number
  if (statusCode === undefined || isNaN(statusCode)) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    logger.error('Invalid status code, using 500 instead');
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};