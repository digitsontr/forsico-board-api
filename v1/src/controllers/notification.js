const httpStatus = require("http-status");
const service = require("../services/notification");

const getNotifications = async (req, res) => {
  const response = await service.getNotifications(
    req.body.workspaceIds,
    req.body.boardIds,
    req.user.sub,
    Number(req.query.page) || 1
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const bulkUpdateNotificationStatus = async (req, res) => {
  const response = await service.bulkUpdateNotificationStatus(
    req.body.notificationIds,
    req.user.sub
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
    req.user.sub
  );

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
};
