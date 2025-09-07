const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/roles");
const authorize = require("../middlewares/authorize");
const { requirePermission } = require("../middlewares/permission");
const { WORKSPACE_PERMISSIONS, BOARD_PERMISSIONS, SCOPE_TYPES } = require("../constants/permissions");
const roleServiceClient = require("../services/roleServiceClient");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const Logger = require("../scripts/logger/board");

/**
 * Get user's roles in subscription
 */
router.get(
  "/user/:userId/subscription/:subscriptionId",
  authorize(),
 // requirePermission(WORKSPACE_PERMISSIONS.USERS.VIEW, SCOPE_TYPES.SUBSCRIPTION),
  validate(validations.getUserRolesValidation),
  async (req, res) => {
    try {
      const { userId, subscriptionId } = req.params;
      
      const roles = await roleServiceClient.getUserRoles(
        req.accessToken,
        userId,
        subscriptionId
      );

      Logger.log('info', 'Retrieved user roles', {
        userId,
        subscriptionId,
        roleCount: roles.length,
        requestedBy: req.user.sub
      });

      res.json(ApiResponse.success(roles));
    } catch (error) {
      Logger.log('error', 'Error retrieving user roles', {
        error: error.message,
        userId: req.params.userId,
        subscriptionId: req.params.subscriptionId
      });
      
      res.status(500).json(
        ApiResponse.fail([new ErrorDetail("Failed to retrieve user roles")])
      );
    }
  }
);

/**
 * Assign workspace role to user
 */
router.post(
  "/assign/workspace",
  authorize(),
  //requirePermission(WORKSPACE_PERMISSIONS.USERS.ASSIGN_ROLES, SCOPE_TYPES.WORKSPACE),
  validate(validations.assignWorkspaceRoleValidation),
  async (req, res) => {
    try {
      const { userId, subscriptionId, workspaceId, roleTemplateId, roleTemplateType = 'RoleTemplate' } = req.body;
      
      const roleData = {
        userId,
        subscriptionId,
        roleTemplateId,
        roleTemplateType,
        scopeType: SCOPE_TYPES.WORKSPACE,
        scopeId: workspaceId,
        workspaceId
      };

      const result = await roleServiceClient.assignRole(req.accessToken, roleData);

      if (!result) {
        return res.status(400).json(
          ApiResponse.fail([new ErrorDetail("Failed to assign workspace role")])
        );
      }

      Logger.log('info', 'Workspace role assigned', {
        userId,
        workspaceId,
        roleTemplateId,
        assignedBy: req.user.sub
      });

      res.status(201).json(ApiResponse.success(result));
    } catch (error) {
      Logger.log('error', 'Error assigning workspace role', {
        error: error.message,
        roleData: req.body
      });
      
      res.status(500).json(
        ApiResponse.fail([new ErrorDetail("Failed to assign workspace role")])
      );
    }
  }
);

/**
 * Assign board role to user
 */
router.post(
  "/assign/board",
  authorize(),
  //requirePermission(BOARD_PERMISSIONS.MEMBERS.ASSIGN_ROLES, SCOPE_TYPES.BOARD),
  validate(validations.assignBoardRoleValidation),
  async (req, res) => {
    try {
      const { userId, subscriptionId, workspaceId, boardId, roleTemplateId, roleTemplateType = 'RoleTemplate' } = req.body;
      
      const roleData = {
        userId,
        subscriptionId,
        roleTemplateId,
        roleTemplateType,
        scopeType: SCOPE_TYPES.BOARD,
        scopeId: boardId,
        workspaceId,
        boardId
      };

      const result = await roleServiceClient.assignRole(req.accessToken, roleData);

      if (!result) {
        return res.status(400).json(
          ApiResponse.fail([new ErrorDetail("Failed to assign board role")])
        );
      }

      Logger.log('info', 'Board role assigned', {
        userId,
        boardId,
        workspaceId,
        roleTemplateId,
        assignedBy: req.user.sub
      });

      res.status(201).json(ApiResponse.success(result));
    } catch (error) {
      Logger.log('error', 'Error assigning board role', {
        error: error.message,
        roleData: req.body
      });
      
      res.status(500).json(
        ApiResponse.fail([new ErrorDetail("Failed to assign board role")])
      );
    }
  }
);

/**
 * Remove role from user
 */
router.delete(
  "/remove",
  authorize(),
  //requirePermission(WORKSPACE_PERMISSIONS.USERS.ASSIGN_ROLES, SCOPE_TYPES.WORKSPACE),
  validate(validations.removeRoleValidation),
  async (req, res) => {
    try {
      const { userId, subscriptionId, roleTemplateId, scopeId } = req.body;
      
      const result = await roleServiceClient.removeRole(
        req.accessToken,
        userId,
        subscriptionId,
        roleTemplateId,
        scopeId
      );

      if (!result) {
        return res.status(400).json(
          ApiResponse.fail([new ErrorDetail("Failed to remove role")])
        );
      }

      Logger.log('info', 'Role removed', {
        userId,
        roleTemplateId,
        scopeId,
        removedBy: req.user.sub
      });

      res.json(ApiResponse.success(result));
    } catch (error) {
      Logger.log('error', 'Error removing role', {
        error: error.message,
        roleData: req.body
      });
      
      res.status(500).json(
        ApiResponse.fail([new ErrorDetail("Failed to remove role")])
      );
    }
  }
);

/**
 * Check user permission
 */
router.post(
  "/check-permission",
  authorize(),
  validate(validations.checkPermissionValidation),
  async (req, res) => {
    try {
      const {
        userId = req.user.sub,
        subscriptionId,
        requiredPermission,
        scopeType,
        scopeId,
        workspaceId,
        boardId
      } = req.body;

      const hasPermission = await roleServiceClient.checkPermission({
        token: req.accessToken,
        subscriptionId,
        requiredPermission,
        scopeType,
        scopeId,
        workspaceId,
        boardId
      });

      Logger.log('debug', 'Permission check result', {
        userId,
        requiredPermission,
        scopeType,
        scopeId,
        hasPermission,
        checkedBy: req.user.sub
      });

      res.json(ApiResponse.success({ hasPermission }));
    } catch (error) {
      Logger.log('error', 'Error checking permission', {
        error: error.message,
        permissionData: req.body
      });
      
      res.status(500).json(
        ApiResponse.fail([new ErrorDetail("Failed to check permission")])
      );
    }
  }
);

/**
 * Health check for role service
 */
router.get(
  "/health",
  async (req, res) => {
    try {
      const isHealthy = await roleServiceClient.healthCheck();
      
      if (isHealthy) {
        res.json(ApiResponse.success({ status: 'healthy' }));
      } else {
        res.status(503).json(
          ApiResponse.fail([new ErrorDetail("Role service is unhealthy")])
        );
      }
    } catch (error) {
      Logger.log('error', 'Role service health check failed', {
        error: error.message
      });
      
      res.status(503).json(
        ApiResponse.fail([new ErrorDetail("Role service health check failed")])
      );
    }
  }
);

module.exports = router;
