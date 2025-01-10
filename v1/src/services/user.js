const axios = require("axios");
const baseUrl = process.env.AUTH_API_BASE_URL;
const User = require("../models/user");
const getRedisClient = require("../config/redisClient");
const Logger = require("../scripts/logger/board");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");

const getUserById = async (userId) => {
  try {
    const user = await User.findOne({ id: userId });
    return user || null;
  } catch (error) {
    Logger.error("Error fetching user by ID:", error);
    return null;
  }
};

const fetchUserPermissons = async (userId, workspaceId, accessToken) => {
  try {
    const cacheKey = `user_roles_${userId}_${workspaceId}`;
    const redisClient = await getRedisClient();
    
    if (redisClient) {
      const cachedPermissions = await redisClient.get(cacheKey);
      if (cachedPermissions) {
        return cachedPermissions.split(",");
      }
    }

    const data = {
      userId: userId,
      workspaceId: workspaceId,
    };

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: baseUrl + "/api/Role/getUserRolesInWorkspace",
      headers: {
        "x-api-key": process.env.AUTH_API_API_KEY,
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      data: data,
    };

    const response = await axios.request(config);
    const permissions = response?.data?.data || [];

    // Cache the permissions if Redis is available
    if (redisClient && permissions.length > 0) {
      await redisClient.set(cacheKey, permissions.join(","), {
        EX: 300 // 5 minutes
      });
    }

    return permissions;
  } catch (error) {
    Logger.error("Error fetching user permissions:", error);
    return [];
  }
};

const userRegistered = async (userInfo) => {
  try {
    const existingUser = await User.findOne({ id: userInfo.Id });

    if (existingUser) {
      return ApiResponse.success({ message: "User already exists in MongoDB" });
    }

    const newUser = new User({
      id: userInfo.Id,
      firstName: userInfo.FirstName,
      lastName: userInfo.LastName,
      profilePicture: userInfo.ProfilePictureUrls || "default.jpg",
      workspaces: [], 
    });

    await newUser.save();
    return ApiResponse.success(newUser);
  } catch (error) {
    Logger.error("Error registering user:", error);
    return ApiResponse.fail([new ErrorDetail(error.message)]);
  }
};

module.exports = {
  fetchUserPermissons,
  getUserById,
  userRegistered
};
