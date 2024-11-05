const List = require("../models/list");
const Board = require("../models/board");
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

const createList = async (listData, workspaceId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const board = await Board.findById(listData.boardId);

    if (!board) {
      throw new Error("Board not found");
    }

    const maxOrderList = await List.findOne({
      boardId: listData.boardId,
    })
      .sort({
        order: -1,
      })
      .exec();
    const nextOrder = maxOrderList ? maxOrderList.order + 1 : 1;

    const listModel = new List({
      name: listData.name,
      boardId: listData.boardId,
      color: listData.color,
      workspaceId: workspaceId,
      order: nextOrder,
    });

    const savedList = await listModel.save({
      session,
    });

    board.lists = board.lists || [];
    board.lists.push(savedList._id);
    await board.save({
      session,
    });

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
          {
            order: -1,
          },
          {
            session,
          }
        );

        await List.findByIdAndUpdate(
          id,
          {
            ...updateData,
            order: updateData.order,
          },
          {
            session,
            new: true,
          }
        );

        await List.findByIdAndUpdate(
          conflictingList._id,
          {
            order: listToUpdate.order,
          },
          {
            session,
          }
        );
      } else {
        await List.findByIdAndUpdate(id, updateData, {
          session,
          new: true,
        });
      }
    } else {
      await List.findByIdAndUpdate(id, updateData, {
        session,
        new: true,
      });
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

    return ApiResponse.success(updatedList);
  } catch (e) {
    Logger.log({
      level: "error",
      message: `Error deleting list: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to delete list")]);
  }
};

const updateMultipleListOrders = async (updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updatedLists = [];
    for (const { listId, order } of updateData.orderUpdates) {
      const list = await List.findById(listId).session(session);

      if (!list) {
        throw new Error(`List with ID ${listId} not found`);
      }

      let updatedList = await List.findByIdAndUpdate(
        listId,
        {
          order,
        },
        {
          session,
          new: true,
        }
      );

      updatedLists.push(updatedList);
    }

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(updatedLists);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    Logger.log({
      level: "error",
      message: `Error updating list orders: ${e.message}`,
    });
    return ApiResponse.fail([new ErrorDetail("Failed to update list orders")]);
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
