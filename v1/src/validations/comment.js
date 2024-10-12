const Joi = require("joi");

const createCommentValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  content: Joi.string().required().min(1),
  fileUrls: Joi.array().items(Joi.string()).optional()
});

const getCommentsForTaskValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
});

const getCommentByIdValidation = Joi.object({
  commentId: Joi.string().required().min(24).max(24),
});

const updateCommentValidation = Joi.object({
  commentId: Joi.string().required().min(24).max(24),
  content: Joi.string().required().min(1),
  fileUrls: Joi.array().items(Joi.string()).optional()
});

const deleteCommentValidation = Joi.object({
  commentId: Joi.string().required().min(24).max(24)
});

module.exports = {
  createCommentValidation,
  getCommentsForTaskValidation,
  getCommentByIdValidation,
  updateCommentValidation,
  deleteCommentValidation,
};
