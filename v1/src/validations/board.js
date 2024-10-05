const Joi = require("joi");

const createValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const updateValidation = Joi.object({
  boardid: Joi.string().required().min(24).max(24),
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const getByIdValidation = Joi.object({
  boardid: Joi.string().required().min(24).max(24),
});

const deleteValidation = Joi.object({
  boardid: Joi.string().required().min(24).max(24),
});

const addMemberToBoardValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
  boardid: Joi.string().required().min(24).max(24)
});

module.exports = {
  createValidation,
  getByIdValidation,
  deleteValidation,
  updateValidation,
  addMemberToBoardValidation
};
