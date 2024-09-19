const httpStatus = require("http-status");
const service = require("../services/workspace");

const getAllWorkspaces = async (req, res) => {
  const response = await service.getAllWorkspaces();

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  console.log(req.user);
  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getWorkspacesOfUser = async (req, res) => {
  const response = await service.getWorkspacesOfUser(req.user);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getWorkspaceById = async (req, res) => {
  const response = await service.getWorkspaceById(req.params.workspaceid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const createWorkspace = async (req, res) => {
  const response = await service.createWorkspace(req.body, req.user);
  console.log(req.user);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateWorkspace = async (req, res) => {
  const response = await service.updateWorkspace(
    req.params.workspaceid,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteWorkspace = async (req, res) => {
  const response = await service.deleteWorkspace(req.params.workspaceid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  getWorkspacesOfUser,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
