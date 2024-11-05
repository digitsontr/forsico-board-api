const axios = require("axios");
const baseUrl = process.env.AUTH_API_BASE_URL;
const User = require("../models/user");
const redisClient = require("../config/redisClient");
const ExceptionLogger = require("../scripts/logger/exception");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const getUserById = async (userId) => {
  try {
    const user = await User.findOne({ id: userId });
    return user || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
};

const fetchUserPermissons = async (userId, workspaceId, accessToken) => {
  const cacheKey = `user_roles_${userId}_${workspaceId}`;
  const cachedPermissions = await redisClient.get(cacheKey);

  if (cachedPermissions) {
    return cachedPermissions.split(",");
  }

  let data = JSON.stringify({
    userId: userId,
    workspaceId: workspaceId,
  });

  let config = {
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

  return axios
    .request(config)
    .then((response) => {
      return response?.data?.data || [];
    })
    .catch((error, res) => {
      console.error("ERORR RES", error.response);
      return [];
    });
};

const userRegistered = async (userInfo) => {
  try {
    const existingUser = await User.findOne({ id: userInfo.Id });

    if (existingUser) {
      return res
        .status(200)
        .json({ message: "User already exists in MongoDB" });
    }

    const newUser = new User({
      id: userInfo.Id,
      firstName: userInfo.FirstName,
      lastName: userInfo.LastName,
      profilePicture: userInfo.ProfilePictureUrls || "defauil.jpg",
      workspaces: [], 
    });

    await newUser.save();

    return ApiResponse.success(newUser);
  } catch (error) {
    return ApiResponse.fail(new ErrorDetail(error.message));
  }
};

module.exports = {
  fetchUserPermissons,
  getUserById,
  userRegistered
};
