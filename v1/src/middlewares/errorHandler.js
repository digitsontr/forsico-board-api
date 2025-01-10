const { ApiResponse, ErrorDetail } = require("../models/apiResponse");
const Logger = require("../scripts/logger/board");

const errorHandler = (err, req, res, next) => {
  Logger.log('error', 'Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Handle specific errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json(
      ApiResponse.fail([new ErrorDetail('Database operation failed')])
    );
  }

  if (err.name === 'RedisError') {
    // Continue without cache
    return next();
  }

  // Default error response
  return res.status(502).json(
    ApiResponse.fail([new ErrorDetail('Internal server error')])
  );
};

module.exports = errorHandler; 