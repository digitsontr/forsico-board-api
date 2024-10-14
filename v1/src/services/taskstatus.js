const TaskStatus = require("../models/taskStatus");
const User = require("../models/user");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/taskStatus");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");


const createDefaultTaskStatus = async (boardId, workspaceId, ownerId) => {
    try {
      const defaultStatus = new TaskStatus({
        name: "Filling Description",
        color: "#f2f2f2",
        boardId: boardId,
        workspaceId: workspaceId,
        createdBy: ownerId,
        allowedTransitions: [],
      });
  
      const savedStatus = await defaultStatus.save();
      return ApiResponse.success(savedStatus);
    } catch (error) {
      console.error("Error creating default task status:", error);
      return ApiResponse.fail([new ErrorDetail("Failed to create default task status")]);
    }
  };

const createTaskStatus = async (userId, workspaceId, statusData) => {
  try {
    const user = await User.findOne({ id: userId }, "_id");
    const taskStatus = new TaskStatus({
      name: statusData.name,
      color: statusData.color || "#f2f2f2",
      boardId: statusData.boardId,
      workspaceId: workspaceId,
      createdBy: user._id,
      allowedTransitions: statusData.allowedTransitions || [],
      listId: statusData.listId || null,
    });

    const savedStatus = await taskStatus.save();
    return ApiResponse.success(savedStatus);
  } catch (e) {
    console.error("Error creating task status:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to create task status")]);
  }
};

const getStatusesOfBoard = async (boardId) => {
  try {
    const statuses = await TaskStatus.find({ boardId: boardId });
    return ApiResponse.success(statuses);
  } catch (e) {
    console.error("Error fetching statuses for board:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve statuses")]);
  }
};

const getStatusById = async (statusId) => {
  try {
    const status = await TaskStatus.findById(statusId);
    if (!status) {
      return ApiResponse.fail([new ErrorDetail("Task status not found")]);
    }

    return ApiResponse.success(status);
  } catch (e) {
    console.error("Error retrieving task status:", e);
    return ApiResponse.fail([
      new ErrorDetail("Failed to retrieve task status"),
    ]);
  }
};

const updateTaskStatus = async (statusId, statusData) => {
  try {
    const updatedStatus = await TaskStatus.findByIdAndUpdate(
      statusId,
      {
        name: statusData.name,
        color: statusData.color || "#000000",
        allowed_transitions: statusData.allowed_transitions || [],
        list_id: statusData.list_id || null,
      },
      { new: true }
    );

    if (!updatedStatus) {
      return ApiResponse.fail([
        new ErrorDetail("Task status not found or update failed"),
      ]);
    }

    return ApiResponse.success(updatedStatus);
  } catch (e) {
    console.error("Error updating task status:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to update task status")]);
  }
};

const deleteTaskStatus = async (statusId) => {
  try {
    const deletedStatus = await TaskStatus.findByIdAndDelete(statusId);
    if (!deletedStatus) {
      return ApiResponse.fail([
        new ErrorDetail("Task status not found or delete failed"),
      ]);
    }

    return ApiResponse.success(deletedStatus);
  } catch (e) {
    console.error("Error deleting task status:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to delete task status")]);
  }
};

module.exports = {
  createTaskStatus,
  getStatusById,
  getStatusesOfBoard,
  updateTaskStatus,
  deleteTaskStatus,
  createDefaultTaskStatus,
};
