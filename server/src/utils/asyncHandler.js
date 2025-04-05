/**
 * Wrapper to handle async errors in Express routes
 * @param {Function} fn - Async function to execute
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
  
module.exports = asyncHandler;