const Joi = require("joi");

const createTaskValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string().optional(),
  boardId: Joi.string().required().min(24).max(24),
  assignee: Joi.string().optional().min(36).max(36),
  dueDate: Joi.date().optional(),
  ownerId: Joi.string().required().min(36).max(36),
  priority: Joi.number().optional().min(0).max(5),
  entranceDate: Joi.date().optional(),
  parentTask: Joi.string().optional().min(24).max(24),
  listId: Joi.string().optional().min(24).max(24),
  members: Joi.array().items(Joi.string().required().min(24).max(24)),
});

const updateTaskValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  name: Joi.string().optional().min(3),
  description: Joi.string().optional(),
  assignee: Joi.string().optional().min(24).max(24),
  dueDate: Joi.date().optional(),
  priority: Joi.number().optional().min(0).max(5),
  statusId: Joi.string().optional().min(24).max(24),
  listId: Joi.string().optional().min(24).max(24),
  members: Joi.array().items(Joi.string().required().min(24).max(24)),
});

const updateTaskStatusValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  statusId: Joi.string().required().min(24).max(24),
});

const getTasksOfBoardValidation = Joi.object({
  boardId: Joi.string().required().min(24).max(24),
});

const getTaskByIdValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
});

const deleteTaskValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
});

const searchTaskValidation = Joi.object({
  query: Joi.string().required().min(3),
  page: Joi.number().optional().min(1),
  limit: Joi.number().optional().min(10),
  workspaceIds: Joi.array().items(Joi.string().required().min(24).max(24)),
});

const addMemberToTaskValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
  taskId: Joi.string().required().min(24).max(24)
});

const removeMemberFromTaskValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
  taskId: Joi.string().required().min(24).max(24)
});

const changeAssigneeValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  newAssigneeId: Joi.string().required().min(36).max(36),
});

const changeBoardValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  newBoardId: Joi.string().required().min(24).max(24),
  newListId: Joi.string().required().min(24).max(24),
});

module.exports = {
  createTaskValidation,
  updateTaskValidation,
  getTaskByIdValidation,
  deleteTaskValidation,
  getTasksOfBoardValidation,
  updateTaskStatusValidation,
  searchTaskValidation,
  addMemberToTaskValidation,
  removeMemberFromTaskValidation,
  changeAssigneeValidation,
  changeBoardValidation
};
