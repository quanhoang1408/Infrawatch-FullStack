const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');

// IIFE để sử dụng async/await
(async () => {
  try {
    // Kết nối tới MongoDB
    await connectDB();
    
    // Khởi động server
    const server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port} (${config.env})`);
    });

    // Xử lý lỗi không mong đợi
    const unexpectedErrorHandler = (error) => {
      logger.error(error);
      if (server) {
        server.close(() => {
          logger.info('Server closed');
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    // Xử lý shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      if (server) {
        server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();