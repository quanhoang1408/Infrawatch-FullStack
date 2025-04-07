const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('../api');
const config = require('./index');
const { errorConverter, errorHandler } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

/**
 * Express instance
 * @public
 */
const app = express();

// Logger for HTTP requests
if (config.env !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Infrawatch server is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// If error is not an instanceOf APIError, convert it.
app.use(errorConverter);

// Error handler middleware
app.use(errorHandler);

module.exports = app;