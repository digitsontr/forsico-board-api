const httpStatus = require("http-status");
const service = require("../services/comment");

const getCommentsForTask = async (req, res) => {
  const response = await service.getCommentsForTask(req.params.taskId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getCommentById = async (req, res) => {
  const response = await service.getCommentById(req.params.commentId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const createComment = async (req, res) => {
  const response = await service.createComment(
    req.workspaceId,
    req.user.sub,
    req.params.taskId,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateComment = async (req, res) => {
  const response = await service.updateComment(
    req.params.commentId,
    req.user.sub,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteComment = async (req, res) => {
  const response = await service.deleteComment(
    req.params.commentId,
    req.user.sub
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  getCommentsForTask,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
