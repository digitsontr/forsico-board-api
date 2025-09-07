const httpStatus = require("http-status");
const service = require("../services/board");
const serviceBusClient = require("../services/serviceBusClient");
const Logger = require("../scripts/logger/board");

const getBoardsOfWorkspace = async (req, res) => {
  const response = await service.getBoardsOfWorkspace(req.workspaceId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getBoardMembers = async (req, res) => {
  const response = await service.getBoardMembers(req.boardId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getBoardById = async (req, res) => {
  const response = await service.getBoardById(req.params.boardId, req.workspaceId);

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
    // Send Service Bus message for role assignment
    try {
      await serviceBusClient.sendMemberAddedToBoard({
        userId: req.body.userId,
        boardId: req.params.boardId,
        workspaceId: req.workspaceId,
        subscriptionId: req.subscriptionId
      });

      Logger.log('info', 'Member added to board - Service Bus message sent', {
        userId: req.body.userId,
        boardId: req.params.boardId,
        workspaceId: req.workspaceId
      });
    } catch (error) {
      Logger.log('error', 'Failed to send Service Bus message for member added to board', {
        error: error.message,
        userId: req.body.userId,
        boardId: req.params.boardId
      });
    }

    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const removeMemberFromBoard = async (req, res) => {
  const response = await service.removeMemberFromBoard(req.params.boardId, req.body.userId);

  if (response.status) {
    // Send Service Bus message for role removal
    try {
      await serviceBusClient.sendMemberRemovedFromBoard({
        userId: req.body.userId,
        boardId: req.params.boardId,
        subscriptionId: req.subscriptionId
      });

      Logger.log('info', 'Member removed from board - Service Bus message sent', {
        userId: req.body.userId,
        boardId: req.params.boardId
      });
    } catch (error) {
      Logger.log('error', 'Failed to send Service Bus message for member removed from board', {
        error: error.message,
        userId: req.body.userId,
        boardId: req.params.boardId
      });
    }

    res.status(httpStatus.OK).send(response);
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
  getBoardMembers,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addMemberToBoard,
  removeMemberFromBoard
};
