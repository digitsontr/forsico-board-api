const Joi = require("joi");

const createCommentValidation = Joi.object({
  taskid: Joi.string().required(),
  content: Joi.string().required().min(1),
  fileUrls: Joi.array().items(Joi.string()).optional()
});

const getCommentsForTaskValidation = Joi.object({
  taskid: Joi.string().required(),
});

const getCommentByIdValidation = Joi.object({
  commentid: Joi.string().required(),
});

const updateCommentValidation = Joi.object({
  commentid: Joi.string().required(),
  content: Joi.string().required().min(1),
  fileUrls: Joi.array().items(Joi.string()).optional()
});

const deleteCommentValidation = Joi.object({
  commentid: Joi.string().required()
});

module.exports = {
  createCommentValidation,
  getCommentsForTaskValidation,
  getCommentByIdValidation,
  updateCommentValidation,
  deleteCommentValidation,
};
