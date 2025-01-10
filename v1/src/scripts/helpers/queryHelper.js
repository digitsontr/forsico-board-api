/**
 * Helper functions for building consistent MongoDB queries
 */

/**
 * Adds base query conditions to filter out soft-deleted documents
 * @param {Object} query - The original query object
 * @returns {Object} Query with soft delete conditions added
 */
const withBaseQuery = (query = {}) => {
  return {
    ...query,
    isDeleted: false
  };
};

/**
 * Adds base query conditions with optional tenant isolation
 * @param {Object} query - The original query object 
 * @param {String} workspaceId - Optional workspace ID for tenant isolation
 * @returns {Object} Query with soft delete and tenant conditions
 */
const withTenantQuery = (query = {}, workspaceId = null) => {
  const baseQuery = withBaseQuery(query);
  if (workspaceId) {
    return {
      ...baseQuery,
      workspaceId
    };
  }
  return baseQuery;
};

/**
 * Adds pagination parameters to query options
 * @param {Object} options - Query options object
 * @param {Number} page - Page number (1-based)
 * @param {Number} limit - Items per page
 * @returns {Object} Options with pagination parameters
 */
const withPagination = (options = {}, page = 1, limit = 10) => {
  return {
    ...options,
    skip: (page - 1) * limit,
    limit: limit
  };
};

/**
 * Builds projection object to exclude soft delete fields
 * @param {String|Object} projection - Original projection
 * @returns {Object} Projection excluding soft delete fields
 */
const excludeSoftDeleteFields = (projection = '') => {
  const excludeFields = {
    isDeleted: 0,
    deletedAt: 0,
    deletionId: 0
  };

  if (typeof projection === 'string') {
    // Convert string projection to object
    const projObj = projection.split(' ').reduce((acc, field) => {
      if (field.startsWith('-')) {
        acc[field.substring(1)] = 0;
      } else {
        acc[field] = 1;
      }
      return acc;
    }, {});
    return { ...projObj, ...excludeFields };
  }

  return { ...projection, ...excludeFields };
};

module.exports = {
  withBaseQuery,
  withTenantQuery,
  withPagination,
  excludeSoftDeleteFields
}; 