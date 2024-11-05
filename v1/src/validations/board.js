const Joi = require("joi");

const createValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const updateValidation = Joi.object({
  boardId: Joi.string().required().min(24).max(24),
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const getByIdValidation = Joi.object({
  boardId: Joi.string().required().min(24).max(24),
});

const deleteValidation = Joi.object({
  boardId: Joi.string().required().min(24).max(24),
});

const addMemberToBoardValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
  boardId: Joi.string().required().min(24).max(24)
});

const removeMemberFromBoardValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
  boardId: Joi.string().required().min(24).max(24)
});

module.exports = {
  createValidation,
  getByIdValidation,
  deleteValidation,
  updateValidation,
  addMemberToBoardValidation,
  removeMemberFromBoardValidation
};
