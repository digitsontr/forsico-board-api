const Board = require("../models/board");
const { Workspace } = require("../models/workspace");
const User = require("../models/user");
const TaskStatus = require("../models/taskStatus");
const List = require("../models/list");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const userService = require("../services/user");
const taskStatusService = require("../services/taskStatus");
const Logger = require("../scripts/logger/board");
const listService = require("./list");
const taskService = require("./task");
const { v4: uuidv4 } = require("uuid");
const { withBaseQuery, withTenantQuery, excludeSoftDeleteFields } = require("../scripts/helpers/queryHelper");

const getBoardMembers = async (boardId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return ApiResponse.fail([new ErrorDetail("Invalid board ID format")]);
    }

    const board = await Board.findOne(
      withBaseQuery({ _id: boardId })
    ).populate("members", "firstName lastName id profilePicture email");

    if (!board) {
      Logger.error(`Board not found: ${boardId}`);
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    return ApiResponse.success(board.members);
  } catch (e) {
    Logger.error(`Error in getBoardMembers: ${e.message}`, e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve board members")]);
  }
};

const getBoardsOfWorkspace = async (workspaceId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return ApiResponse.fail([new ErrorDetail("Invalid workspace ID format")]);
    }

    const boards = await Board.find(
      withTenantQuery({ }, workspaceId),
      excludeSoftDeleteFields()
    )
    .populate("members", "firstName lastname id profilePicture")
    .session(session)
    .lean();
    
    await session.commitTransaction();
    return ApiResponse.success(boards);
  } catch (e) {
    await session.abortTransaction();
    Logger.error(`Error in getBoardsOfWorkspace: ${e.message}`, e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve boards")]);
  } finally {
    session.endSession();
  }
};

// Helper function to get urgency score (for sorting)
const getUrgencyScore = (task) => {
  let urgencyScore = 0;
  const now = new Date();

  // Priority based score (0 is highest, 5 is lowest)
  // Convert 0->200, 1->160, 2->120, 3->80, 4->40, 5->0
  const priority = parseInt(task.priority) || 0;
  urgencyScore += (5 - priority) * 40; // Increase priority weight

  // Due date based score
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      urgencyScore += 200; // Overdue
    } else if (daysUntilDue === 0) {
      urgencyScore += 180; // Due today
    } else if (daysUntilDue <= 2) {
      urgencyScore += 160; // Due in 2 days
    } else if (daysUntilDue <= 7) {
      urgencyScore += 120; // Due in a week
    } else if (daysUntilDue <= 14) {
      urgencyScore += 80; // Due in 2 weeks
    } else {
      urgencyScore += 40; // Due later
    }
  }

  return urgencyScore;
};

const calculateUrgencyLevel = (task) => {
  const urgencyScore = getUrgencyScore(task);

  // Adjust thresholds
  if (urgencyScore >= 300) return 'CRITICAL'; // High priority + overdue/due soon
  if (urgencyScore >= 200) return 'HIGH';     // Either high priority or overdue
  if (urgencyScore >= 150) return 'MEDIUM';   // Medium priority or due soon
  if (urgencyScore >= 100) return 'LOW';      // Lower priority or due later
  return 'NORMAL';                            // No priority or due date
};

const getBoardById = async (id, workspaceId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.fail([new ErrorDetail("Invalid board ID format")]);
    }

    const board = await Board.findOne(
      withTenantQuery({ _id: id }, workspaceId)
    ).populate([
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
          select: "_id name boardId assignee dueDate priority subtasks statusId parentTask createdAt members listId",
          options: {
            lean: true
          },
          populate: [
            {
              path: "members",
              select: "id _id firstName lastName profilePicture",
            },
            {
              path: "assignee",
              select: "id _id firstName lastName profilePicture"
            }
          ]
        }
      },
      {
        path: "members",
        select: "_id firstName lastName profilePicture id",
      }
    ])
    .lean();

    if (!board) {
      Logger.error(`Board not found: boardId=${id}`);
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    // Process and sort tasks by urgency
    if (board.lists) {
      board.lists.forEach(list => {
        if (list.tasks) {
          // Map tasks with urgency data
          list.tasks = list.tasks.map(task => {
            const score = getUrgencyScore(task);
            return {
              ...task,
              priority: parseInt(task.priority) || 0,
              urgencyScore: score,
              urgencyLevel: calculateUrgencyLevel({
                ...task,
                urgencyScore: score
              })
            };
          });

          // Sort tasks by urgency score (descending)
          list.tasks.sort((a, b) => {
            // Sort by urgency score (higher first)
            const scoreDiff = b.urgencyScore - a.urgencyScore;
            if (scoreDiff !== 0) return scoreDiff;

            // If same urgency score, sort by priority (0 is highest)
            const priorityA = parseInt(a.priority) || 0;
            const priorityB = parseInt(b.priority) || 0;
            if (priorityA !== priorityB) return priorityA - priorityB;

            // If same priority, sort by due date (earlier first)
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate) - new Date(b.dueDate);
            }
            // Tasks with due dates come before tasks without
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            // Finally sort by creation date (newer first)
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        }
      });
    }

    return ApiResponse.success(board);
  } catch (e) {
    Logger.error(`Error in getBoardById: ${e.message}`, e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve board")]);
  }
};

