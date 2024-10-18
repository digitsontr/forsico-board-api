const Joi = require("joi");

const logAndPublishNotificationValidation = Joi.object({
  workspaceId: Joi.string().required().min(24).max(24),
  boardId: Joi.string().required().min(24).max(24),
  message: Joi.string().required().min(1),
  targetId: Joi.string().required().min(24).max(24),
});

const getNotificationsValidation = Joi.object({
  boardIds: Joi.array().items(Joi.string().min(24).max(24)).required(),
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
