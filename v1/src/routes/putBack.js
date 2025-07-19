const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const validations = require("../validations/putBack");
const { putBack } = require("../controllers/putBack");

router.patch(
  "/:deletionId",
  validate(validations.putBackValidation),
  verifyWorkspace(),
  authorize(),
  putBack
);

module.exports = router;
