const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/task");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const { requirePermission } = require("../middlewares/permission");
const { BOARD_PERMISSIONS, TASK_PERMISSIONS, SCOPE_TYPES } = require("../constants/permissions");
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
  getUserTasks,
  removeMemberFromTask,
  changeAssignee,
  changeTaskBoard
} = require("../controllers/task");

// Get all tasks in a board
router.get(
  "/getTasksOfBoard/:boardId",
  verifyWorkspace(),
  authorize(),
  validate(validations.getTasksOfBoardValidation),
  //requirePermission(BOARD_PERMISSIONS.TASKS.VIEW, SCOPE_TYPES.BOARD),
  getTasksOfBoard
);

// Get user's tasks across workspace
router.get(
  "/getUserTasks",
  verifyWorkspace(),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.VIEW, SCOPE_TYPES.WORKSPACE),
  getUserTasks
);

// Search tasks
router.get(
  "/search",
  validate(validations.searchTaskValidation),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.VIEW, SCOPE_TYPES.WORKSPACE),
  search
);

// Get specific task by ID
router.get(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.getTaskByIdValidation),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.VIEW, SCOPE_TYPES.BOARD),
  getTaskById
);

// Create new task
router.post(
  "/",
  verifyWorkspace(),
  validate(validations.createTaskValidation),
  authorize(),
  //requirePermission(BOARD_PERMISSIONS.TASKS.CREATE, SCOPE_TYPES.BOARD),
  createTask
);

// Update task
router.put(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.updateTaskValidation),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.UPDATE, SCOPE_TYPES.BOARD),
  updateTask
);

// Update task status
router.patch(
  "/updateStatus/:taskId",
  verifyWorkspace(),
  validate(validations.updateTaskStatusValidation),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.STATUS.UPDATE, SCOPE_TYPES.BOARD),
  updateTaskStatus
);

// Delete task
router.delete(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.deleteTaskValidation),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.DELETE, SCOPE_TYPES.BOARD),
  deleteTask
);

// Add member to task
router
  .route("/addMemberToTask/:taskId")
  .post(
    verifyWorkspace(),
    validate(validations.addMemberToTaskValidation),
    authorize(),
    //requirePermission(TASK_PERMISSIONS.ASSIGN, SCOPE_TYPES.BOARD),
    addMemberToTask
  );

// Change task assignee
router.patch(
  "/changeAssignee/:taskId",
  validate(validations.changeAssigneeValidation),
  authorize(),
  //requirePermission(TASK_PERMISSIONS.ASSIGN, SCOPE_TYPES.BOARD),
  changeAssignee
);

// Remove member from task
router
  .route("/removeMemberFromTask/:taskId")
  .delete(
    verifyWorkspace(),
    validate(validations.removeMemberFromTaskValidation),
    authorize(),
    //requirePermission(TASK_PERMISSIONS.ASSIGN, SCOPE_TYPES.BOARD),
    removeMemberFromTask
  );

// Move task to different board
router.patch(
  "/changeBoard/:taskId",
  verifyWorkspace(),
  authorize(),
  validate(validations.changeBoardValidation),
  //requirePermission(BOARD_PERMISSIONS.TASKS.MOVE, SCOPE_TYPES.BOARD),
  changeTaskBoard
);

module.exports = router;
