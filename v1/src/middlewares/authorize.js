const userService = require("../services/user");
const subscriptionService = require("../services/subscription");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const { FORBIDDEN } = require("http-status");

const authorize = (permisson) => async (req, res, next) => {
  const isSubscriptionValid =
    await subscriptionService.checkIsUserSubscriptionValid(
      req.params.subscriptionId
    );
  if (!isSubscriptionValid)
    res
      .status(FORBIDDEN)
      .json(
        ApiResponse.fail([new ErrorDetail("User subscription is not valid!")])
      );

  if ((permisson || "") === "") {
    next();
    return;
  }

  const permissons = await userService.fetchUserPermissons(
    req.user.sub,
    req.workspaceId,
    req.accessToken
  );

  if (
    permissons.includes("RoleManager_Workspace_" + req.workspaceId) ||
    permissons.filter((perm) => {
      return perm.includes(permisson);
    }).length > 0
  ) {
    next();
  } else {
    res
      .status(FORBIDDEN)
      .json(ApiResponse.fail([new ErrorDetail("User has not authorized!")]));
  }
};

module.exports = authorize;
