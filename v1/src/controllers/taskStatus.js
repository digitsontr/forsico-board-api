const httpStatus = require("http-status");
const service = require("../services/taskStatus");

const getStatusesOfBoard = async (req, res) => {
  const response = await service.getStatusesOfBoard(req.params.boardId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const createTaskStatus = async (req, res) => {
  const response = await service.createTaskStatus(
    req.user.sub,
    req.workspaceId,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getStatusById = async (req, res) => {
  const response = await service.getStatusById(req.params.statusId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateTaskStatus = async (req, res) => {
  const response = await service.updateTaskStatus(
    req.params.statusId,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteTaskStatus = async (req, res) => {
  const response = await service.deleteTaskStatus(req.params.statusId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  getStatusesOfBoard,
  createTaskStatus,
  updateTaskStatus,
  getStatusById,
  deleteTaskStatus,
};
