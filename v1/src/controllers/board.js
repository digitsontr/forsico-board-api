const httpStatus = require("http-status");
const service = require("../services/board");

const getBoardsOfWorkspace = async (req, res) => {
  const response = await service.getBoardsOfWorkspace(req.workspaceId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getBoardById = async (req, res) => {
  const response = await service.getBoardById(req.params.boardId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const createBoard = async (req, res) => {
  const response = await service.createBoard(
    req.workspaceId,
    req.user.sub,
    req.body
  );

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const addMemberToBoard = async (req, res) => {
  const response = await service.addMemberToBoard(req.params.boardId, req.body);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateBoard = async (req, res) => {
  const response = await service.updateBoard(req.params.boardId, req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteBoard = async (req, res) => {
  const response = await service.deleteBoard(req.params.boardId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
  getBoardsOfWorkspace,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addMemberToBoard,
};
