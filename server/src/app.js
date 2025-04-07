// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const routes = require('./api');
const config = require('./config');
const { errorConverter, errorHandler }= require('./middleware/error.middleware');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Compress response
app.use(compression());

// Enable CORS
app.use(cors());

// Http request logger
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.status(200).send({ status: 'ok' }));

// Error handling
app.use(errorHandler);

module.exports = app;