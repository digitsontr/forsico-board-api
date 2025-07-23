const Logger = require("../scripts/logger/board");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const User = require("../models/user");
const userProfileServiceClient = require("./userProfileServiceClient");

const getUserById = async (userId, token) => {
  try {
    const userResponse = await userProfileServiceClient.getProfileByAuthId(
      token,
      userId
    );
    if (!userResponse.success) {
      return userResponse;
    }
    return ApiResponse.success(userResponse.data);
  } catch (error) {
    Logger.error("Error fetching user by ID:", error);
    return new ApiResponse({
      data: null,
      status: false,
      errors: [error.message],
    });
  }
};

const userRegistered = async (messageBody) => {
  try {
    const { Id, FirstName, LastName, ProfilePictureUrl } = messageBody;

    const existingUser = await User.findOne({ id: Id });

    if (existingUser) {
      Logger.info(`User already exists: ${Id}`);
      return;
    }

    const newUser = new User({
      id: Id,
      firstName: FirstName,
      lastName: LastName,
      profilePicture: ProfilePictureUrl,
    });

    await newUser.save();
    Logger.info(`User created: ${Id}`);
  } catch (error) {
    Logger.error("Error in userRegistered service:", error);
  }
};

module.exports = {
  getUserById,
  userRegistered,
};
