const Joi = require("joi");
const { WorkspaceProgressState } = require("../models/workspace");

const createValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const updateValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const addMemberToWorkspaceValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  profilePicture: Joi.string().optional(),
});

const removeMemberFromWorkspaceValidation = Joi.object({
  userId: Joi.string().required().min(36).max(36),
});

const updateReadyStatusValidation = Joi.object({
  isReady: Joi.boolean().required()
});

const updateProgressValidation = Joi.object({
  state: Joi.string()
    .valid(...Object.values(WorkspaceProgressState))
    .required()
    .messages({
      'any.only': 'Invalid progress state',
      'any.required': 'Progress state is required'
    })
});

const getProgressValidation = Joi.object({
  workspaceId: Joi.string()
    .required()
    .min(24)
    .max(24)
    .messages({
      'string.length': 'Invalid workspace ID format',
      'any.required': 'Workspace ID is required'
    })
});

module.exports = {
  createValidation,
  updateValidation,
  addMemberToWorkspaceValidation,
  removeMemberFromWorkspaceValidation,
  updateReadyStatusValidation,
  updateProgressValidation,
  getProgressValidation
};
