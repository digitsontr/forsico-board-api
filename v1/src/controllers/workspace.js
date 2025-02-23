const httpStatus = require("http-status");
const service = require("../services/workspace");

const getAllWorkspaces = async (req, res) => {
  const response = await service.getAllWorkspaces();

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getWorkspacesOfUser = async (req, res) => {
  const response = await service.getWorkspacesOfUser(req.user, req.subscriptionId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getWorkspaceById = async (req, res) => {
  const response = await service.getWorkspaceById(req.workspaceId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const createWorkspace = async (req, res) => {
  const response = await service.createWorkspace(req.body, req.user, req.accessToken, req.subscriptionId);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateWorkspace = async (req, res) => {
  const response = await service.updateWorkspace(
    req.workspaceId,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const addMemberToWorkspace = async (req, res) => {
  const response = await service.addMemberToWorkspace(req.workspaceId, req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};


const removeMemberFromWorkspace = async (req, res) => {
  const response = await service.removeMemberFromWorkspace(req.workspaceId, req.body.userId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteWorkspace = async (req, res) => {
  const response = await service.deleteWorkspace(req.workspaceId, req.user);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateWorkspaceReadyStatus = async (req, res) => {
  const response = await service.updateWorkspaceReadyStatus(
    req.workspaceId,
    req.body.isReady
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateWorkspaceProgress = async (req, res) => {
  const response = await service.updateWorkspaceProgress(
    req.workspaceId,
    req.body.state
  );

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getWorkspaceProgress = async (req, res) => {
  const response = await service.getWorkspaceProgress(req.workspaceId);

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
  addMemberToWorkspace,
  removeMemberFromWorkspace,
  updateWorkspaceReadyStatus,
  updateWorkspaceProgress,
  getWorkspaceProgress
};
