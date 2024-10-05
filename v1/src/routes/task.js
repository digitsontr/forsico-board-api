const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/task");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissions = require("../scripts/helpers/permissons");
const {
  getTasksOfBoard,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/task");

router.get(
  "/gettasksofboard/:boardid",
  verifyWorkspace(),
  authorize(),
  validate(validations.getTasksOfBoardValidation),
  getTasksOfBoard
);

router.get(
  "/:taskid",
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
  "/:taskid",
  verifyWorkspace(),
  validate(validations.updateTaskValidation),
  authorize(permissions.CAN_UPDATE_TASK),
  updateTask
);

router.delete(
  "/:taskid",
  verifyWorkspace(),
  validate(validations.deleteTaskValidation),
  authorize(permissions.CAN_DELETE_TASK),
  deleteTask
);

module.exports = router;
