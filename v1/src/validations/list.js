const Joi = require("joi");

const orderUpdateSchema = Joi.object({
  listId: Joi.string().required(),
  order: Joi.number().integer().min(1).required(),
});

const updateOrderValidation = Joi.object({
  orderUpdates: Joi.array().items(orderUpdateSchema).required(),
  boardId: Joi.string().required().min(24).max(24),
});

const createValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
  boardId: Joi.string().required().min(24).max(24),
  color: Joi.string()
    .optional()
    .regex(/^#[0-9A-F]{6}$/i),
});

const updateValidation = Joi.object({
  listid: Joi.string().required().min(24).max(24),
  name: Joi.string().required().min(3),
  description: Joi.string(),
  color: Joi.string()
    .optional()
    .regex(/^#[0-9A-F]{6}$/i),
  order: Joi.number().optional(),
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
  updateOrderValidation
};
