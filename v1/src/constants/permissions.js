/**
 * Permission constants for Forsico Board API
 * These permissions align with the role service permission structure
 */

const PERMISSIONS = {
  // Subscription Level Permissions
  SUBSCRIPTION: {
    // User Management
    USERS: {
      CREATE: 'SUBSCRIPTION.USERS.CREATE',
      READ: 'SUBSCRIPTION.USERS.READ',
      UPDATE: 'SUBSCRIPTION.USERS.UPDATE',
      DELETE: 'SUBSCRIPTION.USERS.DELETE',
      MANAGE: 'SUBSCRIPTION.USERS.MANAGE',
      INVITE: 'SUBSCRIPTION.USERS.INVITE'
    },
    
    // Workspace Management
    WORKSPACES: {
      CREATE: 'SUBSCRIPTION.WORKSPACES.CREATE',
      READ: 'SUBSCRIPTION.WORKSPACES.READ',
      UPDATE: 'SUBSCRIPTION.WORKSPACES.UPDATE',
      DELETE: 'SUBSCRIPTION.WORKSPACES.DELETE',
      MANAGE: 'SUBSCRIPTION.WORKSPACES.MANAGE'
    },
    
    // Subscription Settings
    SETTINGS: {
      READ: 'SUBSCRIPTION.SETTINGS.READ',
      UPDATE: 'SUBSCRIPTION.SETTINGS.UPDATE',
      MANAGE: 'SUBSCRIPTION.SETTINGS.MANAGE'
    },
    
    // Billing & Plans
    BILLING: {
      READ: 'SUBSCRIPTION.BILLING.READ',
      UPDATE: 'SUBSCRIPTION.BILLING.UPDATE',
      MANAGE: 'SUBSCRIPTION.BILLING.MANAGE'
    }
  },

  // Workspace Level Permissions
  WORKSPACE: {
    // Basic Operations
    VIEW: 'WORKSPACE.VIEW',
    CREATE: 'WORKSPACE.CREATE',
    UPDATE: 'WORKSPACE.UPDATE',
    DELETE: 'WORKSPACE.DELETE',
    MANAGE: 'WORKSPACE.MANAGE',
    
    // User Management
    USERS: {
      VIEW: 'WORKSPACE.USERS.VIEW',
      INVITE: 'WORKSPACE.USERS.INVITE',
      REMOVE: 'WORKSPACE.USERS.REMOVE',
      MANAGE: 'WORKSPACE.USERS.MANAGE',
      ASSIGN_ROLES: 'WORKSPACE.USERS.ASSIGN_ROLES'
    },
    
    // Board Management
    BOARDS: {
      CREATE: 'WORKSPACE.BOARDS.CREATE',
      VIEW: 'WORKSPACE.BOARDS.VIEW',
      MANAGE: 'WORKSPACE.BOARDS.MANAGE'
    },
    
    // Settings
    SETTINGS: {
      VIEW: 'WORKSPACE.SETTINGS.VIEW',
      UPDATE: 'WORKSPACE.SETTINGS.UPDATE',
      MANAGE: 'WORKSPACE.SETTINGS.MANAGE'
    }
  },

  // Board Level Permissions
  BOARD: {
    // Basic Operations
    VIEW: 'BOARD.VIEW',
    CREATE: 'BOARD.CREATE',
    UPDATE: 'BOARD.UPDATE',
    DELETE: 'BOARD.DELETE',
    MANAGE: 'BOARD.MANAGE',
    
    // Member Management
    MEMBERS: {
      VIEW: 'BOARD.MEMBERS.VIEW',
      ADD: 'BOARD.MEMBERS.ADD',
      REMOVE: 'BOARD.MEMBERS.REMOVE',
      MANAGE: 'BOARD.MEMBERS.MANAGE',
      ASSIGN_ROLES: 'BOARD.MEMBERS.ASSIGN_ROLES'
    },
    
    // List Management
    LISTS: {
      VIEW: 'BOARD.LISTS.VIEW',
      CREATE: 'BOARD.LISTS.CREATE',
      UPDATE: 'BOARD.LISTS.UPDATE',
      DELETE: 'BOARD.LISTS.DELETE',
      REORDER: 'BOARD.LISTS.REORDER',
      MANAGE: 'BOARD.LISTS.MANAGE'
    },
    
    // Task Management
    TASKS: {
      VIEW: 'BOARD.TASKS.VIEW',
      CREATE: 'BOARD.TASKS.CREATE',
      UPDATE: 'BOARD.TASKS.UPDATE',
      DELETE: 'BOARD.TASKS.DELETE',
      ASSIGN: 'BOARD.TASKS.ASSIGN',
      MOVE: 'BOARD.TASKS.MOVE',
      MANAGE: 'BOARD.TASKS.MANAGE'
    },
    
    // Settings
    SETTINGS: {
      VIEW: 'BOARD.SETTINGS.VIEW',
      UPDATE: 'BOARD.SETTINGS.UPDATE',
      MANAGE: 'BOARD.SETTINGS.MANAGE'
    }
  },

  // Task Level Permissions
  TASK: {
    // Basic Operations
    VIEW: 'TASK.VIEW',
    CREATE: 'TASK.CREATE',
    UPDATE: 'TASK.UPDATE',
    DELETE: 'TASK.DELETE',
    
    // Assignment
    ASSIGN: 'TASK.ASSIGN',
    UNASSIGN: 'TASK.UNASSIGN',
    
    // Status Management
    STATUS: {
      UPDATE: 'TASK.STATUS.UPDATE',
      MANAGE: 'TASK.STATUS.MANAGE'
    },
    
    // Comments
    COMMENTS: {
      VIEW: 'TASK.COMMENTS.VIEW',
      CREATE: 'TASK.COMMENTS.CREATE',
      UPDATE: 'TASK.COMMENTS.UPDATE',
      DELETE: 'TASK.COMMENTS.DELETE'
    },
    
    // Attachments
    ATTACHMENTS: {
      VIEW: 'TASK.ATTACHMENTS.VIEW',
      UPLOAD: 'TASK.ATTACHMENTS.UPLOAD',
      DELETE: 'TASK.ATTACHMENTS.DELETE'
    },
    
    // Checklists
    CHECKLISTS: {
      VIEW: 'TASK.CHECKLISTS.VIEW',
      CREATE: 'TASK.CHECKLISTS.CREATE',
      UPDATE: 'TASK.CHECKLISTS.UPDATE',
      DELETE: 'TASK.CHECKLISTS.DELETE'
    }
  },

  // Comment Level Permissions
  COMMENT: {
    VIEW: 'COMMENT.VIEW',
    CREATE: 'COMMENT.CREATE',
    UPDATE: 'COMMENT.UPDATE',
    DELETE: 'COMMENT.DELETE'
  },

  // Notification Permissions
  NOTIFICATION: {
    VIEW: 'NOTIFICATION.VIEW',
    CREATE: 'NOTIFICATION.CREATE',
    UPDATE: 'NOTIFICATION.UPDATE',
    DELETE: 'NOTIFICATION.DELETE',
    MANAGE: 'NOTIFICATION.MANAGE'
  },

  // Reporting Permissions
  REPORTING: {
    VIEW: 'REPORTING.VIEW',
    CREATE: 'REPORTING.CREATE',
    EXPORT: 'REPORTING.EXPORT',
    MANAGE: 'REPORTING.MANAGE'
  }
};

