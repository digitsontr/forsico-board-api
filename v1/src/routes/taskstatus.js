const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/taskStatus");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissions = require("../scripts/helpers/permissions");
const {
  createTaskStatus,
  getStatusesOfBoard,
  getStatusById,
  updateTaskStatus,
  deleteTaskStatus,
} = require("../controllers/taskStatus");

router.get(
  "/board/:boardId",
  verifyWorkspace(),
  authorize(),
  validate(validations.getStatusesOfBoardValidation),
  getStatusesOfBoard
);

router.get(
  "/:statusId",
  verifyWorkspace(),
  validate(validations.getStatusByIdValidation),
  authorize(),
  getStatusById
);

router.post(
  "/",
  verifyWorkspace(),
  validate(validations.createTaskStatusValidation),
  authorize(),
  createTaskStatus
);

router.put(
  "/:statusId",
  verifyWorkspace(),
  validate(validations.updateTaskStatusValidation),
  authorize(permissions.CAN_UPDATE_TASK_STATUS),
  updateTaskStatus
);

router.delete(
  "/:statusId",
  verifyWorkspace(),
  validate(validations.getDeleteTaskStatusValidation),
  authorize(permissions.CAN_DELETE_TASK_STATUS),
  deleteTaskStatus
);

module.exports = router;
