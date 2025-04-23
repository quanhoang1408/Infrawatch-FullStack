// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const routes = require('./api');
const config = require('./config');
const { errorConverter, errorHandler }= require('./middleware/error.middleware');
const vault = require('./middleware/vault.middleware');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Compress response
app.use(compression());

// Enable CORS with specific options
app.use(cors({
  // Allow specific origins including localhost:3000 for development
  origin: [
    'https://api.infrawatch.website',
    'http://localhost:8000',
    'http://localhost:3000',
    'https://localhost:3000',
    'https://localhost:8000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Token', 'Sec-WebSocket-Protocol'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Http request logger
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.status(200).send({ status: 'ok' }));

// Vault test endpoint
app.get('/test-vault', async (req, res) => {
  try {
    await vault.write('secret/test', { foo: 'bar' });
    const result = await vault.read('secret/test');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling
app.use(errorHandler);

module.exports = app;
