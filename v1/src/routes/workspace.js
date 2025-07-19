const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const validations = require("../validations/workspace");
const authorize = require("../middlewares/authorize");
const permissons = require("../scripts/helpers/permissions");
const {
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
} = require("../controllers/workspace");
const verifyWorkspace = require("../middlewares/verifyWorkspace");

router.get("/getworkspacesofuser", authorize(), getWorkspacesOfUser);

router.get("/", authorize(), verifyWorkspace(), getWorkspaceById);

router
  .route("/addMemberToWorkspace")
  .post(
    verifyWorkspace(),
    validate(validations.addMemberToWorkspaceValidation),
    authorize(),
    addMemberToWorkspace
  );

router
  .route("/removeMemberFromWorkspace")
  .delete(
    verifyWorkspace(),
    validate(validations.removeMemberFromWorkspaceValidation),
    authorize("OWNER"),
    removeMemberFromWorkspace
  );

router
  .route("/")
  .post(validate(validations.createValidation), authorize(), createWorkspace);

router.put(
  "/",
  verifyWorkspace(),
  validate(validations.updateValidation),
  authorize(),
  updateWorkspace
);

router.delete("/", verifyWorkspace(), authorize(), deleteWorkspace);

router.patch(
  "/ready-status",
  verifyWorkspace(),
  validate(validations.updateReadyStatusValidation),
  authorize(),
  updateWorkspaceReadyStatus
);

router.patch(
  "/progress",
  verifyWorkspace(),
  validate(validations.updateProgressValidation),
  authorize(),
  updateWorkspaceProgress
);

router.get(
  "/progress",
  verifyWorkspace(),
  validate(validations.getProgressValidation),
  authorize(),
  getWorkspaceProgress
);

module.exports = router;
