const userService = require("../services/user");
const subscriptionService = require("../services/subscription");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const { FORBIDDEN, UNAUTHORIZED } = require("http-status");
const { Workspace } = require("../models/workspace");
const User = require("../models/user");
const ExceptionLogger = require("../scripts/logger/exception");

const authorize = (permission) => async (req, res, next) => {
  try {
    const subscriptionId = req.headers["x-subscription-id"];
    const workspaceId = req.headers["x-workspace-id"];

    if (!subscriptionId) {
      return res
        .status(UNAUTHORIZED)
        .json(
          ApiResponse.fail([new ErrorDetail("Subscription ID is required")])
        );
    }

    const user = await User.findOne({ id: req.user.sub });

    if (!user) {
      return res
        .status(FORBIDDEN)
        .json(ApiResponse.fail([new ErrorDetail("User not found")]));
    }

    const subscriptionCheck =
      await subscriptionService.checkIsUserSubscriptionValid(subscriptionId, req.accessToken);

    if (!subscriptionCheck.isValid) {
      return res
        .status(FORBIDDEN)
        .json(ApiResponse.fail([new ErrorDetail(subscriptionCheck.error)]));
    }

    const workspaceRequiredPaths = [
      "/workspace/",
      "/board",
      "/list",
      "/task",
      "/taskStatus",
      "/comment",
      "/checklist",
      "/notification",
    ];

    const isWorkspaceRequired = workspaceRequiredPaths.some(
      (path) =>
        req.path.startsWith(path) &&
        !(req.path === "/workspace" && req.method === "POST") &&
        !(req.path === "/workspace/getworkspacesofuser")
    );

    if (isWorkspaceRequired) {
      if (!workspaceId) {
        return res
          .status(FORBIDDEN)
          .json(
            ApiResponse.fail([new ErrorDetail("Workspace ID is required")])
          );
      }

      const workspace = await Workspace.findOne({
        _id: workspaceId,
        subscriptionId: subscriptionId,
        isDeleted: false,
      });

      if (!workspace) {
        return res
          .status(FORBIDDEN)
          .json(
            ApiResponse.fail([
              new ErrorDetail(
                "Workspace not found or does not belong to this subscription"
              ),
            ])
          );
      }

      if (
        req.method === "POST" &&
        (req.path.includes("/members") || req.path.includes("/invite"))
      ) {
        const newMemberCount = req.body.inviteeEmails?.length || 1;
        const potentialMemberCount = workspace.members.length + newMemberCount;

        if (potentialMemberCount > subscriptionCheck.limits.userLimit) {
          return res
            .status(FORBIDDEN)
            .json(
              ApiResponse.fail([
                new ErrorDetail(
                  `Adding ${newMemberCount} member(s) would exceed the subscription limit of ${subscriptionCheck.limits.userLimit} users`
                ),
              ])
            );
        }
      }
    }

    if (req.path === "/workspace" && req.method === "POST") {
      const userWorkspaceCount = await Workspace.countDocuments({
        subscriptionId: subscriptionId,
        members: user._id,
        isDeleted: false,
      });

      if (userWorkspaceCount >= subscriptionCheck.limits.workspaceLimit) {
        return res
          .status(FORBIDDEN)
          .json(
            ApiResponse.fail([new ErrorDetail("User workspace limit reached")])
          );
      }
    }


    req.subscriptionId = subscriptionId;
    return next();
  } catch (error) {
    ExceptionLogger.error("Authorization error:", error);
    return res
      .status(FORBIDDEN)
      .json(ApiResponse.fail([new ErrorDetail("Authorization failed")]));
  }
};

module.exports = authorize;
