const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/list");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissons = require("../scripts/helpers/permissons");
const {
  getListsOfBoard,
  getListById,
  createList,
  updateList,
  deleteList,
} = require("../controllers/list");

router.get("/getlistsofboard/:boardid", authorize(), getListsOfBoard);

router.get(
  "/:listid",
  validate(validations.getByIdValidation),
  verifyWorkspace(),
  authorize(),
  getListById
);

router
  .route("/")
  .post(
    validate(validations.createValidation),
    verifyWorkspace(),
    authorize(),
    createList
  );

router.put(
  "/:listid",
  validate(validations.updateValidation),
  verifyWorkspace(),
  authorize(permissons.CAN_UPDATE_LIST),
  updateList
);

router.delete(
  "/:listid",
  validate(validations.deleteValidation),
  verifyWorkspace(),
  authorize(permissons.CAN_DELETE_LIST),
  deleteList
);

module.exports = router;
