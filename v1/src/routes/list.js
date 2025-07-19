const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/list");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const permissons = require("../scripts/helpers/permissions");
const {
  getListsOfBoard,
  getListById,
  createList,
  updateList,
  deleteList,
  updateMultipleListOrders
} = require("../controllers/list");

router.get("/getlistsofboard/:boardId", authorize(), getListsOfBoard);

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
  authorize(),
  updateList
);

router.delete(
  "/:listid",
  validate(validations.deleteValidation),
  verifyWorkspace(),
  authorize(),
  deleteList
);

router.patch(
  "/updateListOrders/:boardId",
  validate(validations.updateOrderValidation),
  verifyWorkspace(),
  authorize(),
  updateMultipleListOrders
);

module.exports = router;
