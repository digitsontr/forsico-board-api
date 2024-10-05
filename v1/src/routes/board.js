const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/board");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissons = require("../scripts/helpers/permissons");
const {
  getBoardsOfWorkspace,
  getBoardById,
  createBoard,
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
  "/:boardid",
  validate(validations.getByIdValidation),
  authorize(),
  getBoardById
);

router
  .route("/")
  .post(
    verifyWorkspace(),
    validate(validations.createValidation),
    authorize(),
    createBoard
  );

router.put(
  "/:boardid",
  verifyWorkspace(),
  validate(validations.updateValidation),
  authorize(permissons.CAN_UPDATE_BOARD),
  updateBoard
);

router.delete(
  "/:boardid",
  verifyWorkspace(),
  validate(validations.deleteValidation),
  authorize(permissons.CAN_DELETE_BOARD),
  deleteBoard
);

router
  .route("/addMemberToBoard/:boardid")
  .post(
    verifyWorkspace(),
    validate(validations.addMemberToBoardValidation),
    authorize(),
    addMemberToBoard
  );

module.exports = router;
