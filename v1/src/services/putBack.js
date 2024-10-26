const Workspace = require("../models/workspace");
const Board = require("../models/board");
const List = require("../models/list");
const Task = require("../models/task");
const TaskStatus = require("../models/taskStatus");
const Comment = require("../models/comment");
const Checklist = require("../models/checklist");
const Logger = require("../scripts/logger/putBack");

const putBackByDeletionId = async (deletionId) => {
  try {
    const results = await Promise.allSettled([
      restoreCollection(Workspace, deletionId),
      restoreCollection(Board, deletionId),
      restoreCollection(List, deletionId),
      restoreCollection(Task, deletionId),
      restoreCollection(TaskStatus, deletionId),
      restoreCollection(Comment, deletionId),
      restoreCollection(Checklist, deletionId),
    ]);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        Logger.log(
          "error",
          `Error restoring collection ${getModelName(index)}:`,
          result.reason
        );
      } else {
        Logger.log(
          "info",
          `Successfully restored items from ${getModelName(index)}.`
        );
      }
    });

    return { success: true, message: "Put-back process completed." };
  } catch (error) {
    Logger.log("error", `Put-back process failed: ${error.message}`);
    throw new Error(`Put-back process failed: ${error.message}`);
  }
};

const restoreCollection = async (Model, deletionId) => {
  const result = await Model.updateMany(
    { deletionId, isDeleted: true },
    { isDeleted: false, deletedAt: null, deletionId: null }
  );
  return result;
};

const getModelName = (index) => {
  const models = [
    "Workspace",
    "Board",
    "List",
    "Task",
    "TaskStatus",
    "Comment",
    "Checklist",
  ];
  return models[index];
};

module.exports = { putBackByDeletionId };
