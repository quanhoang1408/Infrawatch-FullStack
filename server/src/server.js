const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const connectDB = require('./config/database');

let server;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message, err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Process terminated!');
      process.exit(0);
    });
  }
});