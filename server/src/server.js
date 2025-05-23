// src/server.js
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
const { initJobs } = require('./jobs');
const { initializeVault } = require('./middleware/vault.middleware');
const setupWSServer = require('./websocket/ssh-server');
const logger = require('./utils/logger');

let server;

mongoose.connect(config.mongodb.url, config.mongodb.options).then(() => {
  console.log('Connected to MongoDB');

  // Initialize jobs
  initJobs();

  // Initialize Vault
  try {
    initializeVault();
  } catch (error) {
    logger.error('Failed to initialize Vault:', error);
  }

  server = app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);

    // Setup WebSocket server for SSH
    setupWSServer(server);
    console.log('WebSocket server for SSH initialized');
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error('Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});
