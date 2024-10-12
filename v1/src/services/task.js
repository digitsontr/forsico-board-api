const Task = require("../models/task");
const TaskStatus = require("../models/taskStatus");
const List = require("../models/list");
const Workspace = require("../models/workspace");
const User = require("../models/user");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");
const Logger = require("../scripts/logger/task");

const getTasksOfBoard = async (boardId, workspaceId) => {
  try {
    const tasks = await Task.find({ boardId: boardId, workspaceId })
      .populate("assignee", "firstName lastName profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "firstName lastName profilePicture",
        },
      });
    return ApiResponse.success(tasks);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve tasks")]);
  }
};

const getTaskById = async (id) => {
  try {
    const task = await Task.findById(id)
      .populate("assignee", "firstName lastName profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "firstName lastName profilePicture",
        },
      });
    if (!task) {
      return ApiResponse.fail([new ErrorDetail("Task not found")]);
    }
    return ApiResponse.success(task);
  } catch (e) {
    console.error("ERR: ", e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve task")]);
  }
};

const createTask = async (workspaceId, taskData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const user = await User.findOne({ id: taskData.ownerId }, "_id");
    const assignedUser = await User.findOne({ id: taskData.assignee }, "_id");

    const defaultStatus = await TaskStatus.findOne({
      name: "Filling Description",
      boardId: taskData.boardId,
    });

    if (!defaultStatus) {
      throw new Error("Default task status not found");
    }

    const taskModel = new Task({
      name: taskData.name,
      description: taskData.description || "",
      boardId: taskData.boardId,
      assignee: assignedUser?._id || null,
      dueDate: taskData.dueDate || null,
      ownerId: user?._id,
      priority: taskData.priority || 0,
      entranceDate: taskData.entranceDate || Date.now(),
      workspaceId: workspaceId,
      listId: taskData.listId || null,
      statusId: defaultStatus._id,
    });

    if (taskData.parentTask) {
      const parentTask = await Task.findById(taskData.parentTask);
      if (parentTask) {
        parentTask.subtasks.push(taskModel._id);
        await parentTask.save({ session });
      }
      taskModel.parentTask = taskData.parentTask;
    }

    if (taskData.listId) {
      const list = await List.findById(taskData.listId);
      if (list) {
        list.tasks.push(taskModel._id);
        await list.save({ session });
      }
    }

    const savedTask = await taskModel.save({ session });
    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(savedTask);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    Logger.log({
      level: "error",
      message: `Error creating task: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to create task")]);
  }
};

const updateTask = async (id, updateData) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedTask) {
      return ApiResponse.fail([
        new ErrorDetail("Task not found or update failed"),
      ]);
    }

    if (updateData.listId) {
      const oldTask = await Task.findById(id);
      if (
        oldTask &&
        oldTask.listId &&
        oldTask.listId !== updateData.listId
      ) {
        const oldList = await List.findById(oldTask.listId);
        if (oldList) {
          oldList.tasks.pull(oldTask._id);
          await oldList.save();
        }

        const newList = await List.findById(updateData.listId);
        if (newList) {
          newList.tasks.push(oldTask._id);
          await newList.save();
        }
      }
    }

    return ApiResponse.success(updatedTask);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update task")]);
  }
};

const deleteTask = async (id) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return ApiResponse.fail([
        new ErrorDetail("Task not found or delete failed"),
      ]);
    }

    if (deletedTask.parentTask) {
      await Task.findByIdAndUpdate(deletedTask.parentTask, {
        $pull: { subtasks: deletedTask._id },
      });
    }

    if (deletedTask.listId) {
      await List.findByIdAndUpdate(deletedTask.listId, {
        $pull: { tasks: deletedTask._id },
      });
    }

    return ApiResponse.success(deletedTask);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to delete task")]);
  }
};

module.exports = {
  getTasksOfBoard,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
