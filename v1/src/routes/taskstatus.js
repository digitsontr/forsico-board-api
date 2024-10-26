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
  authorize(),
  updateTaskStatus
);

router.delete(
  "/:statusId",
  verifyWorkspace(),
  validate(validations.getDeleteTaskStatusValidation),
  authorize(),
  deleteTaskStatus
);

module.exports = router;
