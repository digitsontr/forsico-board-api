const Joi = require("joi");

const createValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
  boardId: Joi.string().required().min(24).max(24),
});

const updateValidation = Joi.object({
  listid: Joi.string().required().min(24).max(24),
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const getByIdValidation = Joi.object({
  listid: Joi.string().required().min(24).max(24),
});

const deleteValidation = Joi.object({
  listid: Joi.string().required().min(24).max(24),
});

module.exports = {
  createValidation,
  getByIdValidation,
  deleteValidation,
  updateValidation,
};
