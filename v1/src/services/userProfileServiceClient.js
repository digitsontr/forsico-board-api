const apiClient = require("./apiClient");
const { ErrorDetail, ApiResponse } = require("../models/apiResponse");

const USER_PROFILE_SERVICE_URL =
  process.env.USER_PROFILE_SERVICE_URL || "http://localhost:3001";

const USER_PROFILE_API_KEY = process.env.USER_PROFILE_API_KEY || "mock-board-api-key";
const SERVICE_NAME = process.env.SERVICE_NAME || 'board-api';

const userProfileServiceClient = {
  async getProfileByAuthId(authId) {
    try {
      const response = await apiClient.get(
        `${USER_PROFILE_SERVICE_URL}/profiles/${authId}`,
        {
          headers: { 
            'x-api-key': USER_PROFILE_API_KEY,
            'x-service-name': SERVICE_NAME
          },
        }
      );
      return ApiResponse.success(response.data);
    } catch (error) {
      return ApiResponse.fail([
        new ErrorDetail("Failed to retrieve user profile from user-profile-service"),
      ]);
    }
  },
};

module.exports = userProfileServiceClient; 