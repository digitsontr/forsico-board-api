const Workspace = require('../models/workspace');
const { ApiResponse, ErrorDetail } = require('../models/apiresponse');


const getAllWorkspaces = (req, res) => {
    //TODO list all workspaces
};

const getWorkspaceById = (req, res) => {
    //TODO get workspace by id
};

const createWorkspace = async (workspace) => {
    const workspaceModel = new Workspace({
        name: 'Test workspace'
    });

    return workspaceModel.save().then((res) => {
        return ApiResponse.success(res);
    }).catch((e)=>{
        console.log(e);

        return ApiResponse.fail(e);
    });
};

const updateWorkspace = (req, res) => {
    //TODO update workspace
};

const deleteWorkspace = (req, res) => {
    //TODO delete workspace
};


module.exports = {
    getAllWorkspaces,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
}