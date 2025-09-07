const roleServiceClient = require('../services/roleServiceClient');
const { ApiResponse, ErrorDetail } = require('../models/apiResponse');
const { FORBIDDEN, UNAUTHORIZED } = require('http-status');
const { SCOPE_TYPES, PermissionHelpers } = require('../constants/permissions');
const Logger = require('../scripts/logger/board');

/**
 * Permission middleware factory
 * Creates middleware that checks if user has required permission in specified scope
 * 
 * @param {string} requiredPermission - Permission to check (e.g., 'BOARD.VIEW')
 * @param {string} [scopeType='board'] - Scope type ('subscription', 'workspace', 'board')
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.failSafe=true] - If true, allows access when role service is unavailable
 * @param {string} [options.roleTemplateType='RoleTemplate'] - Role template type to check
 * @returns {Function} Express middleware function
 */
const requirePermission = (requiredPermission, scopeType = SCOPE_TYPES.BOARD, options = {}) => {
  const {
    failSafe = true,
    roleTemplateType = 'RoleTemplate'
  } = options;

  return async (req, res, next) => {
    try {
      // Extract required data from request
      const token = req.accessToken;
      const userId = req.user?.sub;
      const subscriptionId = req.headers['x-subscription-id'] || req.subscriptionId;
      const workspaceId = req.headers['x-workspace-id'] || req.workspaceId;
      
      // Validate required parameters
      if (!token) {
        Logger.log('warn', 'Permission check failed: No access token', {
          path: req.path,
          method: req.method,
          requiredPermission
        });
        return res.status(UNAUTHORIZED).json(
          ApiResponse.fail([new ErrorDetail('Access token is required')])
        );
      }

      if (!userId) {
        Logger.log('warn', 'Permission check failed: No user ID', {
          path: req.path,
          method: req.method,
          requiredPermission
        });
        return res.status(UNAUTHORIZED).json(
          ApiResponse.fail([new ErrorDetail('User authentication required')])
        );
      }

      if (!subscriptionId) {
        Logger.log('warn', 'Permission check failed: No subscription ID', {
          path: req.path,
          method: req.method,
          requiredPermission
        });
        return res.status(FORBIDDEN).json(
          ApiResponse.fail([new ErrorDetail('Subscription ID is required')])
        );
      }

      // Determine scope ID based on scope type and request parameters
      let scopeId = null;
      let boardId = null;

      switch (scopeType) {
        case SCOPE_TYPES.SUBSCRIPTION:
          // No scope ID needed for subscription level
          break;
          
        case SCOPE_TYPES.WORKSPACE:
          scopeId = workspaceId;
          if (!scopeId) {
            Logger.log('warn', 'Permission check failed: No workspace ID for workspace scope', {
              path: req.path,
              method: req.method,
              requiredPermission
            });
            return res.status(FORBIDDEN).json(
              ApiResponse.fail([new ErrorDetail('Workspace ID is required')])
            );
          }
          break;
          
        case SCOPE_TYPES.BOARD:
          // For board scope, try to get board ID from various sources
          boardId = req.params.boardId || req.params.id || req.body.boardId;
          scopeId = boardId;
          
          if (!scopeId) {
            Logger.log('warn', 'Permission check failed: No board ID for board scope', {
              path: req.path,
              method: req.method,
              requiredPermission,
              params: req.params
            });
            return res.status(FORBIDDEN).json(
              ApiResponse.fail([new ErrorDetail('Board ID is required')])
            );
          }
          
          // For board operations, workspace ID is also required
          if (!workspaceId) {
            Logger.log('warn', 'Permission check failed: No workspace ID for board scope', {
              path: req.path,
              method: req.method,
              requiredPermission
            });
            return res.status(FORBIDDEN).json(
              ApiResponse.fail([new ErrorDetail('Workspace ID is required for board operations')])
            );
          }
          break;
          
        default:
          Logger.log('error', 'Invalid scope type', {
            scopeType,
            requiredPermission,
            path: req.path
          });
          return res.status(FORBIDDEN).json(
            ApiResponse.fail([new ErrorDetail('Invalid scope type')])
          );
      }

      // Check permission with role service
      try {
        const hasPermission = await roleServiceClient.checkPermission({
          token,
          subscriptionId,
          requiredPermission,
          scopeType,
          scopeId,
          workspaceId,
          boardId,
          roleTemplateType
        });

        if (!hasPermission) {
          Logger.log('warn', 'Permission denied', {
            userId,
            subscriptionId,
            requiredPermission,
            scopeType,
            scopeId,
            path: req.path,
            method: req.method
          });
          
          return res.status(FORBIDDEN).json(
            ApiResponse.fail([new ErrorDetail(`Missing required permission: ${requiredPermission}`)])
          );
        }

        // Permission granted, add permission info to request for downstream use
        req.permission = {
          granted: true,
          permission: requiredPermission,
          scopeType,
          scopeId,
          workspaceId,
          boardId
        };

        Logger.log('debug', 'Permission granted', {
          userId,
          requiredPermission,
          scopeType,
          scopeId,
          path: req.path
        });

        next();
      } catch (error) {
        Logger.log('error', 'Role service error during permission check', {
          error: error.message,
          userId,
          requiredPermission,
          scopeType,
          scopeId
        });

        if (failSafe) {
          // In fail-safe mode, allow access if role service is unavailable
          Logger.log('warn', 'Allowing access due to role service unavailability (fail-safe mode)', {
            userId,
            requiredPermission,
            path: req.path
          });
          
          req.permission = {
            granted: true,
            permission: requiredPermission,
            scopeType,
            scopeId,
            workspaceId,
            boardId,
            failSafe: true
          };
          
          next();
        } else {
          // In strict mode, deny access if role service is unavailable
          return res.status(FORBIDDEN).json(
            ApiResponse.fail([new ErrorDetail('Permission verification failed')])
          );
        }
      }
    } catch (error) {
      Logger.log('error', 'Unexpected error in permission middleware', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });
      
      return res.status(FORBIDDEN).json(
        ApiResponse.fail([new ErrorDetail('Permission check failed')])
      );
    }
  };
};

