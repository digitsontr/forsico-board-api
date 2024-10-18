const Notification = require("../models/notification");
const redis = require("../config/redisClient");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const { htmlToText } = require("html-to-text");

const logAndPublishNotification = async (model, action, data) => {
  try {
    const message = generateMessage(model, action, data);

    const notification = new Notification({
      workspaceId: data.workspaceId,
      boardId: data.boardId,
      model: model,
      action: action,
      message,
      targetId: data.targetId,
      readBy: [],
    });

    await notification.save();

    redis.publish(
      `workspace:${data.workspaceId}:board:${data.boardId}`,
      JSON.stringify({
        action: action,
        model: model,
        workspaceId: data.workspaceId,
        boardId: data.boardId,
        taskId: data.taskId || "",
        message,
        user: data.user,
        targetId: data.targetId,
        createdAt: notification.createdAt,
      })
    );

    return ApiResponse.success(notification);
  } catch (error) {
    console.error("Failed to log and publish notification:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

const getNotifications = async (workspaceId, boardIds) => {
  try {
    const notifications = await Notification.find({
      workspaceId,
      boardId: { $in: boardIds },
    }).sort({ createdAt: -1 });

    return ApiResponse.success(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

const updateNotificationStatus = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return ApiResponse.fail([new ErrorDetail("Notification not found")]);
    }

    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    return ApiResponse.success(notification);
  } catch (error) {
    console.error("Failed to update notification status:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

const bulkUpdateNotificationStatus = async (notificationIds, userId) => {
  try {
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { readBy: userId } }
    );

    if (result.modifiedCount === 0) {
      return ApiResponse.fail([
        new ErrorDetail("No notifications were updated"),
      ]);
    }

    return ApiResponse.success(`${result.modifiedCount} notifications updated`);
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

const generateMessage = (model, action, data) => {
  switch (model) {
    case "Task":
      return handleTaskNotifications(action, data);
    case "Comment":
      return handleCommentNotifications(action, data);
    case "Board":
      return handleBoardNotifications(action, data);
    default:
      return "An unknown action occurred.";
  }
};

const handleTaskNotifications = (
  action,
  { user, task, newStatus, changes }
) => {
  switch (action) {
    case "statusChange":
      return `${user.firstName} ${user.lastName} changed the status of task ${task.name} to ${newStatus}.`;
    case "updateTask":
      return generateTaskChangeMessage(user, task.name, changes);
    case "newTask":
      return `${user.firstName} ${user.lastName} created a new task: ${task.name}.`;
    default:
      return "An unknown task action occurred.";
  }
};

const handleCommentNotifications = (action, { user, comment, task }) => {
  switch (action) {
    case "newComment":
      return `${user.firstName} ${user.lastName} added a new comment to task ${
        task.name
      }. ::=> ${formatComment(comment.content)}`;
    case "updateComment":
      return `${user.firstName} ${user.lastName} updated a comment on task ${
        task.name
      }. ::=> ${formatComment(comment.content)}`;
    default:
      return "An unknown comment action occurred.";
  }
};

const handleBoardNotifications = (action, { user, board }) => {
  switch (action) {
    case "newTask":
      return `${user.firstName} ${user.lastName} created a new task on board ${board.name}.`;
    default:
      return "An unknown board action occurred.";
  }
};

const detectTaskChanges = (oldTask, newData) => {
  const changes = [];
  try {
    if (
      typeof newData.dueDate !== "undefined" &&
      oldTask.dueDate?.toISOString() !== new Date(newData.dueDate).toISOString()
    )
      changes.push("due date");
    if (
      typeof newData.assignee !== "undefined" &&
      oldTask.assignee?.toString() !== newData.assignee
    )
      changes.push("assignee");
    if (
      typeof newData.priority !== "undefined" &&
      oldTask.priority !== newData.priority
    )
      changes.push("priority");
    if (typeof newData.name !== "undefined" && oldTask.name !== newData.name)
      changes.push("name");
    if (
      typeof newData.description !== "undefined" &&
      oldTask.description !== newData.description
    )
      changes.push("description");
  } catch (e) {
    console.error(e);
  }

  return changes;
};

const generateTaskChangeMessage = (user, taskName, changes) => {
  if (changes.length === 1) {
    return `${user.firstName} ${user.lastName} updated ${changes[0]} for task ${taskName}.`;
  }
  return `${user.firstName} ${user.lastName} updated ${changes.join(
    ", "
  )} for task ${taskName}.`;
};

const formatComment = (comment) => {
  return htmlToText(comment, {
    wordwrap: 80,
    ignoreImage: true,
    format: {
      anchor: (node) => `${node.text} (${node.attribs.href})`,
      table: (node, { rowSeparator }) => {
        return node.rows.map((row) => row.join(" | ")).join(rowSeparator);
      },
    },
  });
};

module.exports = {
  logAndPublishNotification,
  getNotifications,
  updateNotificationStatus,
  bulkUpdateNotificationStatus,
  detectTaskChanges,
};