// Scope Types
const SCOPE_TYPES = {
  SUBSCRIPTION: 'subscription',
  WORKSPACE: 'workspace',
  BOARD: 'board'
};

// Role Template Types
const ROLE_TEMPLATE_TYPES = {
  SYSTEM: 'SystemRoleTemplate',
  CUSTOM: 'RoleTemplate'
};

// Helper functions for permission checking
const PermissionHelpers = {
  /**
   * Check if permission belongs to specific scope
   * @param {string} permission - Permission string
   * @param {string} scope - Scope type
   * @returns {boolean}
   */
  isPermissionInScope(permission, scope) {
    const upperScope = scope.toUpperCase();
    return permission.startsWith(`${upperScope}.`);
  },

  /**
   * Get scope type from permission
   * @param {string} permission - Permission string
   * @returns {string|null}
   */
  getScopeFromPermission(permission) {
    const parts = permission.split('.');
    if (parts.length > 0) {
      const scope = parts[0].toLowerCase();
      if (Object.values(SCOPE_TYPES).includes(scope)) {
        return scope;
      }
    }
    return null;
  },

  /**
   * Get all permissions for a scope
   * @param {string} scope - Scope type
   * @returns {Array<string>}
   */
  getPermissionsForScope(scope) {
    const upperScope = scope.toUpperCase();
    const scopePermissions = PERMISSIONS[upperScope];
    
    if (!scopePermissions) return [];
    
    const permissions = [];
    
    function extractPermissions(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          permissions.push(value);
        } else if (typeof value === 'object') {
          extractPermissions(value, `${prefix}${key}.`);
        }
      }
    }
    
    extractPermissions(scopePermissions);
    return permissions;
  }
};

// Backward compatibility with existing permission constants
const LEGACY_PERMISSIONS = {
  'CAN_CREATE_TASK': PERMISSIONS.TASK.CREATE,
  'CAN_UPDATE_WORKSPACE': PERMISSIONS.WORKSPACE.UPDATE,
  'CAN_DELETE_WORKSPACE': PERMISSIONS.WORKSPACE.DELETE,
  'CAN_UPDATE_TASK': PERMISSIONS.TASK.UPDATE,
  'CAN_DELETE_TASK': PERMISSIONS.TASK.DELETE,
  'CAN_UPDATE_TASK_STATUS': PERMISSIONS.TASK.STATUS.UPDATE,
  'CAN_DELETE_TASK_STATUS': PERMISSIONS.TASK.STATUS.MANAGE,
  'CAN_UPDATE_COMMENT': PERMISSIONS.COMMENT.UPDATE,
  'CAN_DELETE_COMMENT': PERMISSIONS.COMMENT.DELETE
};

module.exports = {
  PERMISSIONS,
  SCOPE_TYPES,
  ROLE_TEMPLATE_TYPES,
  PermissionHelpers,
  LEGACY_PERMISSIONS,
  
  // Export individual scopes for convenience
  SUBSCRIPTION_PERMISSIONS: PERMISSIONS.SUBSCRIPTION,
  WORKSPACE_PERMISSIONS: PERMISSIONS.WORKSPACE,
  BOARD_PERMISSIONS: PERMISSIONS.BOARD,
  TASK_PERMISSIONS: PERMISSIONS.TASK,
  COMMENT_PERMISSIONS: PERMISSIONS.COMMENT,
  NOTIFICATION_PERMISSIONS: PERMISSIONS.NOTIFICATION,
  REPORTING_PERMISSIONS: PERMISSIONS.REPORTING
};
