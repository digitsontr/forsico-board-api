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
  bulkUpdateNotificationStatus,
} = require("../controllers/notification");

router.post(
  "/",
  validate(validations.getNotificationsValidation),
  authorize(),
  getNotifications
);

router.patch(
  "/:notificationId/read",
  validate(validations.updateNotificationStatusValidation),
  verifyWorkspace(),
  authorize(),
  updateNotificationStatus
);

router.patch(
  "/bulkRead",
  validate(validations.bulkUpdateNotificationStatusValidation),
  verifyWorkspace(),
  authorize(),
  bulkUpdateNotificationStatus
);

module.exports = router;
