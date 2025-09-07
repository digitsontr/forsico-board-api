const Joi = require("joi");

const getUserRolesValidation = Joi.object({
  params: Joi.object({
    userId: Joi.string().required(),
    subscriptionId: Joi.string().required()
  })
});

const assignWorkspaceRoleValidation = Joi.object({
  body: Joi.object({
    userId: Joi.string().required(),
    subscriptionId: Joi.string().required(),
    workspaceId: Joi.string().required(),
    roleTemplateId: Joi.string().required(),
    roleTemplateType: Joi.string().valid('RoleTemplate', 'SystemRoleTemplate').default('RoleTemplate')
  })
});

const assignBoardRoleValidation = Joi.object({
  body: Joi.object({
    userId: Joi.string().required(),
    subscriptionId: Joi.string().required(),
    workspaceId: Joi.string().required(),
    boardId: Joi.string().required(),
    roleTemplateId: Joi.string().required(),
    roleTemplateType: Joi.string().valid('RoleTemplate', 'SystemRoleTemplate').default('RoleTemplate')
  })
});

const removeRoleValidation = Joi.object({
  body: Joi.object({
    userId: Joi.string().required(),
    subscriptionId: Joi.string().required(),
    roleTemplateId: Joi.string().required(),
    scopeId: Joi.string().optional()
  })
});

const checkPermissionValidation = Joi.object({
  body: Joi.object({
    userId: Joi.string().optional(),
    subscriptionId: Joi.string().required(),
    requiredPermission: Joi.string().required(),
    scopeType: Joi.string().valid('subscription', 'workspace', 'board').required(),
    scopeId: Joi.string().optional(),
    workspaceId: Joi.string().optional(),
    boardId: Joi.string().optional()
  })
});

module.exports = {
  getUserRolesValidation,
  assignWorkspaceRoleValidation,
  assignBoardRoleValidation,
  removeRoleValidation,
  checkPermissionValidation
};
