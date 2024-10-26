const Notification = require("../models/notification");
const redis = require("../config/redisClient");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const { htmlToText } = require("html-to-text");
const User = require("../models/user");
const Workspace = require("../models/workspace");

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
      user: data.user._id,
      taskId: data.taskId || null,
      readBy: [],
    });

    const savedNotification = await notification.save();

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
        _id: savedNotification._id,
      })
    );

    return ApiResponse.success(notification);
  } catch (error) {
    console.error("Failed to log and publish notification:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

const getNotifications = async (
  workspaceIds,
  boardIds,
  userId,
  page = 1,
  limit = 10
) => {
  try {
    const user = await User.findOne({ id: userId }, "_id");
    const workspaces = (await Workspace.find({ members: user._id }, "_id")).map(
      (ws) => ws._id.toString()
    );
    
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      workspaceId: {
        $in: workspaceIds.filter((id) => workspaces.includes(id)),
      },
      boardId: { $in: boardIds },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("readBy", "_id id")
      .populate("user", "_id id firstName lastName profilePicture");

    return ApiResponse.success({
      notifications,
      page,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

const updateNotificationStatus = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId)
      .populate("readBy", "_id id")
      .populate("user", "_id id firstName lastName profilePicture");
    const user = await User.findOne({ id: userId }, "_id");

    if (!notification) {
      return ApiResponse.fail([new ErrorDetail("Notification not found")]);
    }

    if (!notification.readBy.includes(user._id)) {
      notification.readBy.push(user._id);
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
    const user = await User.findOne({ id: userId }, "_id");

    const updateResult = await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { readBy: user._id } },
      { writeConcern: { w: "majority" } }
    );

    const updatedNotifications = await Notification.find({
      _id: { $in: notificationIds },
    })
      .populate("readBy", "_id id")
      .populate("user", "_id id firstName lastName profilePicture");

    return ApiResponse.success(updatedNotifications);
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
      return `${user.firstName} ${user.lastName} created a new task ${task.name}.`;
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
