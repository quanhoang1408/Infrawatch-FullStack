// src/models/index.js
const User = require('./user.model');
const VM = require('./vm.model');
const Token = require('./token.model');
const Monitoring = require('./monitoring.model');
const Activity = require('./activity.model');
const Provider = require('./provider.model');
// Import additional models as needed

module.exports = {
  User,
  VM,
  Token,
  Monitoring,
  Activity,
  Provider,
};