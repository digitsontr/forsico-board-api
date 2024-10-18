const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissions = require("../scripts/helpers/permissions");
const validations = require("../validations/notification");
const {
  getNotifications,
  updateNotificationStatus,
  deleteNotification,
  bulkUpdateNotificationStatus,
} = require("../controllers/notification");

router.post(
  "/",
  validate(validations.getNotificationsValidation),
  verifyWorkspace(),
  authorize(),
  getNotifications
);

router.patch(
  "/:notificationId/read",
  validate(validations.updateStatusValidation),
  verifyWorkspace(),
  authorize(),
  updateNotificationStatus
);

router.delete(
  "/:notificationId",
  validate(validations.deleteValidation),
  verifyWorkspace(),
  authorize(permissions.CAN_DELETE_NOTIFICATION),
  deleteNotification
);

router.patch(
  "/bulk-read",
  validate(validations.bulkUpdateValidation),
  verifyWorkspace(),
  authorize(),
  bulkUpdateNotificationStatus
);

module.exports = router;
