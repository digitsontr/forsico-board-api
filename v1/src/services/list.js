const List = require("../models/list");
const Board = require("../models/board");
const User = require("../models/user");
const TaskStatus = require("../models/taskStatus");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const Logger = require("../scripts/logger/list");
const ExceptionLogger = require("../scripts/logger/exception");
const taskService = require("./task");
const { v4: uuidv4 } = require("uuid");

const getListsOfBoard = async (boardId) => {
  try {
    const lists = await List.find({
      boardId: boardId,
      isDeleted: false,
    }).sort({ order: 1 });
    return ApiResponse.success(lists);
  } catch (e) {
    Logger.log({
      level: "error",
      message: `Error retrieving lists: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve lists")]);
  }
};

const getListById = async (id) => {
  try {
    const list = await List.findById(id).sort({ order: 1 });
    if (!list) {
      return ApiResponse.fail([new ErrorDetail("List not found")]);
    }
    return ApiResponse.success(list);
  } catch (e) {
    Logger.log({
      level: "error",
      message: `Error retrieving list: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve list")]);
  }
};

const createList = async (listData, workspaceId, ownerId) => {
  const user = await User.findOne(
    { id: ownerId },
    "_id id firstName lastName profilePicture"
  );
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const board = await Board.findById(listData.boardId);

    if (!board) {
      throw new Error("Board not found");
    }

    const maxOrderList = await List.findOne({ boardId: listData.boardId })
      .sort({ order: -1 })
      .exec();
    const nextOrder = maxOrderList ? maxOrderList.order + 1 : 1;

    const listModel = new List({
      name: listData.name,
      boardId: listData.boardId,
      color: listData.color,
      workspaceId: workspaceId,
      order: nextOrder,
    });

    const savedList = await listModel.save({ session });

    board.lists = board.lists || [];
    board.lists.push(savedList._id);
    await board.save({ session });

    const taskStatus = new TaskStatus({
      name: listData.name,    
      color: listData.color || "#f2f2f2",
      boardId: listData.boardId,
      workspaceId: workspaceId,
      createdBy: user._id,
      listId: savedList._id,       
    });

    await taskStatus.save({ session });

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(savedList);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    Logger.log({
      level: "error",
      message: `Error creating list: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to create list")]);
  }
};

const updateList = async (id, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const listToUpdate = await List.findById(id);
    if (!listToUpdate) {
      return ApiResponse.fail([new ErrorDetail("List not found")]);
    }

    if (updateData.order && updateData.order !== listToUpdate.order) {
      const conflictingList = await List.findOne({
        boardId: listToUpdate.boardId,
        order: updateData.order,
      });

      if (conflictingList) {
        await List.findByIdAndUpdate(
          conflictingList._id,
          { order: listToUpdate.order },
          { session }
        );

        const updatedList = await List.findByIdAndUpdate(
          id,
          { ...updateData },
          { session, new: true }
        );

        await session.commitTransaction();
        session.endSession();

        return ApiResponse.success(updatedList);
      }
    }

    const updatedList = await List.findByIdAndUpdate(
      id,
      updateData,
      { session, new: true }
    );

    // Sync with related TaskStatus if name or color changed
    if (updateData.name || updateData.color) {
      try {
        const syncData = {};
        if (updateData.name) syncData.name = updateData.name;
        if (updateData.color) syncData.color = updateData.color;

        await TaskStatus.findOneAndUpdate(
          { listId: id },
          syncData,
          { session }
        );
        Logger.log({
          level: "info",
          message: `Synced TaskStatus with List ${id}`
        });
      } catch (syncError) {
        Logger.log({
          level: "warn",
          message: `Failed to sync TaskStatus with List: ${syncError.message}`
        });
        // Don't fail the main operation if sync fails
      }
    }

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(updatedList);

  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    Logger.log({
      level: "error",
      message: `Error updating list: ${e.message}`,
      error: e.stack
    });
    return ApiResponse.fail([new ErrorDetail("Failed to update list")]);
  }
};

const deleteList = async (listId, deletionId) => {
  try {
    if (!deletionId) {
      await taskService.moveTasksToFirstList(listId);
    }

    deletionId = deletionId || uuidv4();

    Logger.log("info", `LIST ${listId} REMOVED DELETION ID: ${deletionId}`);

    const updatedList = await List.findByIdAndUpdate(
      listId,
      {
        isDeleted: true,
        order: null,
        deletedAt: new Date(),
        deletionId: deletionId,
      },
      {
        new: true,
      }
    );

    // Sync with related TaskStatus
    try {
      await TaskStatus.findOneAndUpdate(
        { listId: listId },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletionId: deletionId,
        }
      );
      Logger.log({
        level: "info",
        message: `Synced TaskStatus deletion with List ${listId}`
      });
    } catch (syncError) {
      Logger.log({
        level: "warn",
        message: `Failed to sync TaskStatus deletion with List: ${syncError.message}`
      });
      // Don't fail the main operation if sync fails
    }

    return ApiResponse.success(updatedList);
  } catch (e) {
    Logger.log({
      level: "error",
      message: `Error deleting list: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to delete list")]);
  }
};

const updateMultipleListOrders = async ({ orderUpdates, boardId }) => {
  let session;
  try {
    // Start session
    session = await mongoose.startSession();
    session.startTransaction();

    // Validate board exists
    const board = await Board.findById(boardId).session(session);
    if (!board) {
      console.error("Board not found", boardId);
      return ApiResponse.fail([new ErrorDetail("Board not found")]);
    }

    // Get all affected lists in one query - with session
    const listIds = orderUpdates.map(update => update.listId);
    const existingLists = await List.find({ 
      _id: { $in: listIds },
      boardId: boardId,
      isDeleted: false 
    }).session(session);

    // Validate all lists exist and belong to the board
    if (existingLists.length !== listIds.length) {
      return ApiResponse.fail([new ErrorDetail("One or more lists not found")]);
    }

    // Validate no duplicate orders
    const orders = orderUpdates.map(u => u.order);
    if (new Set(orders).size !== orders.length) {
      return ApiResponse.fail([new ErrorDetail("Duplicate order values not allowed")]);
    }

    // Perform updates sequentially within the transaction
    const updatedLists = [];
    for (const update of orderUpdates) {
      const updatedList = await List.findByIdAndUpdate(
        update.listId,
        { order: update.order },
        { 
          session,
          new: true,
          runValidators: true
        }
      );
      updatedLists.push(updatedList);
    }

    // Commit the transaction
    await session.commitTransaction();
    
    return ApiResponse.success(updatedLists);

  } catch (e) {
    // Proper error handling and logging
    Logger.log({
      level: "error",
      message: `Error updating list orders: ${e.message}`,
      error: e.stack,
      data: { orderUpdates, boardId }
    });

    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        Logger.log({
          level: "error",
          message: "Error aborting transaction",
          error: abortError.stack
        });
      }
    }

    return ApiResponse.fail([new ErrorDetail("Failed to update list orders")]);
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch (endError) {
        Logger.log({
          level: "error",
          message: "Error ending session",
          error: endError.stack
        });
      }
    }
  }
};

const deleteListsByBoard = async (boardId, deletionId) => {
  Logger.log(
    "info",
    "LIST REMOVE OPERATION STARTED DELETION ID: " + deletionId
  );

  const lists = await List.find({
    boardId,
  });
  const results = await Promise.allSettled(
    lists.map(async (list) => {
      await deleteList(list._id, deletionId);
    })
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      Logger.log(
        "error",
        `List ${lists[index]._id} can't be removed:`,
        result.reason
      );
    }
  });

  Logger.log("info", "LIST REMOVE OPERATION STARTED ENDEN ID: " + deletionId);

  return true;
};

module.exports = {
  getListsOfBoard,
  getListById,
  createList,
  updateList,
  deleteList,
  deleteListsByBoard,
  updateMultipleListOrders,
};