const createBoard = async (workspaceId, userId, boardData) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return ApiResponse.fail([new ErrorDetail("Invalid workspace ID format")]);
    }

    const user = await User.findOne({ id: userId }).session(session);
    if (!user) {
      return ApiResponse.fail([new ErrorDetail("User not found")]);
    }

    const workspace = await Workspace.findById(workspaceId).session(session);
    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    const board = new Board({
      name: boardData.name,
      description: boardData.description,
      workspaceId: workspaceId,
      members: [user._id],
      creator: userId
    });

    const savedBoard = await board.save({ session });

    // Create default task statuses
    await taskStatusService.createDefaultTaskStatuses(
      savedBoard._id,
      workspaceId,
      user._id
    );

    // Create default lists
    const defaultLists = [
      { name: "Backlog", color: "#ed1e59", order: 1 },
      { name: "In Progress", color: "#36c5f0", order: 2 },
      { name: "Done", color: "#a1f679", order: 3 }
    ];

    for (const listData of defaultLists) {
      const list = new List({
        name: listData.name,
        color: listData.color,
        boardId: savedBoard._id,
        workspaceId: workspaceId,
        order: listData.order
      });

      const savedList = await list.save({ session });
      savedBoard.lists.push(savedList._id);
    }

    await savedBoard.save({ session });
    workspace.boards.push(savedBoard._id);
    await workspace.save({ session });

    await session.commitTransaction();
    return ApiResponse.success(savedBoard);
  } catch (e) {
    await session.abortTransaction();
    Logger.error(`Error in createBoard: ${e.message}`, e);
    return ApiResponse.fail([new ErrorDetail("Failed to create board")]);
  } finally {
    session.endSession();
  }
};

const updateBoard = async (id, updateData) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.fail([new ErrorDetail("Invalid board ID format")]);
    }

    const updatedBoard = await Board.findByIdAndUpdate(
      id,
      updateData,
      { new: true, session }
    );

    if (!updatedBoard) {
      return ApiResponse.fail([new ErrorDetail("Board not found or update failed")]);
    }

    await session.commitTransaction();
    return ApiResponse.success(updatedBoard);
  } catch (e) {
    await session.abortTransaction();
    Logger.error(`Error in updateBoard: ${e.message}`, e);
    return ApiResponse.fail([new ErrorDetail("Failed to update board")]);
  } finally {
    session.endSession();
  }
};

const deleteBoard = async (boardId, deletionId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return ApiResponse.fail([new ErrorDetail("Invalid board ID format")]);
    }

    deletionId = deletionId || uuidv4();

    const board = await Board.findById(boardId).session(session);
    if (!board) {
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    const deletedBoard = await Board.findByIdAndUpdate(
      boardId,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletionId: deletionId,
      },
      { session }
    );

    // Delete related entities
    await Promise.all([
      listService.deleteListsByBoard(boardId, deletionId),
      taskService.deleteTaskByBoard(boardId, deletionId),
      taskStatusService.deleteTaskStatusesByBoard(boardId, deletionId)
    ]);

    await session.commitTransaction();

    Logger.info(`Board ${boardId} removed with deletion ID: ${deletionId}`);
    return ApiResponse.success(deletedBoard);
  } catch (e) {
    await session.abortTransaction();
    Logger.error(`Error in deleteBoard: ${e.message}`, e);
    return ApiResponse.fail([new ErrorDetail("Failed to delete board")]);
  } finally {
    session.endSession();
  }
};

const addMemberToBoard = async (boardId, userData) => {
  try {
    const board = await Board.findOne(withBaseQuery({ _id: boardId }));

    if (!board) {
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    const user = await userService.getUserById(userData.userId).data || {};

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

    const user = await userService.getUserById(userId).data || {};

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

/**
 * Fix TaskStatus-List links for a board
 * @param {string} boardId - Board ID to fix
 */
const fixBoardTaskStatusLinks = async (boardId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return ApiResponse.fail([new ErrorDetail("Invalid board ID format")]);
    }

    const result = await taskStatusService.fixTaskStatusListLinks(boardId);
    return result;
  } catch (error) {
    Logger.error(`Error fixing board task status links: ${error.message}`, error);
    return ApiResponse.fail([new ErrorDetail("Failed to fix board task status links")]);
  }
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
  fixBoardTaskStatusLinks,
};
