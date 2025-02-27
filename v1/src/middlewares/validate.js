const httpStatus = require("http-status");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");

const validate = (schema) => (req, res, next) => {
  if (req.query.workspaceIds) {
    req.query.workspaceIds = JSON.parse(req.query.workspaceIds || "[]") || [];
  }

  const { value, error } = schema.validate({
    ...req.params,
    ...req.query,
    ...req.body,
  });

  if (error) {
    const response = ApiResponse.fail();

    error.details?.forEach((detail) => {
      response.errors.push(new ErrorDetail(detail.message, true));
    });

    res.status(httpStatus.BAD_REQUEST).json(response);
    return;
  }

  Object.assign(req, value);

  return next();
};

module.exports = validate;
