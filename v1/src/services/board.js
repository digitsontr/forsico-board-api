const Board = require("../models/board");
const Workspace = require("../models/workspace");
const User = require("../models/user");
const TaskStatus = require("../models/taskStatus");
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
const { populate } = require("../models/task");
const { CacheService, CACHE_TTL } = require('./cache');

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

const getBoardById = async (id, workspaceId) => {
  try {
    const cacheKey = CacheService.generateKey(workspaceId, 'board', id);
    
    // Try to get from cache
    const cachedBoard = await CacheService.get(cacheKey);
    if (cachedBoard) {
      return ApiResponse.success(cachedBoard);
    }

    const board = await Board.findById(id, "name description workspaceId")
      .populate([
        {
          path: "lists",
          match: { isDeleted: false },
          select: "name tasks color order",
          options: { 
            sort: { order: 1 },
            lean: true 
          },
          populate: {
            path: "tasks",
            match: { isDeleted: false },
            select: "name boardId assignee dueDate priority subtasks statusId parentTask createdAt",
            options: {
              sort: {
                // First by priority (higher number = higher priority)
                priority: -1,
                // Then by due date (closer = higher priority)
                dueDate: 1,
                // Finally by creation date
                createdAt: 1
              }
            },
            populate: {
              path: "members",
              select: "id _id firstName lastName profilePicture",
            },
          }
        },
        {
          path: "members",
          select: "_id firstName lastName profilePicture id",
          options: { lean: true }
        }
      ])
      .lean();

    if (!board) {
      Logger.error(`Board not found: boardId=${id}`);
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    // Add urgency level to tasks
    if (board.lists) {
      board.lists.forEach(list => {
        if (list.tasks) {
          list.tasks = list.tasks.map(task => ({
            ...task,
            urgencyLevel: calculateUrgencyLevel(task)
          }));
        }
      });
    }

    // Cache the board data
    await CacheService.set(cacheKey, board, CACHE_TTL.BOARD);

    return ApiResponse.success(board);
  } catch (e) {
    Logger.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve board")]);
  }
};

// Helper function to calculate task urgency
const calculateUrgencyLevel = (task) => {
  let urgencyScore = 0;
  const now = new Date();

  // Priority based score (0-5) * 20 = max 100 points
  urgencyScore += (task.priority || 0) * 20;

  // Due date based score
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      // Overdue tasks get maximum urgency
      urgencyScore += 100;
    } else if (daysUntilDue === 0) {
      // Due today
      urgencyScore += 90;
    } else if (daysUntilDue <= 2) {
      // Due in next 2 days
      urgencyScore += 80;
    } else if (daysUntilDue <= 7) {
      // Due in next week
      urgencyScore += 60;
    } else if (daysUntilDue <= 14) {
      // Due in next 2 weeks
      urgencyScore += 40;
    } else {
      // Due in more than 2 weeks
      urgencyScore += 20;
    }
  }

  // Convert score to level
  if (urgencyScore >= 150) return 'CRITICAL';
  if (urgencyScore >= 120) return 'HIGH';
  if (urgencyScore >= 80) return 'MEDIUM';
  if (urgencyScore >= 40) return 'LOW';
  return 'NORMAL';
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

    const savedBoard = await boardModel.save({ session });
    const defaultItems = [
      { name: "Backlog", color: "#ED1E5A", order: 1 },
      { name: "In Progress", color: "#36C5F0", order: 2 },
      { name: "Done", color: "#A1F679", order: 3 },
    ];

    const createdLists = [];
    const createdStatuses = [];

    for (const item of defaultItems) {
      const list = new List({
        name: item.name,
        boardId: savedBoard._id,
        workspaceId,
        color: item.color,
        order: item.order,
      });
      const savedList = await list.save({ session });
      createdLists.push(savedList);

      const taskStatus = new TaskStatus({
        name: item.name,
        color: item.color,
        boardId: savedBoard._id,
        workspaceId,
        createdBy: user._id,
        listId: savedList._id,
      });
      const savedStatus = await taskStatus.save({ session });
      createdStatuses.push(savedStatus);
    }

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
      return ApiResponse.fail([new ErrorDetail("Board not found or update failed")]);
    }

    // Invalidate board cache
    const cacheKey = CacheService.generateKey(updatedBoard.workspaceId, 'board', id);
    await CacheService.del(cacheKey);

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

    const workspace = await Workspace.findById(board.workspaceId);

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    if (!workspace.members.includes(user._id)) {
      return ApiResponse.fail([
        new ErrorDetail("User is not a member of the workspace"),
      ]);
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

const removeMemberFromBoard = async (boardId, userId) => {
  try {
    const board = await Board.findById(boardId);

    if (!board) {
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return ApiResponse.fail([new ErrorDetail("User not found")]);
    }

    const memberIndex = board.members.indexOf(user._id);

    if (memberIndex === -1) {
      return ApiResponse.fail([
        new ErrorDetail("User is not a member of this board"),
      ]);
    }

    board.members.splice(memberIndex, 1);
    await board.save();

    return ApiResponse.success(board);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([
      new ErrorDetail("Failed to remove member from board"),
    ]);
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
  removeMemberFromBoard,
  deleteBoardsByWorkspaceId,
};
