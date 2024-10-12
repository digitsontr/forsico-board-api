const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/checklist");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const {
  createChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getChecklist
} = require("../controllers/checklist");

router.get(
  "/:taskId",
  verifyWorkspace(),
  validate(validations.getChecklistByIdValidation),
  authorize(),
  getChecklist
);

router.post(
  "/",
  verifyWorkspace(),
  validate(validations.createChecklistValidation),
  authorize(),
  createChecklist
);

router.post(
  "/items",
  verifyWorkspace(),
  validate(validations.addChecklistItemValidation),
  authorize(),
  addChecklistItem
);

router.put(
  "/items",
  verifyWorkspace(),
  validate(validations.updateChecklistItemValidation),
  authorize(),
  updateChecklistItem
);

router.delete(
  "/items",
  verifyWorkspace(),
  validate(validations.deleteChecklistItemValidation),
  authorize(),
  deleteChecklistItem
);

module.exports = router;
