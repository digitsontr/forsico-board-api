const Workspace = require("../models/workspace");
const Board = require("../models/board");
const List = require("../models/list");
const Task = require("../models/task");
const TaskStatus = require("../models/taskStatus");
const Comment = require("../models/comment");
const Checklist = require("../models/checklist");
const Logger = require("../scripts/logger/hardDelete");
const { moveTasksToFirstList } = require("../services/task");

const THRESHOLD_DATE = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
const hardDelete = async () => {
  try {
    Logger.log("info", "Starting hard delete process...");

    await Promise.allSettled([
      hardDeleteWorkspaces(),
      hardDeleteBoards(),
      hardDeleteLists(),
      hardDeleteTasks(),
      hardDeleteTaskStatuses(),
      hardDeleteComments(),
      hardDeleteChecklists(),
    ]);

    Logger.log("info", "Hard delete process completed.");
  } catch (error) {
    Logger.log("error", `Hard delete process failed: ${error.message}`);
  }
};

const hardDeleteWorkspaces = async () => {
  const workspaces = await Workspace.find({
    deletedAt: { $lte: THRESHOLD_DATE },
  });

  await Promise.all(
    workspaces.map(async (workspace) => {
      try {
        await Workspace.deleteOne({ _id: workspace._id });

        Logger.log("info", `Workspace ${workspace._id} successfully deleted.`);
      } catch (error) {
        Logger.log(
          "error",
          `Failed to hard delete Workspace ${workspace._id}: ${error}`
        );
      }
    })
  );
};

const hardDeleteBoards = async () => {
  const boards = await Board.find({ deletedAt: { $lte: THRESHOLD_DATE } });

  await Promise.all(
    boards.map(async (board) => {
      try {
        const workspaceExists = await Workspace.exists({
          _id: board.workspaceId,
        });

        if (workspaceExists) {
          await Workspace.updateOne(
            { _id: board.workspaceId },
            { $pull: { boards: board._id } }
          );
        } else {
          Logger.log(
            "info",
            `Workspace ${board.workspaceId} not found for Board ${board._id}`
          );
        }

        await Board.deleteOne({ _id: board._id });
      } catch (error) {
        Logger.log(
          "error",
          `Failed to hard delete Board ${board._id}: ${error}`
        );
      }
    })
  );
};

const hardDeleteLists = async () => {
  const lists = await List.find({ deletedAt: { $lte: THRESHOLD_DATE } });

  await Promise.all(
    lists.map(async (list) => {
      try {
        await moveTasksToFirstList(list._id);

        const boardExists = await Board.exists({ _id: list.boardId });

        if (boardExists) {
          await Board.updateOne(
            { _id: list.boardId },
            { $pull: { lists: list._id } }
          );
        } else {
          Logger.log(
            "info",
            `Board ${list.boardId} not found for List ${list._id}`
          );
        }

        await List.deleteOne({ _id: list._id });
      } catch (error) {
        Logger.log("error", `Failed to hard delete List ${list._id}: ${error}`);
      }
    })
  );
};

const hardDeleteTasks = async () => {
  const tasks = await Task.find({ deletedAt: { $lte: THRESHOLD_DATE } });

  await Promise.all(
    tasks.map(async (task) => {
      try {
        const boardExists = await Board.exists({ _id: task.boardId });
        if (boardExists) {
          await Board.updateOne(
            { _id: task.boardId },
            { $pull: { tasks: task._id } }
          );
        }

        const listExists = await List.exists({ _id: task.listId });
        if (listExists) {
          await List.updateOne(
            { _id: task.listId },
            { $pull: { tasks: task._id } }
          );
        }

        if (task.parentTask) {
          await Task.updateOne(
            { _id: task.parentTask },
            { $pull: { subtasks: task._id } }
          );
        }

        await Task.deleteOne({ _id: task._id });
        Logger.log("info", `Task ${task._id} successfully deleted.`);
      } catch (error) {
        Logger.log("error", `Failed to hard delete Task ${task._id}: ${error}`);
      }
    })
  );
};

const hardDeleteTaskStatuses = async () => {
  const statuses = await TaskStatus.find({
    deletedAt: { $lte: THRESHOLD_DATE },
  });

  await Promise.all(
    statuses.map(async (status) => {
      try {
        const boardExists = await Board.exists({ _id: status.boardId });
        if (boardExists) {
          await Board.updateOne(
            { _id: status.boardId },
            { $pull: { taskStatuses: status._id } }
          );
        }

        await TaskStatus.updateMany(
          { allowedTransitions: status._id },
          { $pull: { allowedTransitions: status._id } }
        );

        const firstStatus = await TaskStatus.findOne({
          boardId: status.boardId,
        }).sort({ createdAt: 1 });

        if (firstStatus) {
          await Task.updateMany(
            { statusId: status._id },
            { statusId: firstStatus._id }
          );
        }

        await TaskStatus.deleteOne({ _id: status._id });
        Logger.log("info", `TaskStatus ${status._id} successfully deleted.`);
      } catch (error) {
        Logger.log(
          "error",
          `Failed to hard delete TaskStatus ${status._id}: ${error}`
        );
      }
    })
  );
};

const hardDeleteComments = async () => {
  const comments = await Comment.find({ deletedAt: { $lte: THRESHOLD_DATE } });

  await Promise.all(
    comments.map(async (comment) => {
      try {
        await Task.updateOne(
          { _id: comment.taskId },
          { $pull: { comments: comment._id } }
        );

        await Comment.deleteOne({ _id: comment._id });
      } catch (error) {
        Logger.log(
          "error",
          `Failed to hard delete Comment ${comment._id}: ${error}`
        );
      }
    })
  );
};

const hardDeleteChecklists = async () => {
  const checklists = await Checklist.find({
    deletedAt: { $lte: THRESHOLD_DATE },
  });

  await Promise.all(
    checklists.map(async (checklist) => {
      try {
        await Task.updateOne(
          { _id: checklist.taskId },
          { $pull: { checklists: checklist._id } }
        );

        await Checklist.deleteOne({ _id: checklist._id });
        Logger.log("info", `Checklist ${checklist._id} successfully deleted.`);
      } catch (error) {
        Logger.log(
          "error",
          `Failed to hard delete Checklist ${checklist._id}: ${error}`
        );
      }
    })
  );
};

module.exports = { hardDelete };
