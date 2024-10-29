const Joi = require("joi");

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


module.exports = {
  createValidation,
  updateValidation,
  addMemberToWorkspaceValidation
};
