const dotenv = require('dotenv');
const path = require('path');
const Joi = require('joi');

dotenv.config({
  path: path.join(__dirname, '../../../.env'),
});

// Validate environment variables
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    API_VERSION: Joi.string().required(),
    MONGODB_URI: Joi.string().required().description('MongoDB URI'),
    MONGODB_USER: Joi.string().description('MongoDB user'),
    MONGODB_PASSWORD: Joi.string().description('MongoDB password'),
    MONGODB_DATABASE: Joi.string().required().description('MongoDB database name'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('JWT access token expiration in minutes'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('JWT refresh token expiration in days'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    CORS_ORIGIN: Joi.string().default('*'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX: Joi.number().default(100),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration
module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  api: {
    version: envVars.API_VERSION,
  },
  mongodb: {
    uri: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  logs: {
    level: envVars.LOG_LEVEL,
  },
  cors: {
    origin: envVars.CORS_ORIGIN,
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX,
  },
};