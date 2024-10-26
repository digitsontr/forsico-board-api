const Board = require("../models/board");
const Workspace = require("../models/workspace");
const User = require("../models/user");
const List = require("../models/list");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const userService = require("../services/user");
const taskStatusService = require("../services/taskStatus");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/board");
const listService = require("./list");
const taskService = require("./task");
const { v4: uuidv4 } = require("uuid");

const getBoardMembers = async (boardId) => {
  try {
    const board = await Board.findById(boardId).populate(
      "members",
      "firstName lastName id profilePicture email"
    );

    if (!board) {
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    return ApiResponse.success(board.members);
  } catch (e) {
    Logger.error(e);
    return ApiResponse.fail([
      new ErrorDetail("Failed to retrieve board members"),
    ]);
  }
};

const getBoardsOfWorkspace = async (workspaceId) => {
  try {
    const boards = await Board.find(
      { workspaceId: workspaceId, isDeleted: false },
      "-isDeleted -deletionId -deletedAt"
    ).populate("members", "firstName lastname id profilePicture");
    return ApiResponse.success(boards);
  } catch (e) {
    Logger.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve boards")]);
  }
};

const getBoardById = async (id) => {
  try {
    const board = await Board.findById(
      id,
      "name description workspaceId"
    ).populate({
      path: "lists",
      select: "name tasks",
      populate: {
        path: "tasks",
        select:
          "name boardId assignee dueDate priority subtasks statusId parentTask",
      },
    });
    if (!board) {
      Logger.error(`Board not found: boardId=${id}`);
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }
    return ApiResponse.success(board);
  } catch (e) {
    Logger.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve board")]);
  }
};

const createBoard = async (workspaceId, userId, boardData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [workspace, user] = await Promise.all([
      Workspace.findById(workspaceId, "_id boards"),
      User.findOne({ id: userId }, "_id"),
    ]);

    if (!workspace) {
      Logger.error(`Workspace not found workspaceId=${workspaceId}`);
      throw new Error("Workspace not found");
    }

    const boardModel = new Board({
      name: boardData.name,
      description: boardData.description || "",
      workspaceId: workspaceId,
    });

    const savedBoardPromise = boardModel.save({ session });

    const taskStatusPromise = taskStatusService.createDefaultTaskStatuses(
      boardModel._id,
      workspaceId,
      user._id
    );

    const [savedBoard, statusResponse] = await Promise.all([
      savedBoardPromise,
      taskStatusPromise,
    ]);

    if (!statusResponse.status) {
      throw new Error("Failed to create default task status");
    }

    const defaultLists = [
      {
        name: "Backlog",
        boardId: savedBoard._id,
        workspaceId,
        color: "#ED1E5A",
      },
      {
        name: "In Progress",
        boardId: savedBoard._id,
        workspaceId,
        color: "#36C5F0",
      },
      { name: "Done", boardId: savedBoard._id, workspaceId, color: "#A1F679" },
    ];

    const createdLists = await List.insertMany(defaultLists, { session });

    savedBoard.lists = createdLists.map((list) => list._id);
    savedBoard.members.push(user._id);
    await savedBoard.save({ session });

    workspace.boards.push(savedBoard._id);
    await workspace.save({ session });

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(savedBoard);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    Logger.error("Error creating board:", e);
    return ApiResponse.fail([new ErrorDetail("Failed to create board")]);
  }
};

const updateBoard = async (id, updateData) => {
  try {
    const updatedBoard = await Board.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedBoard) {
      return ApiResponse.fail([
        new ErrorDetail("Board not found or update failed"),
      ]);
    }
    return ApiResponse.success(updatedBoard);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update board")]);
  }
};

const deleteBoard = async (boardId, deletionId) => {
  try {
    deletionId = deletionId || uuidv4();

    const deletedBoard = await Board.findByIdAndUpdate(boardId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletionId: deletionId,
    });

    Logger.log("info", `BOARD ${boardId} REMOVED DELETION ID: ${deletionId}`);

    await listService.deleteListsByBoard(boardId, deletionId);
    await taskService.deleteTaskByBoard(boardId, deletionId);
    await taskStatusService.deleteTaskStatusesByBoard(boardId, deletionId);

    return ApiResponse.success(deletedBoard);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to delete board")]);
  }
};

const addMemberToBoard = async (boardId, userData) => {
  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    const user = await userService.getUserById(userData.userId);

    if (!user) {
      return ApiResponse.fail([new ErrorDetail("User not found")]);
    }

    if (!board.members.includes(user._id)) {
      board.members.push(user._id);
      await board.save();
    } else {
      return ApiResponse.fail([
        new ErrorDetail("User is already a member of this board"),
      ]);
    }

    return ApiResponse.success(board);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to add member to board")]);
  }
};

const deleteBoardsByWorkspaceId = async (workspaceId, deletionId) => {
  Logger.log(
    "info",
    "BOARD REMOVE OPERATION STARTED DELETION ID: " + deletionId
  );

  const boards = await Board.find({ workspaceId });
  const results = await Promise.allSettled(
    boards.map((board) => deleteBoard(board._id, deletionId))
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      Logger.log(
        "error",
        `Board ${boards[index]._id} can't be removed:`,
        result.reason
      );
    }
  });

  Logger.log("info", "BOARD REMOVE OPERATION ENDED DELETION ID: " + deletionId);

  return true;
};

module.exports = {
  getBoardsOfWorkspace,
  getBoardById,
  getBoardMembers,
  createBoard,
  updateBoard,
  deleteBoard,
  addMemberToBoard,
  deleteBoardsByWorkspaceId,
};
