const Task = require("../models/task");
const TaskStatus = require("../models/taskstatus");
const List = require("../models/list");
const Workspace = require("../models/workspace");
const User = require("../models/user");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");
const Logger = require("../scripts/logger/task");

const getTasksOfBoard = async (boardId, workspaceId) => {
  try {
    const tasks = await Task.find({ board_id: boardId, workspaceId }).populate(
      "assignee",
      "firstname lastname profilePicture"
    );
    return ApiResponse.success(tasks);
  } catch (e) {
    console.log(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve tasks")]);
  }
};

const getTaskById = async (id) => {
  try {
    const task = await Task.findById(id).populate(
      "assignee",
      "firstname lastname profilePicture"
    );
    if (!task) {
      return ApiResponse.fail([new ErrorDetail("Task not found")]);
    }
    return ApiResponse.success(task);
  } catch (e) {
    console.log("ERR: ", e);
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

    const user = await User.findOne({ id: taskData.owner_id }, "_id");
    const assignedUser = await User.findOne({ id: taskData.assignee }, "_id");

    const defaultStatus = await TaskStatus.findOne({
      name: "Filling Description",
      board_id: taskData.board_id,
    });

    if (!defaultStatus) {
      throw new Error("Default task status not found");
    }

    const taskModel = new Task({
      name: taskData.name,
      description: taskData.description || "",
      board_id: taskData.board_id,
      assignee: assignedUser?._id || null,
      due_date: taskData.due_date || null,
      owner_id: user?._id,
      priority: taskData.priority || 0,
      entrance_date: taskData.entrance_date || Date.now(),
      workspaceId: workspaceId,
      list_id: taskData.list_id || null,
      status_id: defaultStatus._id
    });

    if (taskData.parent_task) {
      const parentTask = await Task.findById(taskData.parent_task);
      if (parentTask) {
        parentTask.subtasks.push(taskModel._id);
        await parentTask.save({ session });
      }
      taskModel.parent_task = taskData.parent_task;
    }

    if (taskData.list_id) {
      const list = await List.findById(taskData.list_id);
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

    if (updateData.list_id) {
      const oldTask = await Task.findById(id);
      if (
        oldTask &&
        oldTask.list_id &&
        oldTask.list_id !== updateData.list_id
      ) {
        const oldList = await List.findById(oldTask.list_id);
        if (oldList) {
          oldList.tasks.pull(oldTask._id);
          await oldList.save();
        }

        const newList = await List.findById(updateData.list_id);
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

    if (deletedTask.parent_task) {
      await Task.findByIdAndUpdate(deletedTask.parent_task, {
        $pull: { subtasks: deletedTask._id },
      });
    }

    if (deletedTask.list_id) {
      await List.findByIdAndUpdate(deletedTask.list_id, {
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
