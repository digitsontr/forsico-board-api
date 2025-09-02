const TaskStatus = require("../models/taskStatus");
const Task = require("../models/task");
const List = require("../models/list");
const User = require("../models/user");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/taskStatus");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const { v4: uuidv4 } = require("uuid");

const createDefaultTaskStatuses = async (boardId, workspaceId, ownerId) => {
  try {
    const statuses = [
      { name: "Backlog", color: "#f2f2f2" },
      { name: "In Progress", color: "#ffcc00" },
      { name: "Done", color: "#00cc66" },
    ];

    const savedStatuses = [];

    for (const status of statuses) {
      const taskStatus = new TaskStatus({
        ...status,
        boardId: boardId,
        workspaceId: workspaceId,
        createdBy: ownerId,
        allowedTransitions: [],
      });

      const savedStatus = await taskStatus.save();
      savedStatuses.push(savedStatus);
    }

    return ApiResponse.success(savedStatuses);
  } catch (error) {
    console.error("Error creating default task statuses:", error);
    return ApiResponse.fail([
      new ErrorDetail("Failed to create default task statuses"),
    ]);
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
    const statuses = await TaskStatus.find({
      boardId: boardId,
      isDeleted: false,
    });
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
        listId: statusData.listId || null,
      },
      { new: true }
    );

    if (!updatedStatus) {
      return ApiResponse.fail([
        new ErrorDetail("Task status not found or update failed"),
      ]);
    }

    // Sync with related List if listId exists and name/color changed
    if (updatedStatus.listId && (statusData.name || statusData.color)) {
      try {
        const updateData = {};
        if (statusData.name) updateData.name = statusData.name;
        if (statusData.color) updateData.color = statusData.color;

        await List.findByIdAndUpdate(updatedStatus.listId, updateData);
        Logger.log('info', `Synced List ${updatedStatus.listId} with TaskStatus ${statusId}`);
      } catch (syncError) {
        Logger.log('warn', `Failed to sync List with TaskStatus: ${syncError.message}`);
        // Don't fail the main operation if sync fails
      }
    }

    return ApiResponse.success(updatedStatus);
  } catch (e) {
    console.error("Error updating task status:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to update task status")]);
  }
};

const deleteTaskStatus = async (statusId, deletionId, defaultStatusId) => {
  try {
    const status = await TaskStatus.findById(statusId);
    if (!status) {
      return ApiResponse.fail([new ErrorDetail("Task status not found")]);
    }

    if (!deletionId) {
      const defaultStatus = await TaskStatus.findOne({ name: "Backlog" });
      if (!defaultStatus) {
        return ApiResponse.fail([new ErrorDetail("Default status not found")]);
      }

      await Task.updateMany(
        { statusId: status._id },
        { statusId: defaultStatusId || defaultStatus._id }
      );
    }

    deletionId = deletionId || uuidv4();

    const updatedStatus = await TaskStatus.findByIdAndUpdate(statusId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletionId: deletionId,
    });

    // Sync with related List if listId exists
    if (status.listId && !deletionId) {
      try {
        await List.findByIdAndUpdate(status.listId, {
          isDeleted: true,
          deletedAt: new Date(),
          deletionId: deletionId,
        });
        Logger.log('info', `Synced List ${status.listId} deletion with TaskStatus ${statusId}`);
      } catch (syncError) {
        Logger.log('warn', `Failed to sync List deletion with TaskStatus: ${syncError.message}`);
        // Don't fail the main operation if sync fails
      }
    }

    return ApiResponse.success(updatedStatus);
  } catch (e) {
    console.error("Error deleting task status:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to delete task status")]);
  }
};

const deleteTaskStatusesByBoard = async (boardId, deletionId) => {
  Logger.log(
    "info",
    "TASKSTATUS REMOVE OPERATION STARTED DELETION ID: " + deletionId
  );

  const taskStatuses = await TaskStatus.find({ boardId });
  const results = await Promise.allSettled(
    taskStatuses.map((status) => deleteTaskStatus(status._id, deletionId))
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      Logger.log(
        "error",
        `TaskStatus ${taskStatuses[index]._id} can't be removed:`,
        result.reason
      );
    }
  });

  Logger.log(
    "info",
    "TASKSTATUS REMOVE OPERATION ENDED DELETION ID: " + deletionId
  );

  return true;
};

/**
 * Fix existing TaskStatuses without listId by linking them to lists
 * @param {string} boardId - Board ID to fix
 */
const fixTaskStatusListLinks = async (boardId) => {
  try {
    // Get all statuses without listId for this board
    const statusesWithoutList = await TaskStatus.find({
      boardId: boardId,
      listId: { $exists: false },
      isDeleted: false
    });

    if (statusesWithoutList.length === 0) {
      return ApiResponse.success({ message: "No statuses need fixing" });
    }

    // Get all lists for this board
    const lists = await List.find({
      boardId: boardId,
      isDeleted: false
    }).sort({ createdAt: 1 });

    if (lists.length === 0) {
      return ApiResponse.fail([new ErrorDetail("No lists found for board")]);
    }

    // Link statuses to lists (round-robin or by name matching)
    const updates = [];
    for (let i = 0; i < statusesWithoutList.length; i++) {
      const status = statusesWithoutList[i];
      const list = lists[i % lists.length]; // Round-robin assignment

      updates.push(
        TaskStatus.findByIdAndUpdate(status._id, { listId: list._id })
      );

      Logger.log('info', `Linking status ${status.name} (${status._id}) to list ${list.name} (${list._id})`);
    }

    await Promise.all(updates);

    return ApiResponse.success({
      message: `Fixed ${statusesWithoutList.length} statuses`,
      fixed: statusesWithoutList.length
    });
  } catch (error) {
    Logger.log('error', `Error fixing task status list links: ${error.message}`);
    return ApiResponse.fail([new ErrorDetail("Failed to fix task status list links")]);
  }
};

module.exports = {
  createTaskStatus,
  getStatusById,
  getStatusesOfBoard,
  updateTaskStatus,
  deleteTaskStatus,
  createDefaultTaskStatuses,
  deleteTaskStatusesByBoard,
  fixTaskStatusListLinks,
};
