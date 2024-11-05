const httpStatus = require("http-status");
const service = require("../services/list");

const getListsOfBoard = async (req, res) => {
  const response = await service.getListsOfBoard(req.params.boardId);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const getListById = async (req, res) => {
  const response = await service.getListById(req.params.listid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const createList = async (req, res) => {
  const response = await service.createList(req.body, req.workspaceId);

  if (response.status) {
    res.status(httpStatus.CREATED).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateList = async (req, res) => {
  const response = await service.updateList(req.params.listid, req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

const deleteList = async (req, res) => {
  const response = await service.deleteList(req.params.listid);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};


const updateMultipleListOrders = async (req, res) => {
  const response = await service.updateMultipleListOrders(req.body);

  if (response.status) {
    res.status(httpStatus.OK).send(response);
    return;
  }

  res.status(httpStatus.BAD_REQUEST).send(response);
};

module.exports = {
    getListsOfBoard,
    getListById,
    createList,
    updateList,
    deleteList,
    updateMultipleListOrders
};
