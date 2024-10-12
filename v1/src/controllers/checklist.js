const httpStatus = require("http-status");
const service = require("../services/checklist");

const createChecklist = async (req, res) => {
  const response = await service.createChecklist(req.workspaceId, req.body);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const addChecklistItem = async (req, res) => {
  const response = await service.addChecklistItem(req.workspaceId, req.body);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateChecklistItem = async (req, res) => {
  const response = await service.updateChecklistItem(req.workspaceId, req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteChecklistItem = async (req, res) => {
  const response = await service.deleteChecklistItem(req.workspaceId, req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getChecklist = async (req, res) => {
  const response = await service.getChecklist(req.workspaceId, req.params.taskId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  createChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getChecklist,
};
