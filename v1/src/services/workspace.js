const Workspace = require("../models/workspace");
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");

const getAllWorkspaces = async () => {
  try {
    const workspaces = await Workspace.find({});
    return ApiResponse.success(workspaces);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspacesOfUser = async (user) => {
  try {
    const workspaces = await Workspace.find({
      owner: user.jti,
    });
    return ApiResponse.success(workspaces);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspaces")]);
  }
};

const getWorkspaceById = async (id) => {
  try {
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return ApiResponse.fail([new ErrorDetail("Workspace not found")]);
    }
    return ApiResponse.success(workspace);
  } catch (e) {
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to retrieve workspace")]);
  }
};

const createWorkspace = async (workspaceData, user) => {
  try {
    const workspaceModel = new Workspace({
      name: workspaceData.name,
      description: workspaceData.description || "",
      owner: user.jti,
    });
    const savedWorkspace = await workspaceModel.save();
    return ApiResponse.success(savedWorkspace);
  } catch (e) {
    console.error(e);
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
    console.error(e);
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
    console.error(e);
    return ApiResponse.fail([new ErrorDetail("Failed to delete workspace")]);
  }
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  getWorkspacesOfUser,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
