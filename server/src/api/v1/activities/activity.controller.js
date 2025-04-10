// src/api/v1/activities/activity.controller.js
const activityService = require('../../../services/activity.service');
const { asyncHandler } = require('../../../utils/asyncHandler');

/**
 * Get activities for current user
 */
const getUserActivities = asyncHandler(async (req, res) => {
  const activities = await activityService.getActivitiesByUser(req.user._id, {
    limit: parseInt(req.query.limit) || 20,
    page: parseInt(req.query.page) || 0,
  });
  res.send(activities);
});

/**
 * Get activities for specific resource
 */
const getResourceActivities = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.params;
  const activities = await activityService.getActivitiesByResource(resourceType, resourceId, {
    limit: parseInt(req.query.limit) || 20,
    page: parseInt(req.query.page) || 0,
  });
  res.send(activities);
});

module.exports = {
  getUserActivities,
  getResourceActivities,
};