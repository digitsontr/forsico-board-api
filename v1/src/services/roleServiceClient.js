const axios = require('axios');
const Logger = require('../scripts/logger/board');

class RoleServiceClient {
  constructor() {
    this.baseUrl = process.env.ROLE_SERVICE_URL || 'http://role-service:3001';
    this.apiKey = process.env.ROLE_API_KEY || 'D8D275887EEC217B864D54AF85748';
    this.timeout = 5000;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'x-service-name': 'board-service'
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        Logger.log('error', `Role Service Error: ${error.message}`, {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if user has specific permission in given scope
   * @param {Object} params - Permission check parameters
   * @param {string} params.token - User JWT token
   * @param {string} params.subscriptionId - Subscription ID
   * @param {string} params.requiredPermission - Permission to check (e.g., 'BOARD.VIEW')
   * @param {string} params.scopeType - Scope type ('subscription', 'workspace', 'board')
   * @param {string} [params.scopeId] - Scope ID (workspace/board ID)
   * @param {string} [params.workspaceId] - Workspace ID (for board scope)
   * @param {string} [params.boardId] - Board ID
   * @param {string} [params.roleTemplateType='RoleTemplate'] - Role template type
   * @returns {Promise<boolean>} - True if user has permission
   */
  async checkPermission({
    token,
    subscriptionId,
    requiredPermission,
    scopeType,
    scopeId = null,
    workspaceId = null,
    boardId = null,
    roleTemplateType = 'RoleTemplate'
  }) {
    try {
      if (!token || !subscriptionId || !requiredPermission || !scopeType) {
        Logger.log('warn', 'Missing required parameters for permission check', {
          hasToken: !!token,
          subscriptionId,
          requiredPermission,
          scopeType
        });
        return false;
      }

      const response = await this.axiosInstance.post(
        '/api/v1/roles/check-permission',
        {
          subscriptionId,
          requiredPermission,
          roleTemplateType,
          scopeType,
          ...(scopeId && { scopeId }),
          ...(workspaceId && { workspaceId }),
          ...(boardId && { boardId })
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Handle role service response format: { success: true, data: { hasPermission } }
      const hasPermission = response.data?.success && response.data?.data?.hasPermission;
      
      Logger.log('debug', 'Permission check result', {
        requiredPermission,
        scopeType,
        scopeId,
        hasPermission
      });

      return hasPermission || false;
    } catch (error) {
      Logger.log('error', 'Error checking permission', {
        error: error.message,
        requiredPermission,
        scopeType,
        scopeId
      });
      
      // Return false on error to fail-safe
      return false;
    }
  }

  /**
   * Get user's roles in a subscription
   * @param {string} token - User JWT token
   * @param {string} userId - User ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Array>} - Array of user roles
   */
  async getUserRoles(token, userId, subscriptionId) {
    try {
      if (!token || !userId || !subscriptionId) {
        Logger.log('warn', 'Missing required parameters for getUserRoles', {
          hasToken: !!token,
          userId,
          subscriptionId
        });
        return [];
      }

      const response = await this.axiosInstance.get(
        `/api/v1/roles/${subscriptionId}/user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const roles = response.data?.success ? response.data.data : [];
      
      Logger.log('debug', 'Retrieved user roles', {
        userId,
        subscriptionId,
        roleCount: roles.length
      });

      return roles;
    } catch (error) {
      Logger.log('error', 'Error getting user roles', {
        error: error.message,
        userId,
        subscriptionId
      });
      
      return [];
    }
  }

  /**
   * Get user roles by scope
   * @param {Object} params - Parameters
   * @param {string} params.userId - User ID
   * @param {string} params.subscriptionId - Subscription ID
   * @param {string} params.scopeType - Scope type
   * @param {string} params.scopeId - Scope ID
   * @returns {Array} User roles in the specified scope
   */
  async getUserRolesByScope({ userId, subscriptionId, scopeType, scopeId }) {
    try {
      const response = await this.makeRequest('POST', '/users-by-scope', {
        subscriptionId,
        scopeType,
        scopeId
      });

      if (response.success && response.data && response.data.users) {
        // Find the specific user in the response
        const userRoles = response.data.users.find(user => user.userId === userId);
        return userRoles ? userRoles.roles : [];
      }

      return [];
    } catch (error) {
      Logger.log('error', 'Error getting user roles by scope', {
        error: error.message,
        userId,
        scopeType,
        scopeId
      });
      return [];
    }
  }

  /**
   * Assign role to user
   * @param {string} token - Admin JWT token
   * @param {Object} roleData - Role assignment data
   * @param {string} roleData.userId - User ID
   * @param {string} roleData.subscriptionId - Subscription ID
   * @param {string} roleData.roleTemplateId - Role template ID
   * @param {string} roleData.roleTemplateType - Role template type
   * @param {string} roleData.scopeType - Scope type
   * @param {string} [roleData.scopeId] - Scope ID
   * @param {string} [roleData.workspaceId] - Workspace ID
   * @param {string} [roleData.boardId] - Board ID
   * @returns {Promise<Object|null>} - Role assignment result
   */
  async assignRole(token, roleData) {
    try {
      if (!token || !roleData.userId || !roleData.subscriptionId || !roleData.roleTemplateId) {
        Logger.log('warn', 'Missing required parameters for role assignment', roleData);
        return null;
      }

      const response = await this.axiosInstance.post(
        '/api/v1/roles/assign',
        roleData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = response.data?.success ? response.data.data : null;
      
      Logger.log('info', 'Role assigned successfully', {
        userId: roleData.userId,
        roleTemplateId: roleData.roleTemplateId,
        scopeType: roleData.scopeType,
        scopeId: roleData.scopeId
      });

      return result;
    } catch (error) {
      Logger.log('error', 'Error assigning role', {
        error: error.message,
        roleData
      });
      
      return null;
    }
  }

  /**
   * Remove role from user
   * @param {string} token - Admin JWT token
   * @param {string} userId - User ID
   * @param {string} subscriptionId - Subscription ID
   * @param {string} roleTemplateId - Role template ID
   * @param {string} [scopeId] - Scope ID
   * @returns {Promise<Object|null>} - Role removal result
   */
  async removeRole(token, userId, subscriptionId, roleTemplateId, scopeId = null) {
    try {
      if (!token || !userId || !subscriptionId || !roleTemplateId) {
        Logger.log('warn', 'Missing required parameters for role removal', {
          hasToken: !!token,
          userId,
          subscriptionId,
          roleTemplateId
        });
        return null;
      }

      const response = await this.axiosInstance.delete(
        '/api/v1/roles/remove',
        {
          data: {
            userId,
            subscriptionId,
            roleTemplateId,
            ...(scopeId && { scopeId })
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = response.data?.success ? response.data.data : null;
      
      Logger.log('info', 'Role removed successfully', {
        userId,
        roleTemplateId,
        scopeId
      });

      return result;
    } catch (error) {
      Logger.log('error', 'Error removing role', {
        error: error.message,
        userId,
        roleTemplateId,
        scopeId
      });
      
      return null;
    }
  }

  /**
   * Health check for role service
   * @returns {Promise<boolean>} - True if service is healthy
   */
  async healthCheck() {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      Logger.log('error', 'Role service health check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new RoleServiceClient();
