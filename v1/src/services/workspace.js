const Workspace = require("../models/workspace");
const User = require("../models/user");
const axios = require("axios");
const mongoose = require("mongoose");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");
const Logger = require("../scripts/logger/workspace");

const getAllWorkspaces = async () => {
  try {
    const workspaces = await Workspace.find({});
    return ApiResponse.success(workspaces);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspacesOfUser = async (user) => {
  try {
    const workspaces = await Workspace.find({
      owner: user.sub,
    }).populate({
      path : 'boards',
      populate: {path: 'members'}
    })
    return ApiResponse.success(workspaces);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspaceById = async (id) => {
  try {
    const workspace = await Workspace.findById(id).populate('members');

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

  try {
    const workspaceModel = new Workspace({
      name: workspaceData.name,
      description: workspaceData.description || "",
      owner: user.sub,
      members: [],
    });

    const savedWorkspace = await workspaceModel.save({
      session,
    });

    let existingUser = await User.findOne({ id: user.sub }).session(session);

    if (!existingUser) {
      existingUser = new User({
        id: user.sub,
        firstname: user.name,
        lastname: user.family_name,
        profilePicture: user.picture,
        workspaces: [savedWorkspace._id]
      });

      await existingUser.save({ session });
    } else {
      existingUser.workspaces.push(savedWorkspace._id);
      await existingUser.save({ session });
    }

    savedWorkspace.members.push(existingUser._id);
    
    await savedWorkspace.save({ session });
 
    const authApiResponse = await saveWorkspaceToAuthApi(
      savedWorkspace._id,
      savedWorkspace.name,
      accessToken
    );


    if (!authApiResponse.status) {
      Logger.log({
        level: "error",
        message: `AUTH API ERROR: ${authApiResponse.errors
          ?.map((error) => {
            return error.message;
          })
          .join(",")}`,
      });
      throw new Error("Failed to save workspace to auth API");
    }

    await session.commitTransaction();
    session.endSession();

    return ApiResponse.success(savedWorkspace);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();

    console.log(e);

    return ApiResponse.fail([new ErrorDetail("Failed to create workspace")]);
  }
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
    const deletedWorkspace = await Workspace.findByIdAndDelete(id);
    if (!deletedWorkspace) {
      return ApiResponse.fail([
        new ErrorDetail("Workspace not found or delete failed"),
      ]);
    }
    return ApiResponse.success(deletedWorkspace);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to delete workspace")]);
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
