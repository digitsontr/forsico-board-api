const httpStatus = require("http-status");
const service = require("../services/notification");

const getNotifications = async (req, res) => {
  const response = await service.getNotifications(
    req.workspaceId,
    req.body.boardIds
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const bulkUpdateNotificationStatus = async (req, res) => {
  const { notificationIds } = req.body;
  const userId = req.user.id;

  const response = await service.bulkUpdateNotificationStatus(
    notificationIds,
    userId
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateNotificationStatus = async (req, res) => {
  const response = await service.updateNotificationStatus(
    req.params.notificationId,
    req.user.id
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteNotification = async (req, res) => {
  const response = await service.deleteNotification(req.params.notificationId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  bulkUpdateNotificationStatus,
  getNotifications,
  updateNotificationStatus,
  deleteNotification,
};
