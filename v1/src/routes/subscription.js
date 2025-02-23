const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/authorize");
const {
    getSubscriptionOverview,
    getSubscriptionMembers,
    removeUserFromSubscription,
    getSubscriptionInvitations,
    inviteToSubscription,
    revokeInvitation
} = require("../controllers/subscription");
const validations = require("../validations/subscription");

router.get(
    "/overview",
    validate(validations.getSubscriptionOverviewValidation),
    authorize(),
    getSubscriptionOverview
);

router.get(
    "/members",
    validate(validations.getSubscriptionMembersValidation),
    authorize(),
    getSubscriptionMembers
);

router.delete(
    "/members/:userId",
    authorize(),
    validate(validations.removeUserValidation),
    removeUserFromSubscription
);

router.get(
    "/invitations",
    validate(validations.getSubscriptionInvitationsValidation),
    authorize(),
    getSubscriptionInvitations
);

router.post(
    "/invite",
    authorize(),
    validate(validations.inviteToSubscriptionValidation),
    inviteToSubscription
);

router.delete(
    "/invitations/:invitationId",
    authorize(),
    validate(validations.revokeInvitationValidation),
    revokeInvitation
);

module.exports = router; 