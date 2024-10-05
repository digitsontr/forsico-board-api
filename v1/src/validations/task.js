const Joi = require("joi");

const createTaskValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string().optional(),
  board_id: Joi.string().required().min(24).max(24),
  assignee: Joi.string().optional().min(36).max(36),
  due_date: Joi.date().optional(),
  owner_id: Joi.string().required().min(36).max(36),
  priority: Joi.number().optional().min(0).max(5),
  entrance_date: Joi.date().optional(),
  parent_task: Joi.string().optional().min(24).max(24),
  list_id: Joi.string().optional().min(24).max(24),
});

const updateTaskValidation = Joi.object({
  taskid: Joi.string().required().min(24).max(24), 
  name: Joi.string().optional().min(3),
  description: Joi.string().optional(),
  assignee: Joi.string().optional().min(24).max(24),
  due_date: Joi.date().optional(),
  priority: Joi.number().optional().min(0).max(5),
});

const getTasksOfBoardValidation = Joi.object({
  boardid: Joi.string().required().min(24).max(24),
})

const getTaskByIdValidation = Joi.object({
  taskid: Joi.string().required().min(24).max(24),
});

const deleteTaskValidation = Joi.object({
  taskid: Joi.string().required().min(24).max(24),
});

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  getTaskByIdValidation,
  deleteTaskValidation,
  getTasksOfBoardValidation
};
