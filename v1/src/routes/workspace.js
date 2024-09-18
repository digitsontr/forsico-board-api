const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate');
const validations = require('../validations/workspace');
const { getAllWorkspaces, getWorkspaceById, createWorkspace, updateWorkspace, deleteWorkspace } = require('../controllers/workspace');

router.get('/', getAllWorkspaces);

router.get('/:workspaceid', getWorkspaceById);

router.route('/').post(validate(validations.createValidation), createWorkspace);

router.put('/:workspaceid', updateWorkspace);

router.delete('/:workspaceid', deleteWorkspace);

module.exports = router;