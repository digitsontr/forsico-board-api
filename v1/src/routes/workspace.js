const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate');
const validations = require('../validations/workspace');
const authorize = require('../middlewares/authorize');
const permissons = require('../scripts/helpers/permissions');
const {
  getWorkspaceById,
  getWorkspacesOfUser,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require('../controllers/workspace');
const verifyWorkspace = require('../middlewares/verifyWorkspace');

router.get(
  '/getworkspacesofuser',
  authorize(),
  getWorkspacesOfUser
);

router.get(
  '/',
  authorize(),
  verifyWorkspace(),
  getWorkspaceById
);

router
  .route('/')
  .post(validate(validations.createValidation), authorize(), createWorkspace);

router.put(
  '/',
  verifyWorkspace(),
  validate(validations.updateValidation),
  authorize(),
  updateWorkspace
);

router.delete(
  '/',
  verifyWorkspace(),
  authorize(),
  deleteWorkspace
);

module.exports = router;
