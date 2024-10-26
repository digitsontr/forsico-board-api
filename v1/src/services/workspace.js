const Workspace = require("../models/workspace");
const User = require("../models/user");
const axios = require("axios");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const ExceptionLogger = require("../scripts/logger/exception");
const Logger = require("../scripts/logger/workspace");
const boardService = require("./board");
const { v4: uuidv4 } = require("uuid");

const getAllWorkspaces = async () => {
  try {
    const workspaces = await Workspace.find({});
    return ApiResponse.success(workspaces);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};
const getWorkspacesOfUserCacheKey = (userId) => `workspaces:user:${userId}`;

const getWorkspacesOfUser = async (user) => {
  try {
    const userEntity = await User.findOne({ id: user.sub });

    if (userEntity === null) {
      return ApiResponse.fail([new ErrorDetail("There is no user!")]);
    }

    const workspaces = await Workspace.find(
      {
        owner: userEntity._id,
        isDeleted: false,
      },
      "name description owner"
    ).populate({
      path: "boards",
      select: "id name members",
      populate: {
        path: "members",
        select: "id firstName lastName profilePicture",
      },
    });

    return ApiResponse.success(workspaces);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspaceById = async (id) => {
  try {
    const workspace = await Workspace.findById(id)
      .populate("members", "firstName lastName profilePicture")
      .populate("owner", "firstName lastName profilePicture")
      .populate("boards", "_id name description");

    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }

    return ApiResponse.success(workspace);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspace")]);
  }
};

const createWorkspace = async (workspaceData, user, accessToken) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let savedWorkspace;

  try {
    const workspaceModel = new Workspace({
      name: workspaceData.name,
      description: workspaceData.description || "",
      members: [],
    });

    savedWorkspace = await workspaceModel.save({ session });

    let existingUser = await User.findOne({ id: user.sub }).session(session);

    let userToSave;
    if (!existingUser) {
      userToSave = new User({
        id: user.sub,
        firstName: user.name,
        lastName: user.family_name,
        profilePicture: user.picture,
        workspaces: [savedWorkspace._id],
      });
    } else {
      existingUser.workspaces.push(savedWorkspace._id);
      userToSave = existingUser;
    }

    await userToSave.save({ session });

    savedWorkspace.members.push(userToSave._id);
    savedWorkspace.owner = userToSave._id;

    await savedWorkspace.save({ session });
    await saveWorkspaceToAuthApi(
      savedWorkspace._id,
      savedWorkspace.name,
      accessToken
    );

    await session.commitTransaction();
    session.endSession();
  } catch (e) {
    await session.abortTransaction();
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to create workspace")]);
  } finally {
    session.endSession();
  }

  await boardService.createBoard(savedWorkspace._id, user.sub, {
    name: "General",
  });

  return ApiResponse.success(savedWorkspace);
};

const updateWorkspace = async (id, updateData) => {
  try {
    const updatedWorkspace = await Workspace.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedWorkspace) {
      return ApiResponse.fail([
        new ErrorDetail("Workspace not found or update failed"),
      ]);
    }
    return ApiResponse.success(updatedWorkspace);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace")]);
  }
};

const deleteWorkspace = async (id) => {
  try {
    const deletionId = uuidv4();
    Logger.log(
      "info",
      "WORKSPACE REMOVE OPERATION STARTED DELETION ID: " + deletionId
    );

    const workspace = await Workspace.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletionId: deletionId,
    });

    await boardService.deleteBoardsByWorkspaceId(id, deletionId);
    return ApiResponse.success(workspace);
  } catch (e) {
    Logger.log("error", `Failed to remove workspace: ${e.message}`);

    return ApiResponse.fail([new ErrorDetail("Failed to remove workspace")]);
  }
};

const saveWorkspaceToAuthApi = async (id, name, accessToken) => {
  let data = JSON.stringify({
    id: id,
    name: name,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: process.env.AUTH_API_BASE_URL + "/api/Workspace/create",
    headers: {
      "x-api-key": process.env.AUTH_API_API_KEY,
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
    data: data,
  };

  return axios
    .request(config)
    .then((res) => {
      return res.data;
    })
    .catch((error, res) => {
      return {
        status: false,
      };
    });
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  getWorkspacesOfUser,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