/**
 * Middleware to check multiple permissions (user must have at least one)
 * @param {Array<string>} permissions - Array of permissions to check
 * @param {string} [scopeType='board'] - Scope type
 * @param {Object} [options] - Additional options
 * @returns {Function} Express middleware function
 */
const requireAnyPermission = (permissions, scopeType = SCOPE_TYPES.BOARD, options = {}) => {
  return async (req, res, next) => {
    const permissionChecks = permissions.map(permission => 
      new Promise(resolve => {
        const middleware = requirePermission(permission, scopeType, options);
        const mockRes = {
          status: () => ({ json: () => resolve(false) }),
          json: () => resolve(false)
        };
        const mockNext = () => resolve(true);
        
        middleware(req, mockRes, mockNext);
      })
    );

    try {
      const results = await Promise.all(permissionChecks);
      const hasAnyPermission = results.some(result => result === true);

      if (hasAnyPermission) {
        next();
      } else {
        Logger.log('warn', 'None of the required permissions granted', {
          userId: req.user?.sub,
          permissions,
          scopeType,
          path: req.path
        });
        
        return res.status(FORBIDDEN).json(
          ApiResponse.fail([new ErrorDetail(`Missing required permissions: ${permissions.join(' or ')}`)])
        );
      }
    } catch (error) {
      Logger.log('error', 'Error in requireAnyPermission middleware', {
        error: error.message,
        permissions,
        path: req.path
      });
      
      return res.status(FORBIDDEN).json(
        ApiResponse.fail([new ErrorDetail('Permission check failed')])
      );
    }
  };
};

/**
 * Middleware to check if user has all specified permissions
 * @param {Array<string>} permissions - Array of permissions to check
 * @param {string} [scopeType='board'] - Scope type
 * @param {Object} [options] - Additional options
 * @returns {Function} Express middleware function
 */
const requireAllPermissions = (permissions, scopeType = SCOPE_TYPES.BOARD, options = {}) => {
  return async (req, res, next) => {
    for (const permission of permissions) {
      try {
        await new Promise((resolve, reject) => {
          const middleware = requirePermission(permission, scopeType, options);
          const mockRes = {
            status: () => ({ json: (data) => reject(new Error(`Permission denied: ${permission}`)) }),
            json: (data) => reject(new Error(`Permission denied: ${permission}`))
          };
          const mockNext = () => resolve();
          
          middleware(req, mockRes, mockNext);
        });
      } catch (error) {
        Logger.log('warn', 'Required permission not granted', {
          userId: req.user?.sub,
          permission,
          scopeType,
          path: req.path
        });
        
        return res.status(FORBIDDEN).json(
          ApiResponse.fail([new ErrorDetail(`Missing required permission: ${permission}`)])
        );
      }
    }
    
    next();
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
};
