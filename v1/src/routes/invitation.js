const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/authorize");
const verifyWorkspace = require("../middlewares/verifyWorkspace");
const {
    inviteUserToBoard,
    acceptInvitation,
    declineInvitation,
    getInvitationsForUser
} = require("../controllers/invitation");
const validations = require("../validations/invitation");

router.post(
    "/invite",
    verifyWorkspace(),
    validate(validations.inviteUserValidation),
    authorize(),
    inviteUserToBoard
);

router.post(
    "/accept/:invitationId",
    validate(validations.invitationIdValidation),
    authorize(),
    acceptInvitation
);

router.post(
    "/decline/:invitationId",
    validate(validations.invitationIdValidation),
    authorize(),
    declineInvitation
);

router.get(
    "/my-invitations",
    authorize(),
    getInvitationsForUser
);

module.exports = router;
