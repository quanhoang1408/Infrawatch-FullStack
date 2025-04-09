// src/models/provider.model.js
const mongoose = require('mongoose');
const crypto = require('../utils/crypto');

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['aws', 'azure', 'gcp', 'vmware'],
      required: true,
    },
    credentials: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastSyncAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt credentials before saving
providerSchema.pre('save', async function(next) {
  const provider = this;
  if (provider.isModified('credentials')) {
    provider.credentials = crypto.encrypt(JSON.stringify(provider.credentials));
  }
  next();
});

// Method to get decrypted credentials
providerSchema.methods.getDecryptedCredentials = function() {
  return JSON.parse(crypto.decrypt(this.credentials));
};

// Don't return credentials in JSON
providerSchema.methods.toJSON = function() {
  const provider = this.toObject();
  delete provider.credentials;
  return provider;
};

const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;