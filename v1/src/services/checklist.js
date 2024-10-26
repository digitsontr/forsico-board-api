const Checklist = require("../models/checklist");
const Task = require("../models/task");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const mongoose = require("mongoose");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/checklist");

const createChecklist = async (workspaceId, checklistData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const task = await Task.findById(checklistData.taskId);

    if (!task) {
      return ApiResponse.fail([new ErrorDetail("Task not found")]);
    }

    const checklist = new Checklist({
      taskId: checklistData.taskId,
      workspaceId: workspaceId,
      items: checklistData.items || [],
    });

    const savedChecklist = await checklist.save({ session });

    task.checklists.push(savedChecklist._id);
    await task.save({ session });

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(savedChecklist);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating checklist:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to create checklist")]);
  }
};

const addChecklistItem = async (workspaceId, checklistData) => {
  try {
    const checklist = await Checklist.findOne({
      taskId: checklistData.taskId,
      _id: checklistData.checklistId,
      workspaceId: workspaceId,
    });

    if (!checklist) {
      return ApiResponse.fail([
        new ErrorDetail("Checklist not found for this task"),
      ]);
    }

    const newItem = { title: checklistData.title, isDone: false };
    checklist.items.push(newItem);
    await checklist.save();

    return ApiResponse.success(checklist);
  } catch (e) {
    console.error("Error adding checklist item:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to add checklist item")]);
  }
};

const updateChecklistItem = async (workspaceId, checklistData) => {
  try {
    const checklist = await Checklist.findOne({
      taskId: checklistData.taskId,
      _id: checklistData.checklistId,
      workspaceId: workspaceId,
    });

    if (!checklist) {
      return ApiResponse.fail([
        new ErrorDetail("Checklist not found for this task"),
      ]);
    }

    const item = checklist.items.id(checklistData.itemId);
    if (!item) {
      return ApiResponse.fail([new ErrorDetail("Checklist item not found")]);
    }

    item.title = checklistData.title || item.title;
    item.isDone =
      checklistData.isDone !== undefined ? checklistData.isDone : item.isDone;
    item.updatedAt = Date.now();

    await checklist.save();
    return ApiResponse.success(checklist);
  } catch (e) {
    console.error("Error updating checklist item:", e);
    return ApiResponse.fail([
      new ErrorDetail("Failed to update checklist item"),
    ]);
  }
};

const deleteChecklistItem = async (workspaceId, checklistData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const checklist = await Checklist.findOne({
      taskId: checklistData.taskId,
      _id: checklistData.checklistId,
      workspaceId: workspaceId,
    });

    if (!checklist) {
      return ApiResponse.fail([
        new ErrorDetail("Checklist not found for this task"),
      ]);
    }

    checklist.items.pull({ _id: checklistData.itemId });
    await checklist.save({ session });

    if (checklist.items.length === 0) {
      await Checklist.findByIdAndDelete(checklist._id, { session });

      const task = await Task.findById(checklistData.taskId);
      task.checklists.pull(checklist._id);
      await task.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(checklist);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting checklist item:", e);
    return ApiResponse.fail([
      new ErrorDetail("Failed to delete checklist item"),
    ]);
  }
};

const getChecklist = async (workspaceId, taskId) => {
  try {
    const checklist = await Checklist.find({
      taskId: taskId,
      workspaceId: workspaceId,
      isDeleted: false
    });

    if (!checklist) {
      return ApiResponse.fail([
        new ErrorDetail("Checklist not found for this task"),
      ]);
    }

    return ApiResponse.success(checklist);
  } catch (e) {
    console.error("Error retrieving checklist:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve checklist")]);
  }
};

const deleteChecklistByTask = async (taskId, deletionId) => {
  try {
    await Checklist.updateMany(
      { taskId },
      { isDeleted: true, deletedAt: new Date(), deletionId: deletionId }
    );

    Logger.log("info", `CHECKLISTS OF TASK ${taskId} REMOVED DELETION ID: ${deletionId}`);

    return true;
  } catch (e) {
    Logger.log(
      "error",
      `Checklists can't be removed from task TASK ID:${taskId}`
    );
  }
};

module.exports = {
  createChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getChecklist,
  deleteChecklistByTask,
};
