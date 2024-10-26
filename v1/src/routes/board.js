const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/board");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissons = require("../scripts/helpers/permissions");
const {
  getBoardsOfWorkspace,
  getBoardById,
  createBoard,
  getBoardMembers,
  updateBoard,
  deleteBoard,
  addMemberToBoard
} = require("../controllers/board");


router.get(
  "/getboardsofworkspace/",
  verifyWorkspace(),
  authorize(),
  getBoardsOfWorkspace
);

router.get(
  "/:boardId",
  validate(validations.getByIdValidation),
  authorize(),
  getBoardById
);

router.get(
  "/:boardId/members",
  validate(validations.getByIdValidation),
  authorize(),
  getBoardMembers
);

router
  .route("/")
  .post(
    verifyWorkspace(),
    validate(validations.createValidation),
    authorize("CAN_CREATE_BOARD"),
    createBoard
  );

router.put(
  "/:boardId",
  verifyWorkspace(),
  validate(validations.updateValidation),
  authorize(),
  updateBoard
);

router.delete(
  "/:boardId",
  verifyWorkspace(),
  validate(validations.deleteValidation),
  authorize(),
  deleteBoard
);

router
  .route("/addMemberToBoard/:boardId")
  .post(
    verifyWorkspace(),
    validate(validations.addMemberToBoardValidation),
    authorize(),
    addMemberToBoard
  );

module.exports = router;
