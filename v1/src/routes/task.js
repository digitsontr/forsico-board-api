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
  search,
  addMemberToTask,
  getUserTasks
} = require("../controllers/task");


router.get(
  "/getTasksOfBoard/:boardId",
  verifyWorkspace(),
  authorize(),
  validate(validations.getTasksOfBoardValidation),
  getTasksOfBoard
);

router.get(
  "/getUserTasks",
  verifyWorkspace(),
  authorize(),
  getUserTasks
);

router.get(
  "/search",
  validate(validations.searchTaskValidation),
  authorize(),
  search
);

router.get(
  "/:taskId",
  verifyWorkspace(),
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
  authorize(),
  updateTask
);

router.patch(
  "/updateStatus/:taskId",
  verifyWorkspace(),
  validate(validations.updateTaskStatusValidation),
  authorize(),
  updateTaskStatus
);

router.delete(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.deleteTaskValidation),
  authorize(),
  deleteTask
);


router
  .route("/addMemberToTask/:taskId")
  .post(
    verifyWorkspace(),
    validate(validations.addMemberToTaskValidation),
    authorize(),
    addMemberToTask
  );


module.exports = router;
