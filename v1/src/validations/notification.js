const Joi = require("joi");

const logAndPublishNotificationValidation = Joi.object({
  workspaceId: Joi.string().required().min(24).max(24),
  boardId: Joi.string().required().min(24).max(24),
  message: Joi.string().required().min(1),
  targetId: Joi.string().required().min(24).max(24),
});

const getNotificationsValidation = Joi.object({
  workspaceIds: Joi.array().items(Joi.string().min(24).max(24)).required(),
  boardIds: Joi.array().items(Joi.string().min(24).max(24)).required(),
  page: Joi.number().optional().min(1)
});

const updateNotificationStatusValidation = Joi.object({
  notificationId: Joi.string().required().min(24).max(24),
});

const bulkUpdateNotificationStatusValidation = Joi.object({
  notificationIds: Joi.array().items(Joi.string().min(24).max(24)).required(),
});

module.exports = {
  logAndPublishNotificationValidation,
  getNotificationsValidation,
  updateNotificationStatusValidation,
  bulkUpdateNotificationStatusValidation,
};
