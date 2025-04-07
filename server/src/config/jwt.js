// src/config/jwt.js
module.exports = {
    secret: process.env.JWT_SECRET || 'hmq1408',
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 30,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || 30,
  };