/**
 * Class representing an API error
 * @extends Error
 */
class ApiError extends Error {
    /**
     * Creates an API error
     * @param {number} statusCode - HTTP status code of the error
     * @param {string} message - Error message
     * @param {boolean} isOperational - Whether this is an operational error
     * @param {string} stack - Error stack trace
     */
    constructor(statusCode, message, isOperational = true, stack = '') {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  module.exports = ApiError;