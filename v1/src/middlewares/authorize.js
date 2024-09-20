const userService = require('../services/user');
const subscriptionService = require('../services/subscription');
const { ApiResponse, ErrorDetail } = require("../models/apiresponse");
const { FORBIDDEN } = require("http-status");

const authorize =
  (userId, workspaceId, subscriptionId, permisson) => async (req, res, next) => {
    const isSubscriptionValid = await subscriptionService.checkIsUserSubscriptionValid(subscriptionId);

    if(!isSubscriptionValid) res.status(FORBIDDEN).json(ApiResponse.fail([new ErrorDetail("User subscription is not valid!")])); 
    
    const permissons = await userService.fetchUserPermissons(userId, workspaceId);

    if (
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
