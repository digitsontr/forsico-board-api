const httpStatus = require('http-status');
const service = require('../services/workspace');

const getAllWorkspaces = (req, res) => {
    res.status(httpStatus.OK).send('All workspaces listed from controller');
};

const getWorkspaceById = (req, res) => {
    res.status(httpStatus.OK).send('All workspaces listed from controller');
};

const createWorkspace = async (req, res) => {
    const response = await service.createWorkspace(req.body);
    console.log(req.user);

    if(response.status){
        res.status(httpStatus.CREATED).send(response);
        return;
    }

    res.status(httpStatus.BAD_REQUEST).send(response);
};

const updateWorkspace = (req, res) => {
    res.status(httpStatus.OK).send('All workspaces listed from controller');
};

const deleteWorkspace = (req, res) => {
    res.status(httpStatus.OK).send('All workspaces listed from controller');
};

module.exports = {
    getAllWorkspaces,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
}