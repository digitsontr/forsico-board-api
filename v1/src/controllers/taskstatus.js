const httpStatus = require("http-status");
const service = require("../services/taskstatus");

const getStatusesOfBoard = async (req, res) => {
  const response = await service.getStatusesOfBoard(req.params.boardid);

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
  const response = await service.getStatusById(req.params.statusid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateTaskStatus = async (req, res) => {
  const response = await service.updateTaskStatus(
    req.params.statusid,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteTaskStatus = async (req, res) => {
  const response = await service.deleteTaskStatus(req.params.statusid);

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
