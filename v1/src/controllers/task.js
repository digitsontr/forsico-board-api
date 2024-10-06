const httpStatus = require("http-status");
const service = require("../services/task");

const getTasksOfBoard = async (req, res) => {
  const response = await service.getTasksOfBoard(req.params.boardid, req.workspaceId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getTaskById = async (req, res) => {
  const response = await service.getTaskById(req.params.taskid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
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


const createTask = async (req, res) => {
  const response = await service.createTask(req.workspaceId, req.body);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateTask = async (req, res) => {
  const response = await service.updateTask(req.params.taskid, req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteTask = async (req, res) => {
  const response = await service.deleteTask(req.params.taskid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  getTasksOfBoard,
  getTaskById,
  getStatusById,
  createTask,
  updateTask,
  deleteTask,
};
