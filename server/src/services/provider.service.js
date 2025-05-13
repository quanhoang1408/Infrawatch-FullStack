// src/services/provider.service.js
const Provider = require('../models/provider.model');
const { ApiError } = require('../utils/errors');

/**
 * Create a new provider
 * @param {Object} providerData
 * @returns {Promise<Provider>}
 */
const createProvider = async (providerData) => {
  // Check if provider with same name already exists
  const existingProvider = await Provider.findOne({ name: providerData.name });
  if (existingProvider) {
    throw new ApiError(409, 'Provider with same name already exists');
  }

  const provider = await Provider.create(providerData);
  return provider;
};

/**
 * Get all providers
 * @returns {Promise<Array<Provider>>}
 */
const getProviders = async () => {
  return Provider.find();
};

/**
 * Get provider by ID
 * @param {string} id
 * @returns {Promise<Provider>}
 */
const getProviderById = async (id) => {
  const provider = await Provider.findById(id);
  if (!provider) {
    throw new ApiError(404, 'Provider not found');
  }
  return provider;
};

/**
 * Update provider
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Provider>}
 */
const updateProvider = async (id, updateData) => {
  const provider = await Provider.findById(id);
  if (!provider) {
    throw new ApiError(404, 'Provider not found');
  }

  // If name is being updated, check for duplicates
  if (updateData.name && updateData.name !== provider.name) {
    const existingProvider = await Provider.findOne({ name: updateData.name });
    if (existingProvider) {
      throw new ApiError(409, 'Provider with same name already exists');
    }
  }

  Object.assign(provider, updateData);
  await provider.save();
  return provider;
};

/**
 * Delete provider
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteProvider = async (id) => {
  const provider = await Provider.findById(id);
  if (!provider) {
    throw new ApiError(404, 'Provider not found');
  }

  // Kiểm tra xem có VM nào đang sử dụng provider này không
  const VM = require('../models/vm.model');
  const vmsUsingProvider = await VM.countDocuments({ providerId: id });

  if (vmsUsingProvider > 0) {
    throw new ApiError(400, 'Không thể xóa provider vì có máy ảo đang sử dụng. Vui lòng xóa các máy ảo trước.');
  }

  await Provider.deleteOne({ _id: id });
};

/**
 * Update provider sync time
 * @param {string} id
 * @returns {Promise<void>}
 */
const updateProviderSyncTime = async (id) => {
  await Provider.findByIdAndUpdate(id, { lastSyncAt: new Date() });
};

module.exports = {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
  updateProviderSyncTime,
};