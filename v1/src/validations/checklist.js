const Joi = require("joi");

const createChecklistValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  items: Joi.array().items(
    Joi.object({
      title: Joi.string().required().min(1),
      isDone: Joi.boolean().optional(),
    })
  ),
});

const addChecklistItemValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  title: Joi.string().required().min(1),
  checklistId: Joi.string().required().min(24).max(24),
});

const updateChecklistItemValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  itemId: Joi.string().required().min(24).max(24),
  checklistId: Joi.string().required().min(24).max(24),
  title: Joi.string().optional().min(1),
  isDone: Joi.boolean().optional(),
});

const getChecklistByIdValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
});

const deleteChecklistItemValidation = Joi.object({
  taskId: Joi.string().required().min(24).max(24),
  itemId: Joi.string().required().min(24).max(24),
  checklistId: Joi.string().required().min(24).max(24),
});

module.exports = {
  createChecklistValidation,
  addChecklistItemValidation,
  updateChecklistItemValidation,
  getChecklistByIdValidation,
  deleteChecklistItemValidation,
};
