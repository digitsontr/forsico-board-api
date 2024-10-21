const { UNAUTHORIZED, FORBIDDEN } = require("http-status");
const UserService = require("../services/user");
const WorkspaceService = require("../services/workspace");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");

const verifyWorkspace = () => async (req, res, next) => {
  const workspaceId = req.headers["x-workspace-id"];
  req.workspaceId = workspaceId;

  if (!workspaceId) {
    return res
      .status(UNAUTHORIZED)
      .json(ApiResponse.fail([new ErrorDetail("No workspace ID provided!")]));
  }

  const userHasAccess = await userHasAccessToWorkspace(
    req.user.sub,
    workspaceId
  );
  if (!userHasAccess) {
    return res
      .status(FORBIDDEN)
      .json(
        ApiResponse.fail([new ErrorDetail("No access to this workspace!")])
      );
  }

  next();
};

const userHasAccessToWorkspace = async (userId, workspaceId) => {
  try {
    const user = await UserService.getUserById(userId);
    if (!user) {
      return false;
    }

    const workspace = await WorkspaceService.getWorkspaceById(workspaceId);

    if (!workspace) {
      return false;
    }

    const isMember = workspace.data?.members?.some(
      (member) => member._id.toString() === user._id.toString()
    );

    return isMember;
  } catch (error) {
    console.error("Error checking workspace access:", error);
    return false;
  }
};

module.exports = verifyWorkspace;
