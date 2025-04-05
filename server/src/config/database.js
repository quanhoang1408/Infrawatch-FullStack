const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

// Set mongoose options
mongoose.set('debug', config.env === 'development');

// Create database connection handler
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Export connection handler
module.exports = {
  connectDB,
};