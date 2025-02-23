const Joi = require("joi");

// Subscription'a davet için validasyon
const inviteToSubscriptionValidation = Joi.object({
    emails: Joi.array()
        .items(Joi.string().email())
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one email is required',
            'string.email': 'Invalid email format'
        }),
    role: Joi.string()
        .valid("ADMIN", "MEMBER")
        .default("MEMBER"),
    workspaces: Joi.array()
        .items(Joi.string().length(24))
        .optional()
});

// Kullanıcı silme validasyonu
const removeUserValidation = Joi.object({
    userId: Joi.string()
        .required()
        .min(36)
        .max(36)
        .messages({
            'string.length': 'Invalid user ID format',
            'any.required': 'User ID is required'
        })
});

// Davetiye iptal validasyonu
const revokeInvitationValidation = Joi.object({
    invitationId: Joi.string()
        .required()
        .length(24)
        .messages({
            'string.length': 'Invalid invitation ID format',
            'any.required': 'Invitation ID is required'
        })
});

// Davetiye kabul validasyonu
const acceptInvitationValidation = Joi.object({
    invitationId: Joi.string()
        .required()
        .length(24)
        .messages({
            'string.length': 'Invalid invitation ID format',
            'any.required': 'Invitation ID is required'
        })
});

// Subscription overview için query parametreleri
const getSubscriptionOverviewValidation = Joi.object({
    includeInactiveWorkspaces: Joi.boolean()
        .default(false),
    includeDeletedWorkspaces: Joi.boolean()
        .default(false)
});

// Subscription üyeleri için query parametreleri
const getSubscriptionMembersValidation = Joi.object({
    page: Joi.number()
        .min(1)
        .default(1),
    limit: Joi.number()
        .min(1)
        .max(100)
        .default(20),
    search: Joi.string()
        .min(2)
        .max(50)
        .optional(),
    sortBy: Joi.string()
        .valid('firstName', 'lastName', 'workspaceCount', 'joinedAt')
        .default('joinedAt'),
    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
});

// Subscription davetleri için query parametreleri
const getSubscriptionInvitationsValidation = Joi.object({
    status: Joi.string()
        .valid('pending', 'accepted', 'declined', 'expired', 'all')
        .default('pending'),
    page: Joi.number()
        .min(1)
        .default(1),
    limit: Joi.number()
        .min(1)
        .max(100)
        .default(20),
    search: Joi.string()
        .min(2)
        .max(50)
        .optional(),
    sortBy: Joi.string()
        .valid('createdAt', 'expiresAt', 'inviteeEmail')
        .default('createdAt'),
    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
});

module.exports = {
    inviteToSubscriptionValidation,
    removeUserValidation,
    revokeInvitationValidation,
    acceptInvitationValidation,
    getSubscriptionOverviewValidation,
    getSubscriptionMembersValidation,
    getSubscriptionInvitationsValidation
}; 