const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/board");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const { requirePermission } = require("../middlewares/permission");
const { BOARD_PERMISSIONS, WORKSPACE_PERMISSIONS, SCOPE_TYPES } = require("../constants/permissions");
const permissons = require("../scripts/helpers/permissions");
const {
  getBoardsOfWorkspace,
  getBoardById,
  createBoard,
  getBoardMembers,
  updateBoard,
  deleteBoard,
  addMemberToBoard,
  removeMemberFromBoard
} = require("../controllers/board");

// Get all boards in a workspace
router.get(
  "/getboardsofworkspace/",
  verifyWorkspace(),
  authorize(),
  //requirePermission(WORKSPACE_PERMISSIONS.BOARDS.VIEW, SCOPE_TYPES.WORKSPACE),
  getBoardsOfWorkspace
);

// Get specific board by ID
router.get(
  "/:boardId",
  validate(validations.getByIdValidation),
  authorize(),
  //requirePermission(BOARD_PERMISSIONS.VIEW, SCOPE_TYPES.BOARD),
  getBoardById
);

// Get board members
router.get(
  "/:boardId/members",
  validate(validations.getByIdValidation),
  authorize(),
  //requirePermission(BOARD_PERMISSIONS.MEMBERS.VIEW, SCOPE_TYPES.BOARD),
  getBoardMembers
);

// Create new board
router
  .route("/")
  .post(
    verifyWorkspace(),
    validate(validations.createValidation),
    authorize(),
    //requirePermission(WORKSPACE_PERMISSIONS.BOARDS.CREATE, SCOPE_TYPES.WORKSPACE),
    createBoard
  );

// Update board
router.put(
  "/:boardId",
  verifyWorkspace(),
  validate(validations.updateValidation),
  authorize(),
  //requirePermission(BOARD_PERMISSIONS.UPDATE, SCOPE_TYPES.BOARD),
  updateBoard
);

// Delete board
router.delete(
  "/:boardId",
  verifyWorkspace(),
  validate(validations.deleteValidation),
  authorize(),
  //requirePermission(BOARD_PERMISSIONS.DELETE, SCOPE_TYPES.BOARD),
  deleteBoard
);

// Add member to board
router
  .route("/addMemberToBoard/:boardId")
  .post(
    verifyWorkspace(),
    validate(validations.addMemberToBoardValidation),
    authorize(),
    //requirePermission(BOARD_PERMISSIONS.MEMBERS.ADD, SCOPE_TYPES.BOARD),
    addMemberToBoard
  );

// Remove member from board
router
  .route("/removeMemberFromBoard/:boardId")
  .delete(
    verifyWorkspace(),
    validate(validations.removeMemberFromBoardValidation),
    authorize(),
    //requirePermission(BOARD_PERMISSIONS.MEMBERS.REMOVE, SCOPE_TYPES.BOARD),
    removeMemberFromBoard
  );

module.exports = router;
