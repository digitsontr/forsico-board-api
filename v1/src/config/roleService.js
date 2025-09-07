/**
 * Role Service Configuration
 * Configuration settings for role service integration
 */

const config = {
  // Role Service Connection
  roleService: {
    baseUrl: process.env.ROLE_SERVICE_URL || 'http://role-service:3001',
    apiKey: process.env.ROLE_API_KEY || 'D8D275887EEC217B864D54AF85748',
    timeout: parseInt(process.env.ROLE_SERVICE_TIMEOUT) || 5000,
    retryAttempts: parseInt(process.env.ROLE_SERVICE_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.ROLE_SERVICE_RETRY_DELAY) || 1000
  },

  // Permission Settings
  permissions: {
    // Enable/disable role-based permission checking
    enabled: process.env.ROLE_PERMISSIONS_ENABLED !== 'false',
    
    // Fail-safe mode: allow access when role service is unavailable
    failSafe: process.env.ROLE_PERMISSIONS_FAIL_SAFE !== 'false',
    
    // Cache permission results
    cacheEnabled: process.env.ROLE_PERMISSIONS_CACHE_ENABLED !== 'false',
    cacheTtl: parseInt(process.env.ROLE_PERMISSIONS_CACHE_TTL) || 300, // 5 minutes
    
    // Default role template type
    defaultRoleTemplateType: process.env.DEFAULT_ROLE_TEMPLATE_TYPE || 'RoleTemplate'
  },

  // Logging
  logging: {
    // Log permission checks
    logPermissionChecks: process.env.LOG_PERMISSION_CHECKS === 'true',
    
    // Log role service calls
    logRoleServiceCalls: process.env.LOG_ROLE_SERVICE_CALLS === 'true',
    
    // Log level for role service operations
    logLevel: process.env.ROLE_SERVICE_LOG_LEVEL || 'info'
  },

  // Health Check
  healthCheck: {
    enabled: process.env.ROLE_SERVICE_HEALTH_CHECK_ENABLED !== 'false',
    interval: parseInt(process.env.ROLE_SERVICE_HEALTH_CHECK_INTERVAL) || 60000, // 1 minute
    timeout: parseInt(process.env.ROLE_SERVICE_HEALTH_CHECK_TIMEOUT) || 5000
  }
};

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];

  if (!config.roleService.baseUrl) {
    errors.push('ROLE_SERVICE_URL is required');
  }

  if (!config.roleService.apiKey) {
    errors.push('ROLE_API_KEY is required');
  }

  if (config.roleService.timeout < 1000) {
    errors.push('ROLE_SERVICE_TIMEOUT must be at least 1000ms');
  }

  if (config.permissions.cacheTtl < 60) {
    errors.push('ROLE_PERMISSIONS_CACHE_TTL must be at least 60 seconds');
  }

  if (errors.length > 0) {
    throw new Error(`Role service configuration errors: ${errors.join(', ')}`);
  }
}

/**
 * Get configuration with validation
 */
function getConfig() {
  validateConfig();
  return config;
}

/**
 * Check if role service integration is enabled
 */
function isRoleServiceEnabled() {
  return config.permissions.enabled;
}

/**
 * Check if fail-safe mode is enabled
 */
function isFailSafeEnabled() {
  return config.permissions.failSafe;
}

/**
 * Check if permission caching is enabled
 */
function isCacheEnabled() {
  return config.permissions.cacheEnabled;
}

/**
 * Get role service base URL
 */
function getRoleServiceUrl() {
  return config.roleService.baseUrl;
}

/**
 * Get role service API key
 */
function getRoleServiceApiKey() {
  return config.roleService.apiKey;
}

/**
 * Get permission cache TTL
 */
function getCacheTtl() {
  return config.permissions.cacheTtl;
}

/**
 * Get default role template type
 */
function getDefaultRoleTemplateType() {
  return config.permissions.defaultRoleTemplateType;
}

module.exports = {
  config,
  getConfig,
  validateConfig,
  isRoleServiceEnabled,
  isFailSafeEnabled,
  isCacheEnabled,
  getRoleServiceUrl,
  getRoleServiceApiKey,
  getCacheTtl,
  getDefaultRoleTemplateType
};
