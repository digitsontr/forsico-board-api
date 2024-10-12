const express = require("express");
const multer = require("multer");
const router = express.Router();
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const validations = require("../validations/comment");
const {
  getCommentsForTask,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/comment");

const upload = multer();

router.get(
  "/task/:taskid/comments",
  verifyWorkspace(),
  authorize(),
  validate(validations.getCommentsForTaskValidation),
  getCommentsForTask
);

router.get(
  "/:commentid",
  verifyWorkspace(),
  authorize(),
  validate(validations.getCommentByIdValidation),
  getCommentById
);

router.post(
  "/task/:taskid/comment",
  verifyWorkspace(),
  authorize(),
  upload.array("files"),
  validate(validations.createCommentValidation),
  createComment
);

router.put(
  "/:commentid",
  verifyWorkspace(),
  authorize(),
  upload.array("files"),
  validate(validations.updateCommentValidation),
  updateComment
);

router.delete(
  "/:commentid",
  verifyWorkspace(),
  authorize(),
  validate(validations.deleteCommentValidation),
  deleteComment
);

module.exports = router;
