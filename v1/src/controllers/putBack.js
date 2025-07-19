const { putBackByDeletionId } = require("../services/putBack");
const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const httpStatus = require("http-status");

const putBack = async (req, res) => {
  const { deletionId } = req.params;

  try {
    const result = await putBackByDeletionId(deletionId);
    return res.status(httpStatus.OK).json(ApiResponse.success(result));
  } catch (error) {
    console.error("Error during put-back:", error);
    return res
      .status(httpStatus.BAD_REQUEST)
      .json(ApiResponse.fail([new ErrorDetail(error.message)]));
  }
};

module.exports = { putBack };
