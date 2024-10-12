const Joi = require("joi");

const createTaskStatusValidation = Joi.object({
  name: Joi.string().required().min(1),
  color: Joi.string()
    .optional()
    .regex(/^#[0-9A-F]{6}$/i),
  boardId: Joi.string().required().min(24).max(24),
  allowedTransitions: Joi.array()
    .items(Joi.string().min(24).max(24))
    .optional(),
  listId: Joi.string().optional().min(24).max(24),
  statusId: Joi.string().optional().min(24).max(24),
});

const updateTaskStatusValidation = Joi.object({
  statusId: Joi.string().required().min(24).max(24),
  name: Joi.string().optional().min(1),
  color: Joi.string()
    .optional()
    .regex(/^#[0-9A-F]{6}$/i),
  allowedTransitions: Joi.array()
    .items(Joi.string().min(24).max(24))
    .optional(),
  listId: Joi.string().optional().min(24).max(24),
});

const getStatusByIdValidation = Joi.object({
  statusId: Joi.string().required().min(24).max(24),
});

const getStatusesOfBoardValidation = Joi.object({
  boardId: Joi.string().required().min(24).max(24),
});

const getDeleteTaskStatusValidation = Joi.object({
  statusId: Joi.string().required().min(24).max(24),
});

module.exports = {
  createTaskStatusValidation,
  updateTaskStatusValidation,
  getStatusByIdValidation,
  getStatusesOfBoardValidation,
  getDeleteTaskStatusValidation,
};
