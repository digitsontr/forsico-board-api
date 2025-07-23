const { Workspace, WorkspaceProgressState } = require("../models/workspace");
const User = require("../models/user");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const Logger = require("../scripts/logger/workspace");
const boardService = require("./board");
const { v4: uuidv4 } = require("uuid");
const workspaceServiceClient = require("./workspaceServiceClient");

const getAllWorkspaces = async () => {
  try {
    const workspaces = await Workspace.find({});
    return ApiResponse.success(workspaces);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspacesOfUser = async (user, subscriptionId, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.getWorkspaces(
      token,
      subscriptionId
    );

    if (!workspaceResponse.success) {
      return workspaceResponse;
    }

    const userEntity = await User.findOne({ id: user.sub });
    if (!userEntity) {
      return ApiResponse.fail([new ErrorDetail("User not found in board-api database")]);
    }

    const workspaces = await Promise.all(
      workspaceResponse.data.workspaces.map(async (workspace) => {
        const boards = await boardService.getBoardsByWorkspaceId(
          workspace._id,
          userEntity._id
        );
        return {
          ...workspace,
          boards: boards.data,
        };
      })
    );

    return ApiResponse.success(workspaces);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspaceById = async (id, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.getWorkspaceById(
      token,
      id
    );

    if (!workspaceResponse.success) {
      return workspaceResponse;
    }

    const boards = await boardService.getBoardsByWorkspaceId(id);
    const workspace = {
      ...workspaceResponse.data,
      boards: boards.data,
    };

    return ApiResponse.success(workspace);
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspace")]);
  }
};

const createWorkspace = async (workspaceData, user, accessToken, subscriptionId) => {
  try {
    const workspaceResponse = await workspaceServiceClient.createWorkspace(
      accessToken,
      workspaceData,
      subscriptionId
    );

    if (!workspaceResponse.success) {
      return workspaceResponse;
    }

    const savedWorkspace = workspaceResponse.data;

    let userToSave = await User.findOne({ id: user.sub });

    if (!userToSave) {
      userToSave = new User({
        id: user.sub,
        firstName: user.name,
        lastName: user.family_name,
        profilePicture: user.picture,
        workspaces: [savedWorkspace._id],
      });
    } else {
      userToSave.workspaces.push(savedWorkspace._id);
    }

    await userToSave.save();

    await boardService.createBoard(savedWorkspace._id, user.sub, {
      name: "General",
    });

    return ApiResponse.success(savedWorkspace);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to create workspace")]);
  }
};

const updateWorkspace = async (workspaceId, updateData, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.updateWorkspace(
      token,
      workspaceId,
      updateData
    );
    return workspaceResponse;
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace")]);
  }
};

const deleteWorkspace = async (id, token) => {
  try {
    const deletionId = uuidv4();
    Logger.log(
      "info",
      "WORKSPACE REMOVE OPERATION STARTED DELETION ID: " + deletionId
    );

    const workspaceResponse = await workspaceServiceClient.deleteWorkspace(
      token,
      id
    );

    if (!workspaceResponse.success) {
      return workspaceResponse;
    }

    await boardService.deleteBoardsByWorkspaceId(id, deletionId);
    return ApiResponse.success(workspaceResponse.data);
  } catch (e) {
    Logger.log("error", `Failed to remove workspace: ${e.message}`);

    return ApiResponse.fail([new ErrorDetail("Failed to remove workspace")]);
  }
};

const addMemberToWorkspace = async (workspaceId, userData, token) => {
  try {
    const user = await User.findOneAndUpdate(
      { id: userData.id },
      {
        $setOnInsert: {
          id: userData.userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePicture: userData.profilePicture,
        },
        $addToSet: { workspaces: workspaceId },
      },
      { upsert: true, new: true }
    );

    const workspaceResponse = await workspaceServiceClient.addMemberToWorkspace(
      token,
      workspaceId,
      user.id
    );

    if (!workspaceResponse.success) {
      // If the call to the workspace service fails, we should roll back the local change.
      await User.updateOne(
        { id: user.id },
        { $pull: { workspaces: workspaceId } }
      );
      return workspaceResponse;
    }

    return ApiResponse.success(workspaceResponse.data);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to add member to workspace")]);
  }
};

const removeMemberFromWorkspace = async (workspaceId, userId, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.removeMemberFromWorkspace(
      token,
      workspaceId,
      userId
    );

    if (!workspaceResponse.success) {
      return workspaceResponse;
    }

    await User.updateOne({ id: userId }, { $pull: { workspaces: workspaceId } });

    return ApiResponse.success(workspaceResponse.data);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to remove member from workspace")]);
  }
};

const updateWorkspaceReadyStatus = async (workspaceId, updateData, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.updateWorkspaceReadyStatus(
      token,
      workspaceId,
      updateData
    );
    return workspaceResponse;
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace ready status")]);
  }
};

const updateWorkspaceProgress = async (workspaceId, updateData, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.updateWorkspaceProgress(
      token,
      workspaceId,
      updateData
    );
    return workspaceResponse;
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to update workspace progress")]);
  }
};

const getWorkspaceProgress = async (workspaceId, token) => {
  try {
    const workspaceResponse = await workspaceServiceClient.getWorkspaceProgress(
      token,
      workspaceId
    );
    return workspaceResponse;
  } catch (e) {
    return ApiResponse.fail([new ErrorDetail("Failed to get workspace progress")]);
  }
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  getWorkspacesOfUser,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMemberToWorkspace,
  removeMemberFromWorkspace,
  updateWorkspaceReadyStatus,
  updateWorkspaceProgress,
  getWorkspaceProgress
};
