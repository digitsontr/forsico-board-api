const User = require("../models/user");
const Logger = require("../scripts/logger/board");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const getRedisClient = require("../config/redisClient");

/**
 * Get user by ID from database
 * @param {string} userId - User's ID
 * @returns {Object} API response with user data
 */
const getUserById = async (userId) => {
  try {
    if (!userId) {
      return ApiResponse.fail([new ErrorDetail("User ID is required")]);
    }
    const cacheKey = `user_${userId}`;
    const redisClient = await getRedisClient();

    // Try cache first
    if (redisClient) {
      try {
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
          Logger.log('info', `User cache hit for ID: ${userId}`);
          return ApiResponse.success(JSON.parse(cachedUser));
        }
      } catch (cacheError) {
        Logger.log('warn', `Cache read error for user ${userId}:`, cacheError.message);
      }
    }

    // Fetch from database
    const user = await User.findOne({ id: userId }).lean();

    if (!user) {
      return ApiResponse.fail([new ErrorDetail("User not found")]);
    }

    // Cache the result
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(user), {
          EX: 300 // 5 minutes
        });
      } catch (cacheError) {
        Logger.log('warn', `Cache write error for user ${userId}:`, cacheError.message);
      }
    }

    Logger.log('info', `User fetched successfully for ID: ${userId}`);
    return ApiResponse.success(user);
  } catch (error) {
    Logger.log('error', `Error in getUserById for ID ${userId}:`, error.message);
    return ApiResponse.fail([new ErrorDetail(`Failed to fetch user: ${error.message}`)]);
  }
};

module.exports = {
  getUserById
};
