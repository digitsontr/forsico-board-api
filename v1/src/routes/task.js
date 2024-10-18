const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/task");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissions = require("../scripts/helpers/permissions");
const {
  getTasksOfBoard,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require("../controllers/task");

router.get(
  "/getTasksOfBoard/:boardId",
  verifyWorkspace(),
  authorize(),
  validate(validations.getTasksOfBoardValidation),
  getTasksOfBoard
);

router.get(
  "/:taskId",
  validate(validations.getTaskByIdValidation),
  authorize(),
  getTaskById
);

router.post(
  "/",
  verifyWorkspace(),
  validate(validations.createTaskValidation),
  authorize(),
  createTask
);

router.put(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.updateTaskValidation),
  authorize(permissions.CAN_UPDATE_TASK),
  updateTask
);

router.patch(
  "/updateStatus/:taskId",
  validate(validations.updateTaskStatusValidation),
  authorize(),
  updateTaskStatus
);

router.delete(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.deleteTaskValidation),
  authorize(permissions.CAN_DELETE_TASK),
  deleteTask
);

module.exports = router;
