const Board = require("../models/board");
const Workspace = require("../models/workspace");
const User = require("../models/user");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");
const Logger = require("../scripts/logger/board");
const userService = require("../services/user");
const taskStatusService = require("../services/taskstatus");

const getBoardsOfWorkspace = async (workspaceId) => {
  try {
    const boards = await Board.find({ workspaceId: workspaceId }).populate(
      "members",
      "firstname lastname id profilepicture"
    );
    return ApiResponse.success(boards);
  } catch (e) {
    console.log(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve boards")]);
  }
};

const getBoardById = async (id) => {
  try {
    const board = await Board.findById(id);
    if (!board) {
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }
    return ApiResponse.success(board);
  } catch (e) {
    console.log("ERR: ", e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve board")]);
  }
};

const createBoard = async (workspaceId, userId, boardData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const boardModel = new Board({
      name: boardData.name,
      description: boardData.description || "",
      workspaceId: workspaceId,
    });

    const savedBoard = await boardModel.save({ session });
    const user = await User.findOne({ id: userId }, "_id");

    const statusResponse = await taskStatusService.createDefaultTaskStatus(
      savedBoard._id,
      workspaceId,
      user._id
    );

    if (!statusResponse.status) {
      throw new Error("Failed to create default task status");
    }

    workspace.boards.push(savedBoard._id);
    await workspace.save({ session });

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(savedBoard);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    Logger.log({
      level: "error",
      message: `Error creating board: ${e.message}`,
    });
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

const deleteBoard = async (id) => {
  try {
    const deletedBoard = await Board.findByIdAndDelete(id);
    if (!deletedBoard) {
      return ApiResponse.fail([
        new ErrorDetail("Board not found or delete failed"),
      ]);
    }

    await Workspace.findByIdAndUpdate(deletedBoard.workspace, {
      $pull: { boards: deletedBoard._id },
    });

    return ApiResponse.success(deletedBoard);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to delete board")]);
  }
};

const addMemberToBoard = async (boardId, userData) => {
  try {
    console.log("addMemberToBoard");
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
    console.log(e);
    return ApiResponse.fail([new ErrorDetail("Failed to add member to board")]);
  }
};

module.exports = {
  getBoardsOfWorkspace,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addMemberToBoard,
};
