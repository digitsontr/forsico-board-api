const httpStatus = require("http-status");
const service = require("../services/task");

const getTasksOfBoard = async (req, res) => {
  const response = await service.getTasksOfBoard(
    req.params.boardId,
    req.workspaceId
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getTaskById = async (req, res) => {
  const response = await service.getTaskById(req.params.taskId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
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
  const response = await service.updateTaskStatus(req.params.taskId, req.body.statusId, req.user.sub);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
  } else {
    res.status(httpStatus.BAD_REQUEST).send(response);
  }
};

const search = async (req, res) => {
  const response = await service.searchTasks(req, req.user.sub);
  if (response.status) {
    res.status(httpStatus.OK).send(response);
  } else {
    res.status(httpStatus.BAD_REQUEST).send(response);
  }
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
  const response = await service.updateTask(req.params.taskId, req.body, req.user.sub);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteTask = async (req, res) => {
  const response = await service.deleteTask(req.params.taskId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const addMemberToTask = async (req, res) => {
  const response = await service.addMemberToTask(req.params.taskId, req.body);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};



const getUserTasks = async (req, res) => {
  const response = await service.getUserTasks(req.params.userId);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
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
  updateTaskStatus,
  search,
  addMemberToTask,
  getUserTasks
};
