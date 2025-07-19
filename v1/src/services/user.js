const axios = require("axios");
const Logger = require("../scripts/logger/board");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const getRedisClient = require("../config/redisClient");

const USER_PROFILE_API_URL = process.env.USER_PROFILE_API_URL;
const USER_PROFILE_API_KEY = process.env.USER_PROFILE_API_KEY;

const getUserById = async (userId) => {
  try {
    const cacheKey = `user_${userId}`;
    const redisClient = await getRedisClient();

    if (redisClient) {
      const cachedUser = await redisClient.get(cacheKey);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
    }

    const response = await axios.get(`${USER_PROFILE_API_URL}/api/users/${userId}`, {
      headers: {
        'x-api-key': USER_PROFILE_API_KEY
      }
    });

    const user = response.data.data;

    if (redisClient && user) {
      await redisClient.set(cacheKey, JSON.stringify(user), {
        EX: 300
      });
    }

    return new ApiResponse({
      data: user,
      status: true,
      errors: []
    });
  } catch (error) {
    Logger.error("Error fetching user by ID:", error);
    return new ApiResponse({
      data: null,
      status: false,
      errors: [error.message]
    });
  }
};

module.exports = {
  getUserById
};
