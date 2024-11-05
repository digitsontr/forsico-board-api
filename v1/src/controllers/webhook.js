const httpStatus = require("http-status");
const userService = require("../services/user");

const userRegistered = async (req, res) => {
  console.log("USER REGISTERED HOOK");
  const response = await userService.userRegistered(req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  userRegistered,
};
