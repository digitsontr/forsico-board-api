const Joi = require("joi");

const createTaskStatusValidation = Joi.object({
  name: Joi.string().required().min(1),
  color: Joi.string()
    .optional()
    .regex(/^#[0-9A-F]{6}$/i),
  board_id: Joi.string().required().min(24).max(24),
  allowed_transitions: Joi.array()
    .items(Joi.string().min(24).max(24))
    .optional(),
  list_id: Joi.string().optional().min(24).max(24),
  status_id: Joi.string().optional().min(24).max(24),
});

const updateTaskStatusValidation = Joi.object({
  statusid: Joi.string().required().min(24).max(24),
  name: Joi.string().optional().min(1),
  color: Joi.string()
    .optional()
    .regex(/^#[0-9A-F]{6}$/i),
  allowed_transitions: Joi.array()
    .items(Joi.string().min(24).max(24))
    .optional(),
  list_id: Joi.string().optional().min(24).max(24),
});

const getStatusByIdValidation = Joi.object({
  statusid: Joi.string().required().min(24).max(24),
});

const getStatusesOfBoardValidation = Joi.object({
  boardid: Joi.string().required().min(24).max(24),
});

const getDeleteTaskStatusValidation = Joi.object({
  statusid: Joi.string().required().min(24).max(24),
});

module.exports = {
  createTaskStatusValidation,
  updateTaskStatusValidation,
  getStatusByIdValidation,
  getStatusesOfBoardValidation,
  getDeleteTaskStatusValidation,
};
