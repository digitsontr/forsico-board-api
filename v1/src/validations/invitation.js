const Joi = require("joi");

const inviteUserValidation = Joi.object({
    inviterId: Joi.string().required().min(36).max(36),
    inviteeEmails: Joi.array().items(Joi.string().email()).required(),
    boardId: Joi.string().required().min(24).max(24)
});

const invitationIdValidation = Joi.object({
    invitationId: Joi.string().required().min(24).max(24)
});

module.exports = {
    inviteUserValidation,
    invitationIdValidation
};
