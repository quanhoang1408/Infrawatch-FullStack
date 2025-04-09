// src/api/v1/admin/provider.controller.js
const providerService = require('../../../services/provider.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Create a new provider
 */
const createProvider = asyncHandler(async (req, res) => {
  const provider = await providerService.createProvider(req.body);
  res.status(201).send(provider);
});

/**
 * Get all providers
 */
const getProviders = asyncHandler(async (req, res) => {
  const providers = await providerService.getProviders();
  res.send(providers);
});

/**
 * Get provider by ID
 */
const getProvider = asyncHandler(async (req, res) => {
  const provider = await providerService.getProviderById(req.params.providerId);
  res.send(provider);
});

/**
 * Update provider
 */
const updateProvider = asyncHandler(async (req, res) => {
  const provider = await providerService.updateProvider(req.params.providerId, req.body);
  res.send(provider);
});

/**
 * Delete provider
 */
const deleteProvider = asyncHandler(async (req, res) => {
  await providerService.deleteProvider(req.params.providerId);
  res.status(204).send();
});

module.exports = {
  createProvider,
  getProviders,
  getProvider,
  updateProvider,
  deleteProvider,
};