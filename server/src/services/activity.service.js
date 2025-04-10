// src/services/activity.service.js
const Activity = require('../models/activity.model');

/**
 * Log activity
 * @param {Object} activityData - Activity data
 * @param {string} activityData.action - Action performed
 * @param {string} activityData.user - User ID
 * @param {string} activityData.resourceType - Resource type
 * @param {string} activityData.resourceId - Resource ID
 * @param {Object} [activityData.details] - Additional details
 * @param {string} [activityData.status] - Status (success, failure, pending)
 * @param {string} [activityData.errorMessage] - Error message if status is failure
 * @returns {Promise<Activity>}
 */
const logActivity = async (activityData) => {
  return Activity.create(activityData);
};

/**
 * Get activities by user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.page] - Page number
 * @returns {Promise<Array<Activity>>}
 */
const getActivitiesByUser = async (userId, options = {}) => {
  const limit = options.limit || 20;
  const skip = (options.page || 0) * limit;
  
  return Activity.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Get activities by resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.page] - Page number
 * @returns {Promise<Array<Activity>>}
 */
const getActivitiesByResource = async (resourceType, resourceId, options = {}) => {
  const limit = options.limit || 20;
  const skip = (options.page || 0) * limit;
  
  return Activity.find({ resourceType, resourceId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Update activity status
 * @param {string} id - Activity ID
 * @param {string} status - New status
 * @param {string} [errorMessage] - Error message if status is failure
 * @returns {Promise<Activity>}
 */
const updateActivityStatus = async (id, status, errorMessage = null) => {
  const updateData = { status };
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  return Activity.findByIdAndUpdate(id, updateData, { new: true });
};

module.exports = {
  logActivity,
  getActivitiesByUser,
  getActivitiesByResource,
  updateActivityStatus,
};