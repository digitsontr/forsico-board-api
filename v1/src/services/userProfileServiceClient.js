const apiClient = require("./apiClient");
const { ErrorDetail, ApiResponse } = require("../models/apiResponse");

const USER_PROFILE_SERVICE_URL =
  process.env.USER_PROFILE_SERVICE_URL || "https://staging-api.forsico.io/user-profile";

const userProfileServiceClient = {
  async getProfileByAuthId(token, authId) {
    try {
      const response = await apiClient.get(
        `${USER_PROFILE_SERVICE_URL}/api/v1/profiles/auth/${authId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
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