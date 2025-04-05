const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const httpStatus = require('http-status');

const config = require('./config');
const { errorHandler, errorConverter } = require('./middleware/error.middleware');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors({ origin: config.cors.origin }));

// Request logging
app.use(morgan('dev'));

// API routes
// app.use(`/api/${config.api.version}`, routes); // Sẽ được bổ sung sau

// API routes
const routes = require('./api');
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(httpStatus.OK).send({ status: 'ok' });
});

// Handle 404
app.use((req, res, next) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  });
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Error handling
app.use(errorHandler);

module.exports = app;