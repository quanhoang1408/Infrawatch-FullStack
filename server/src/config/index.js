// src/config/index.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  logs: {
    level: process.env.LOG_LEVEL || 'info',
  },
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/infrawatch',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'infrawatch-secret',
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '30'),
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7'),
  },
};