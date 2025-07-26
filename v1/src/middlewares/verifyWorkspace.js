const { UNAUTHORIZED, FORBIDDEN } = require("http-status");
const UserService = require("../services/user");
const WorkspaceService = require("../services/workspace");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");

const verifyWorkspace = () => async (req, res, next) => {
  const workspaceId = req.headers["x-workspace-id"];
  const subscriptionId = req.headers["x-subscription-id"];
  req.workspaceId = workspaceId;
  req.subscriptionId = subscriptionId;

  if (!workspaceId) {
    return res
      .status(UNAUTHORIZED)
      .json(ApiResponse.fail([new ErrorDetail("No workspace ID provided!")]));
  }

  if (!subscriptionId) {
    return res
      .status(UNAUTHORIZED)
      .json(ApiResponse.fail([new ErrorDetail("No subscription ID provided!")]));
  }

  next();
};

module.exports = verifyWorkspace;
